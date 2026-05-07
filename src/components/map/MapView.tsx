"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMapStore } from "@/store/useMapStore";
import type { Database } from "@/types/database";

type Spot = Database["public"]["Tables"]["parking_spots"]["Row"];

// Couleurs par horizon (identiques au prototype)
const HORIZON_COLOR: Record<string, string> = {
  now: "#22956b",
  "15": "#f59e0b",
  "1h": "#3b82f6",
  "2h": "#7c3aed",
};

function getHorizon(expiresAt: string): keyof typeof HORIZON_COLOR {
  const mins = (new Date(expiresAt).getTime() - Date.now()) / 60000;
  if (mins <= 5)  return "now";
  if (mins <= 20) return "15";
  if (mins <= 75) return "1h";
  return "2h";
}

function getEta(expiresAt: string): string {
  const mins = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000));
  if (mins <= 2) return "2 min";
  if (mins < 60) return `${mins} min`;
  return `${Math.round(mins / 60)}h`;
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  const { mapLat, mapLng, mapZoom, userLat, userLng, spots, selectSpot } = useMapStore();

  // Initialisation Leaflet (client-only)
  useEffect(() => {
    if (!mapContainer.current) return;

    // Flag d'annulation pour gérer le double-mount React Strict Mode :
    // si le cleanup s'exécute avant que init() termine, on détruit la carte aussitôt.
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let obs: any = null;

    async function init() {
      const L = (await import("leaflet")).default;

      // Si le cleanup a déjà été appelé, on n'initialise pas
      if (cancelled || !mapContainer.current) return;

      // Nettoie toute instance Leaflet résiduelle sur ce container
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const container = mapContainer.current as any;
      if (container._leaflet_id) {
        try { container._leaflet_map?.remove(); } catch { /* ignoré */ }
        delete container._leaflet_id;
      }

      const isDark = document.documentElement.dataset.theme === "dark";

      const map = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([mapLat, mapLng], mapZoom);

      // Deuxième vérification post-await : le cleanup peut survenir entre les awaits
      if (cancelled) {
        try { map.remove(); } catch { /* ignoré */ }
        return;
      }

      container._leaflet_map = map;

      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
      mapRef.current = map;

      // Mise à jour des tuiles au changement de thème
      obs = new MutationObserver(() => {
        if (!mapRef.current) return;
        const dark = document.documentElement.dataset.theme === "dark";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mapRef.current.eachLayer((l: any) => { if (l._url) mapRef.current!.removeLayer(l); });
        L.tileLayer(
          dark
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { maxZoom: 19 }
        ).addTo(mapRef.current);
      });
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }

    init();

    return () => {
      cancelled = true;
      if (obs) { try { obs.disconnect(); } catch { /* ignoré */ } obs = null; }
      if (mapRef.current) { try { mapRef.current.remove(); } catch { /* ignoré */ } mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marqueur utilisateur (point bleu pulsé)
  useEffect(() => {
    if (!mapRef.current || !userLat || !userLng) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const existing = (mapRef.current as any)._userMarker;
      if (existing) existing.remove();

      const el = document.createElement("div");
      el.className = "user-dot";
      el.style.cssText =
        "width:16px;height:16px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 8px rgba(59,130,246,.18)";

      const icon = L.divIcon({ html: el, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
      const m = L.marker([userLat, userLng], { icon }).addTo(mapRef.current);
      (mapRef.current as any)._userMarker = m;
      mapRef.current.flyTo([userLat, userLng], 15, { duration: 1.2 });
    })();
  }, [userLat, userLng]);

  // Centrer la carte
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([mapLat, mapLng], mapZoom, { animate: true, duration: 0.6 });
  }, [mapLat, mapLng, mapZoom]);

  // Marqueurs des places
  const createMarker = useCallback(
    async (spot: Spot) => {
      if (!mapRef.current) return;
      const L = (await import("leaflet")).default;

      const horizon = getHorizon(spot.expires_at);
      const color   = HORIZON_COLOR[horizon];
      const eta     = getEta(spot.expires_at);

      const el = document.createElement("div");
      el.style.cssText = [
        `background:${color}`,
        "color:#fff",
        "border-radius:12px",
        "padding:5px 10px",
        "font-size:11px",
        "font-weight:800",
        "white-space:nowrap",
        "box-shadow:0 3px 10px rgba(0,0,0,.25)",
        "cursor:pointer",
        "position:relative",
      ].join(";");
      el.textContent = `${spot.coin_price} SC · ${eta}`;
      el.addEventListener("click", () => selectSpot(spot));

      const icon = L.divIcon({ html: el, className: "", iconAnchor: [36, 28] });
      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(mapRef.current);
      markersRef.current.set(spot.id, marker);
    },
    [selectSpot]
  );

  useEffect(() => {
    const currentIds = new Set(spots.map((s) => s.id));

    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    spots.forEach((spot) => {
      if (!markersRef.current.has(spot.id)) createMarker(spot);
    });
  }, [spots, createMarker]);

  return <div ref={mapContainer} className="absolute inset-0 w-full h-full" />;
}
