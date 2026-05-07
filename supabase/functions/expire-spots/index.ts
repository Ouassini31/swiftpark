/**
 * Edge Function : expire-spots
 * Appelée par pg_cron toutes les minutes.
 * - Expire les places non réservées
 * - Annule et rembourse les réservations expirées
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const now = new Date().toISOString();
  let processed = 0;

  // 1. Expirer les places disponibles dont le timer est écoulé
  const { data: expiredSpots, error: spotsErr } = await supabase
    .from("parking_spots")
    .update({ status: "expired" })
    .eq("status", "available")
    .lt("expires_at", now)
    .select("id");

  if (!spotsErr) {
    processed += expiredSpots?.length ?? 0;
    console.log(`⏰ ${expiredSpots?.length ?? 0} places expirées`);
  }

  // 2. Annuler et rembourser les réservations expirées
  const { data: expiredReservations } = await supabase
    .from("reservations")
    .update({
      status: "cancelled",
      cancel_reason: "timeout",
      cancelled_at: now,
    })
    .eq("status", "reserved")
    .lt("expires_at", now)
    .select("id, finder_id, coin_amount, spot_id");

  if (expiredReservations && expiredReservations.length > 0) {
    for (const res of expiredReservations) {
      // Rembourser le finder
      await supabase.rpc("process_coin_transaction", {
        p_user_id: res.finder_id,
        p_amount: res.coin_amount,
        p_type: "refund",
        p_description: "↩️ Remboursement — réservation expirée",
        p_reservation_id: res.id,
      });

      // Remettre la place disponible si elle n'est pas expirée
      await supabase
        .from("parking_spots")
        .update({ status: "available" })
        .eq("id", res.spot_id)
        .eq("status", "reserved");

      // Notifier le finder
      await supabase.from("notifications").insert({
        user_id: res.finder_id,
        reservation_id: res.id,
        type: "reservation_expired",
        title: "⏰ Réservation expirée",
        body: `Votre réservation a expiré. ${res.coin_amount} SC remboursés.`,
      });

      processed++;
    }

    console.log(`🔄 ${expiredReservations.length} réservations annulées et remboursées`);
  }

  return new Response(
    JSON.stringify({ success: true, processed, timestamp: now }),
    { headers: { "Content-Type": "application/json" } }
  );
});
