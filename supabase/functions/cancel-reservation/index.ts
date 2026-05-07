/**
 * Edge Function : cancel-reservation
 * Annulation manuelle par le finder ou le sharer.
 * Rembourse selon les règles :
 *   - Annulation avant 2 min : remboursement 100%
 *   - Annulation après 2 min : remboursement 50%
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { reservation_id, user_id, reason } = await req.json();

  // Charger la réservation
  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", reservation_id)
    .single();

  if (error || !reservation) {
    return new Response(JSON.stringify({ error: "Réservation introuvable" }), { status: 404 });
  }

  // Vérifier que l'utilisateur est bien le finder ou le sharer
  if (reservation.finder_id !== user_id && reservation.sharer_id !== user_id) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 403 });
  }

  if (reservation.status !== "reserved") {
    return new Response(
      JSON.stringify({ error: "Réservation non annulable (statut: " + reservation.status + ")" }),
      { status: 400 }
    );
  }

  // Calculer le remboursement
  const reservedAt = new Date(reservation.reserved_at).getTime();
  const now = Date.now();
  const minutesElapsed = (now - reservedAt) / 60000;

  const refundRate = minutesElapsed < 2 ? 1.0 : 0.5;
  const refundAmount = Math.round(reservation.coin_amount * refundRate);

  // Annuler
  await supabase
    .from("reservations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason ?? "user_cancelled",
    })
    .eq("id", reservation_id);

  // Remettre la place disponible
  await supabase
    .from("parking_spots")
    .update({ status: "available" })
    .eq("id", reservation.spot_id);

  // Rembourser le finder
  if (refundAmount > 0) {
    await supabase.rpc("process_coin_transaction", {
      p_user_id: reservation.finder_id,
      p_amount: refundAmount,
      p_type: "refund",
      p_description: `↩️ Remboursement annulation (${Math.round(refundRate * 100)}%)`,
      p_reservation_id: reservation_id,
    });
  }

  // Notifications
  const cancelledByFinder = user_id === reservation.finder_id;

  await supabase.from("notifications").insert([
    {
      user_id: reservation.finder_id,
      reservation_id,
      type: "reservation_cancelled",
      title: "❌ Réservation annulée",
      body: refundAmount > 0
        ? `${refundAmount} SC remboursés sur votre compte.`
        : "Aucun remboursement (annulation tardive).",
    },
    {
      user_id: reservation.sharer_id,
      reservation_id,
      type: "reservation_cancelled",
      title: "❌ Réservation annulée",
      body: cancelledByFinder
        ? "Le conducteur a annulé. Votre place est de nouveau visible."
        : "Vous avez annulé la réservation.",
    },
  ]);

  return new Response(
    JSON.stringify({ success: true, refund_amount: refundAmount, refund_rate: refundRate }),
    { headers: { "Content-Type": "application/json" } }
  );
});
