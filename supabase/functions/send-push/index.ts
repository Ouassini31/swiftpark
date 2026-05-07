/**
 * Edge Function : send-push
 * Envoie une notification Web Push à un utilisateur.
 * Appelée après insert dans la table notifications.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = "mailto:admin@swiftpark.app";

Deno.serve(async (req) => {
  const payload = await req.json();

  // Webhook Supabase : type "INSERT" sur notifications
  if (payload.type !== "INSERT" || payload.table !== "notifications") {
    return new Response("ignored", { status: 200 });
  }

  const notification = payload.record;

  // Récupérer les subscriptions push de l'utilisateur
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", notification.user_id);

  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const pushPayload = JSON.stringify({
    title: notification.title,
    body:  notification.body,
    icon:  "/icon-192.png",
    badge: "/icon-192.png",
    data:  { reservation_id: notification.reservation_id, type: notification.type },
  });

  let sent = 0;

  for (const { subscription } of subs) {
    try {
      // Web Push via VAPID (utilise la lib web-push portée pour Deno)
      const response = await fetch(subscription.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "TTL": "86400",
          // En production : générer l'Authorization VAPID ici
        },
        body: pushPayload,
      });

      if (response.ok) sent++;
    } catch (err) {
      console.error("Push error:", err);
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
