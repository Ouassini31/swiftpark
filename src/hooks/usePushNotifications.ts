"use client";

import { useEffect, useState } from "react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";

export function usePushNotifications() {
  const profile = useMapStore((s) => s.profile);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  // Enregistrer le Service Worker
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW enregistré:", reg.scope))
      .catch((err) => console.warn("SW erreur:", err));
  }, []);

  // Demander la permission + sauvegarder la subscription
  async function requestPermission() {
    if (!("Notification" in window) || !("PushManager" in window)) return;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted" || !profile) return;

    const reg = await navigator.serviceWorker.ready;

    // Clé publique VAPID (à remplacer par la vraie clé)
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
    });

    // Sauvegarder la subscription dans Supabase
    const supabase = createClient();
    await supabase.from("push_subscriptions").upsert({
      user_id: profile.id,
      subscription: sub.toJSON(),
      created_at: new Date().toISOString(),
    });
  }

  return { permission, requestPermission };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
}
