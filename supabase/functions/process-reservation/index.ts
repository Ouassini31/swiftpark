/**
 * Edge Function : process-reservation
 * Appelée après qu'une réservation est créée.
 * - Débite les SC du finder
 * - Crée les notifications
 * - Planifie l'expiration
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

  const { reservation_id } = await req.json();
  if (!reservation_id) {
    return new Response(JSON.stringify({ error: "reservation_id requis" }), { status: 400 });
  }

  // Charger la réservation
  const { data: reservation, error: resErr } = await supabase
    .from("reservations")
    .select("*, parking_spots(*)")
    .eq("id", reservation_id)
    .single();

  if (resErr || !reservation) {
    return new Response(JSON.stringify({ error: "Réservation introuvable" }), { status: 404 });
  }

  // 1. Vérifier le solde du finder
  const { data: finder } = await supabase
    .from("profiles")
    .select("coin_balance")
    .eq("id", reservation.finder_id)
    .single();

  if (!finder || finder.coin_balance < reservation.coin_amount) {
    // Annuler la réservation
    await supabase
      .from("reservations")
      .update({ status: "cancelled", cancel_reason: "insufficient_balance", cancelled_at: new Date().toISOString() })
      .eq("id", reservation_id);

    return new Response(
      JSON.stringify({ success: false, reason: "Solde insuffisant" }),
      { status: 200 }
    );
  }

  // 2. Débiter les SC du finder (atomic via RPC)
  const { error: txError } = await supabase.rpc("process_coin_transaction", {
    p_user_id: reservation.finder_id,
    p_amount: -reservation.coin_amount,
    p_type: "spend",
    p_description: `🔑 Réservation place — ${reservation.coin_amount} SC`,
    p_reservation_id: reservation_id,
  });

  if (txError) {
    console.error("TX Error:", txError);
    return new Response(JSON.stringify({ error: txError.message }), { status: 500 });
  }

  // 3. Marquer la place comme réservée
  await supabase
    .from("parking_spots")
    .update({ status: "reserved" })
    .eq("id", reservation.spot_id);

  // 4. Notifications (déjà gérées par trigger SQL, mais on enrichit)
  console.log(`✅ Réservation ${reservation_id} traitée avec succès`);

  return new Response(
    JSON.stringify({ success: true, reservation_id }),
    { headers: { "Content-Type": "application/json" } }
  );
});
