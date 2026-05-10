/**
 * Edge Function : pre-departure-nudge   — Moment 4
 * Appelée par pg_cron toutes les minutes.
 *
 * Flow :
 *   1. Trouve les places qui expirent dans 10–12 min (fenêtre de détection)
 *      ET dont le sharer n'a pas encore été nudgé (nudge_sent_at IS NULL).
 *   2. Envoie une push "Vous partez bien dans 10 min ?" au sharer.
 *   3. Marque nudge_sent_at = now() sur la place.
 *   4. Planifie un second nudge à +2 min si pas de réponse (nudge2_sent_at IS NULL).
 *   5. Si la place expire sans que le sharer ait confirmé → annule + rembourse.
 *
 * Colonnes requises sur parking_spots (migration à joindre si absentes) :
 *   nudge_sent_at      timestamptz
 *   nudge2_sent_at     timestamptz
 *   sharer_confirmed   boolean DEFAULT false
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Helper : envoyer une notification dans la table + push web (via send-push)
async function notify(userId: string, title: string, message: string, url: string) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type:    "pre_departure",
    title,
    message,
    url,
    read:    false,
  });

  // Appel vers la fonction send-push si elle existe
  try {
    await supabase.functions.invoke("send-push", {
      body: { user_id: userId, title, body: message, url },
    });
  } catch {
    // send-push optionnel — silencieux si absent
  }
}

Deno.serve(async () => {
  const now      = new Date();
  const in10min  = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const in12min  = new Date(now.getTime() + 12 * 60 * 1000).toISOString();
  const in2min   = new Date(now.getTime() +  2 * 60 * 1000).toISOString();
  const in4min   = new Date(now.getTime() +  4 * 60 * 1000).toISOString();
  let actions    = 0;

  /* ── 1. Premier nudge (10 min avant expiration) ─────────────────── */
  const { data: firstNudge } = await supabase
    .from("parking_spots")
    .select("id, sharer_id, address, coin_price")
    .in("status", ["available", "reserved"])
    .gte("expires_at", in10min)
    .lte("expires_at", in12min)
    .is("nudge_sent_at", null)   // pas encore nudgé
    .eq("sharer_confirmed", false);

  for (const spot of (firstNudge ?? [])) {
    await notify(
      spot.sharer_id,
      "🕐 Vous partez bientôt ?",
      `Votre place${spot.address ? ` (${spot.address.split(",")[0]})` : ""} expire dans 10 min. Confirmez votre départ ou prolongez.`,
      "/map"
    );

    await supabase
      .from("parking_spots")
      .update({ nudge_sent_at: now.toISOString() })
      .eq("id", spot.id);

    console.log(`📣 Nudge 1 envoyé → spot ${spot.id}`);
    actions++;
  }

  /* ── 2. Second nudge (2 min après le premier, si pas de réponse) ── */
  const twoMinAgo  = new Date(now.getTime() -  2 * 60 * 1000).toISOString();
  const fourMinAgo = new Date(now.getTime() -  4 * 60 * 1000).toISOString();

  const { data: secondNudge } = await supabase
    .from("parking_spots")
    .select("id, sharer_id, address")
    .in("status", ["available", "reserved"])
    .gte("expires_at", in2min)
    .lte("expires_at", in4min)
    .gte("nudge_sent_at", fourMinAgo) // nudgé il y a 2–4 min
    .lte("nudge_sent_at", twoMinAgo)
    .is("nudge2_sent_at", null)
    .eq("sharer_confirmed", false);

  for (const spot of (secondNudge ?? [])) {
    await notify(
      spot.sharer_id,
      "⚠️ Dernière chance",
      `Confirmez votre départ maintenant ou votre place sera annulée dans 2 min.`,
      "/map"
    );

    await supabase
      .from("parking_spots")
      .update({ nudge2_sent_at: now.toISOString() })
      .eq("id", spot.id);

    console.log(`📣 Nudge 2 envoyé → spot ${spot.id}`);
    actions++;
  }

  /* ── 3. Auto-cancel si sharer n'a pas confirmé et place expirée ── */
  // (géré par expire-spots + cancel-reservation ; ici on notifie les B)
  // On cherche les réservations annulées dans la dernière minute sans refund notif
  const oneMinAgo = new Date(now.getTime() - 60 * 1000).toISOString();

  const { data: cancelledRes } = await supabase
    .from("reservations")
    .select(`
      id, finder_id, coin_amount,
      parking_spots ( address )
    `)
    .eq("status", "cancelled")
    .eq("cancel_reason", "timeout")
    .gte("cancelled_at", oneMinAgo)
    .is("finder_notified_at", null);

  for (const res of (cancelledRes ?? [])) {
    const addr = (res.parking_spots as { address?: string })?.address;
    await notify(
      res.finder_id,
      "↩️ Remboursement automatique",
      `Le partageur n'a pas confirmé à temps. Tes ${res.coin_amount} SC ont été remboursés. Cherche une autre place !`,
      "/map"
    );

    await supabase
      .from("reservations")
      .update({ finder_notified_at: now.toISOString() })
      .eq("id", res.id);

    console.log(`↩️ Finder notifié du remboursement → reservation ${res.id}`, addr);
    actions++;
  }

  return new Response(
    JSON.stringify({ success: true, actions, timestamp: now.toISOString() }),
    { headers: { "Content-Type": "application/json" } }
  );
});
