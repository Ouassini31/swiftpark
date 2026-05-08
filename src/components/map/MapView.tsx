"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMapStore } from "@/store/useMapStore";
import type { Database } from "@/types/database";

type Spot = Database["public"]["Tables"]["parking_spots"]["Row"];

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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const STYLE_LIGHT  = "mapbox://styles/mapbox/streets-v12";
const STYLE_DARK   = "mapbox://styles/mapbox/dark-v11";

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef     = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  const { mapLat, mapLng, mapZoom, userLat, userLng, spots, selectSpot } = useMapStore();

  // Init Mapbox
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    async function init() {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !mapContainer.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const isDark = document.documentElement.dataset.theme === "dark";

      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: isDark ? STYLE_DARK : STYLE_LIGHT,
        center: [mapLng, mapLat],
        zoom: mapZoom,
        attributionControl: false,
      });

      mapRef.current = map;

      // Changer style au changement de thème
      const obs = new MutationObserver(() => {
        if (!mapRef.current) return;
        const dark = document.documentElement.dataset.theme === "dark";
        mapRef.current.setStyle(dark ? STYLE_DARK : STYLE_LIGHT);
      });
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      map.on("remove", () => obs.disconnect());
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* ignoré */ }
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marqueur utilisateur (point bleu pulsé)
  useEffect(() => {
    if (!mapRef.current || !userLat || !userLng) return;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = (mapRef.current as any)._userMarker;
      if (existing) existing.remove();

      const el = document.createElement("div");
      el.style.cssText = [
        "width:18px", "height:18px",
        "background:#3b82f6",
        "border:3px solid #fff",
        "border-radius:50%",
        "box-shadow:0 0 0 8px rgba(59,130,246,.2)",
      ].join(";");

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([userLng, userLat])
        .addTo(mapRef.current);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapRef.current as any)._userMarker = marker;
      mapRef.current.flyTo({ center: [userLng, userLat], zoom: 15, duration: 1200 });
    })();
  }, [userLat, userLng]);

  // Centrer la carte
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({ center: [mapLng, mapLat], zoom: mapZoom, duration: 600 });
  }, [mapLat, mapLng, mapZoom]);

  // Marqueurs des places
  const createMarker = useCallback(
    async (spot: Spot) => {
      if (!mapRef.current) return;
      const mapboxgl = (await import("mapbox-gl")).default;

      const horizon = getHorizon(spot.expires_at);
      const color   = HORIZON_COLOR[horizon];
      const eta     = getEta(spot.expires_at);

      const el = document.createElement("div");
      el.style.cssText = [
        `background:${color}`,
        "color:#fff",
        "border-radius:20px",
        "padding:6px 12px",
        "font-size:12px",
        "font-weight:800",
        "white-space:nowrap",
        "box-shadow:0 4px 12px rgba(0,0,0,.25)",
        "cursor:pointer",
        "border:2px solid rgba(255,255,255,.3)",
        "transition:transform .15s",
      ].join(";");
      el.textContent = `${spot.coin_price} SC · ${eta}`;
      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.08)"; });
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
      el.addEventListener("click", () => selectSpot(spot));

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([spot.lng, spot.lat])
        .addTo(mapRef.current);

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
