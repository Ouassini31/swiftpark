import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function initVapid() {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      "mailto:contact@swiftpark.app",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, title, message, url = "/map" } = body;

    if (!user_id || !title || !message) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Insérer la notification en base (in-app)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("notifications").insert({
      user_id,
      type:  body.type ?? "info",
      title,
      body:  message,
      data:  body.data ?? {},
      reservation_id: body.reservation_id ?? null,
    });

    // Push notification si VAPID configuré
    if (!initVapid()) {
      return NextResponse.json({ sent: 0, reason: "VAPID non configuré" });
    }

    // Récupérer la subscription de l'utilisateur ciblé
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sub } = await (supabase as any)
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", user_id)
      .maybeSingle() as { data: { subscription: unknown } | null };

    if (!sub) {
      return NextResponse.json({ sent: 0, reason: "Pas de subscription push" });
    }

    const payload = JSON.stringify({ title, body: message, url });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await webpush.sendNotification(sub.subscription as any, payload);
      return NextResponse.json({ sent: 1 });
    } catch {
      // Subscription invalide → on la supprime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("push_subscriptions").delete().eq("user_id", user_id);
      return NextResponse.json({ sent: 0, reason: "Subscription expirée" });
    }
  } catch (err) {
    console.error("[notify]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
