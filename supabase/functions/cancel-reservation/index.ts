/**
 * Edge Function : cancel-reservation
 * Annulation manuelle par le finder ou le sharer.
 * Rembourse selon les règles :
 *   - Annulation par le sharer : remboursement 100%
 *   - Annulation par le finder avant 2 min : remboursement 100%
 *   - Annulation par le finder après 2 min : remboursement 50%
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS });
  }

  // L'identité vient du jeton de session, jamais du corps de la requête
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return json(401, { error: "Non authentifié" });
  }

  const { reservation_id } = await req.json();

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", reservation_id)
    .single();

  if (error || !reservation) {
    return json(404, { error: "Échange introuvable" });
  }

  if (reservation.finder_id !== user.id && reservation.sharer_id !== user.id) {
    return json(403, { error: "Non autorisé" });
  }

  if (reservation.status !== "reserved") {
    return json(400, { error: "Échange non annulable (statut: " + reservation.status + ")" });
  }

  const cancelledByFinder = user.id === reservation.finder_id;
  const reservedAt = new Date(reservation.reserved_at).getTime();
  const minutesElapsed = (Date.now() - reservedAt) / 60000;

  const refundRate = cancelledByFinder && minutesElapsed >= 2 ? 0.5 : 1.0;

  // L'annulation et le remboursement se font ensemble : deux appels simultanés ne remboursent qu'une fois
  const { data: refundAmount, error: cancelError } = await supabase.rpc("annuler_echange", {
    p_reservation_id: reservation_id,
    p_taux: refundRate,
    p_raison: cancelledByFinder ? "cancelled_by_finder" : "cancelled_by_sharer",
    p_description: `↩️ Remboursement annulation (${Math.round(refundRate * 100)}%)`,
  });

  if (cancelError) {
    console.error("annuler_echange", cancelError);
    return json(500, { error: "Annulation impossible" });
  }

  if (refundAmount === null) {
    return json(400, { error: "Échange déjà terminé ou annulé" });
  }

  // Le partageur qui annule ne part plus : sa place quitte la carte
  if (!cancelledByFinder) {
    await supabase
      .from("parking_spots")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: "cancelled_by_sharer",
      })
      .eq("id", reservation.spot_id);
  }

  await supabase.from("notifications").insert([
    {
      user_id: reservation.finder_id,
      reservation_id,
      type: "reservation_cancelled",
      title: "❌ Échange annulé",
      body: refundAmount > 0
        ? `${refundAmount} SC remboursés sur ton compte.`
        : "Aucun remboursement.",
    },
    {
      user_id: reservation.sharer_id,
      reservation_id,
      type: "reservation_cancelled",
      title: "❌ Échange annulé",
      body: cancelledByFinder
        ? "Le conducteur a annulé. Ton info est de nouveau visible."
        : "Tu as annulé l'échange.",
    },
  ]);

  return json(200, { success: true, refund_amount: refundAmount, refund_rate: refundRate });
});
