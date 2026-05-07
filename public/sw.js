/**
 * SwiftPark — Service Worker
 * Gère les notifications push et le cache PWA
 */

const CACHE_NAME = "swiftpark-v1";
const STATIC_ASSETS = ["/", "/map", "/manifest.json", "/icon-192.png"];

// ── Installation ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activation ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch (cache-first pour les assets statiques) ─────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/") || event.request.url.includes("supabase")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request))
  );
});

// ── Push Notifications ────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "SwiftPark", body: event.data.text() };
  }

  const options = {
    body:    payload.body ?? "",
    icon:    payload.icon ?? "/icon-192.png",
    badge:   "/icon-192.png",
    vibrate: [100, 50, 100],
    data:    payload.data ?? {},
    actions: [
      { action: "open",    title: "Voir" },
      { action: "dismiss", title: "Ignorer" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "SwiftPark", options)
  );
});

// ── Clic sur notification ─────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const data = event.notification.data ?? {};
  let url = "/map";

  if (data.reservation_id) url = "/reservations";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          existing.navigate(url);
        } else {
          self.clients.openWindow(url);
        }
      })
  );
});
