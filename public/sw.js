/**
 * SwiftPark — Service Worker v3
 * Push notifications uniquement — pas de cache sur les pages de navigation
 * (les redirects middleware causaient des boucles sur Safari/WebKit)
 */

const CACHE_NAME = "swiftpark-v3";

// Seuls les vrais assets statiques sont cachés (jamais les pages HTML)
const STATIC_ASSETS = ["/manifest.json", "/icon-192.png", "/icon-512.png"];

// ── Installation ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activation : purge tous les anciens caches ────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // API et Supabase → toujours réseau, jamais cache
  if (url.pathname.startsWith("/api/") || url.hostname.includes("supabase")) return;

  // Pages HTML (navigation) → toujours réseau pour que les redirects middleware fonctionnent
  const isNavigation = event.request.mode === "navigate" ||
    event.request.headers.get("accept")?.includes("text/html");
  if (isNavigation) return;

  // Assets statiques (icônes, manifest) → cache-first
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
  // Priorité : url explicite > reservation_id > /map
  const url = data.url ?? (data.reservation_id ? "/reservations" : "/map");

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin));
        if (existing) { existing.focus(); existing.navigate(url); }
        else self.clients.openWindow(url);
      })
  );
});
