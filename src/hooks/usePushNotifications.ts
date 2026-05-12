"use client";

import { useEffect } from "react";
import { createClientAny as createClient } from "@/lib/supabase/client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Enregistre la subscription push si la permission est DÉJÀ accordée.
 *  N'affiche JAMAIS la popup navigateur — c'est la responsabilité de NotifPromptBanner. */
export function usePushNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission !== "granted") return; // ne pas demander ici

    async function subscribe() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        const existing = await reg.pushManager.getSubscription();
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("push_subscriptions")
          .upsert({ user_id: userId, subscription: sub.toJSON() }, { onConflict: "user_id" });
      } catch (err) {
        console.warn("[push]", err);
      }
    }

    subscribe();
  }, [userId]);
}

/** Demander la permission + s'abonner (appelé depuis NotifPromptBanner au clic de l'utilisateur). */
export async function requestPushPermission(userId: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (Notification.permission === "denied") return false;

  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return false;

    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("push_subscriptions")
      .upsert({ user_id: userId, subscription: sub.toJSON() }, { onConflict: "user_id" });

    return true;
  } catch (err) {
    console.warn("[push]", err);
    return false;
  }
}
