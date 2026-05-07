import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function POST(req: NextRequest) {
  // Config VAPID (lazy — évite l'erreur au build si les clés sont absentes)
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      "mailto:contact@swiftpark.app",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
  try {
    const body = await req.json();
    const { spot_id, title, message, url = "/map" } = body;

    if (!spot_id || !title || !message) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Client Supabase server
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get:    (name: string) => cookieStore.get(name)?.value,
          set:    (name: string, value: string, options: CookieOptions) => { try { (cookieStore as any).set({ name, value, ...options }); } catch {} },
          remove: (name: string, options: CookieOptions) => { try { (cookieStore as any).set({ name, value: "", ...options }); } catch {} },
        },
      }
    );

    // Récupérer la place pour avoir les coords
    const { data: spot } = await supabase
      .from("parking_spots")
      .select("lat, lng")
      .eq("id", spot_id)
      .single();

    if (!spot) return NextResponse.json({ error: "Place introuvable" }, { status: 404 });

    // Trouver les abonnés dans un rayon de 2 km
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("subscription, user_id") as { data: { subscription: unknown; user_id: string }[] | null };

    if (!subscriptions?.length) {
      return NextResponse.json({ sent: 0 });
    }

    const payload = JSON.stringify({ title, body: message, url, tag: `spot-${spot_id}` });
    let sent = 0;
    const failed: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await webpush.sendNotification(sub.subscription as any, payload);
          sent++;
        } catch {
          failed.push(sub.user_id);
        }
      })
    );

    // Nettoyer les subscriptions invalides
    if (failed.length > 0) {
      await supabase.from("push_subscriptions").delete().in("user_id", failed);
    }

    return NextResponse.json({ sent, failed: failed.length });
  } catch (err) {
    console.error("[notify]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
