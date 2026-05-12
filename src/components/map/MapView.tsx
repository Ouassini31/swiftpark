"use client";

import { useRef, useEffect, useCallback } from "react";
import { useMapStore } from "@/store/useMapStore";
import type { Database } from "@/types/database";

type Spot = Database["public"]["Tables"]["parking_spots"]["Row"];

/* ── Horizon temporel (couleur du marqueur) ── */
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

/* ── Gabarit du véhicule ── */
const CATEGORY_ORDER = ["citadine", "compacte", "berline", "suv", "grand"];

const CATEGORY_SIZE: Record<string, string> = {
  citadine: "XS",
  compacte: "S",
  berline:  "M",
  suv:      "L",
  grand:    "XL",
};

/**
 * Calcule l'opacité du marqueur selon la compatibilité de gabarit.
 * - Compatible (place assez grande)  → 1.0  (pleine visibilité)
 * - Place légèrement juste           → 0.55 (atténué)
 * - Place trop petite                → 0.22 (quasi invisible)
 */
function getCompatibilityOpacity(
  sharerCat: string | null,
  userCat:   string | null,
): number {
  if (!sharerCat || !userCat) return 1;
  const si = CATEGORY_ORDER.indexOf(sharerCat);
  const ui = CATEGORY_ORDER.indexOf(userCat);
  if (si >= ui)       return 1;
  if (si === ui - 1)  return 0.55;
  return 0.22;
}

const MAPBOX_TOKEN  = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const STYLE_LIGHT   = "mapbox://styles/mapbox/streets-v12";
const STYLE_DARK    = "mapbox://styles/mapbox/dark-v11";
const STYLE_SAT     = "mapbox://styles/mapbox/satellite-streets-v12";

export default function MapView({ filteredSpots }: { filteredSpots?: Spot[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef     = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());

  const { mapLat, mapLng, mapZoom, userLat, userLng, spots, selectSpot, profile, isSatellite } = useMapStore();

  const visibleSpots = filteredSpots ?? spots;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userVehicleCategory = (profile as any)?.vehicle_category as string | null ?? null;

  /* ── Init Mapbox ── */
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

      const obs = new MutationObserver(() => {
        if (!mapRef.current) return;
        const dark = document.documentElement.dataset.theme === "dark";
        const sat  = document.documentElement.dataset.satellite === "true";
        mapRef.current.setStyle(sat ? STYLE_SAT : dark ? STYLE_DARK : STYLE_LIGHT);
      });
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-satellite"] });
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

  /* ── Satellite toggle ── */
  useEffect(() => {
    document.documentElement.dataset.satellite = String(isSatellite);
  }, [isSatellite]);

  /* ── Marqueur utilisateur (point bleu pulsé) ── */
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

  /* ── Centrer la carte ── */
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({ center: [mapLng, mapLat], zoom: mapZoom, duration: 600 });
  }, [mapLat, mapLng, mapZoom]);

  /* ── Marqueurs des places ── */
  const createMarker = useCallback(
    async (spot: Spot, userCat: string | null) => {
      if (!mapRef.current) return;
      const mapboxgl = (await import("mapbox-gl")).default;

      const horizon = getHorizon(spot.expires_at);
      const color   = HORIZON_COLOR[horizon];
      const eta     = getEta(spot.expires_at);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sharerCat = (spot as any).sharer_vehicle_category as string | null ?? null;
      const sizeLabel = sharerCat ? CATEGORY_SIZE[sharerCat] : null;
      const opacity   = getCompatibilityOpacity(sharerCat, userCat);

      /* ── Conteneur principal ── */
      const el = document.createElement("div");
      el.style.cssText = [
        "display:flex",
        "align-items:center",
        "gap:6px",
        `opacity:${opacity}`,
        "cursor:pointer",
        "transition:opacity .15s",
      ].join(";");

      /* ── Pill (prix · temps) ── */
      const pill = document.createElement("div");
      pill.style.cssText = [
        `background:${color}`,
        "color:#fff",
        "border-radius:20px",
        "padding:6px 11px",
        "font-size:12px",
        "font-weight:800",
        "white-space:nowrap",
        "box-shadow:0 4px 12px rgba(0,0,0,.25)",
        "border:2px solid rgba(255,255,255,.3)",
        "transition:box-shadow .15s",
      ].join(";");
      pill.textContent = `${spot.coin_price} SC · ${eta}`;
      el.appendChild(pill);

      /* ── Badge gabarit (XS/S/M/L/XL) ── */
      if (sizeLabel) {
        const badge = document.createElement("div");

        // Couleur du badge selon compatibilité
        let badgeBg = "#fff";
        let badgeColor = "#111";
        if (opacity === 1)    { badgeBg = "#fff";       badgeColor = "#111"; }
        if (opacity === 0.55) { badgeBg = "#fff3cd";    badgeColor = "#92400e"; }
        if (opacity === 0.22) { badgeBg = "#fee2e2";    badgeColor = "#991b1b"; }

        badge.style.cssText = [
          `background:${badgeBg}`,
          `color:${badgeColor}`,
          "border-radius:10px",
          "padding:3px 7px",
          "font-size:10px",
          "font-weight:900",
          "white-space:nowrap",
          "box-shadow:0 2px 6px rgba(0,0,0,.18)",
          "letter-spacing:0.03em",
        ].join(";");
        badge.textContent = sizeLabel;
        el.appendChild(badge);
      }

      /* ── Hover ── */
      el.addEventListener("mouseenter", () => {
        pill.style.boxShadow = "0 6px 20px rgba(0,0,0,.4)";
        el.style.opacity = String(Math.min(1, opacity + 0.1));
      });
      el.addEventListener("mouseleave", () => {
        pill.style.boxShadow = "0 4px 12px rgba(0,0,0,.25)";
        el.style.opacity = String(opacity);
      });
      el.addEventListener("click", () => selectSpot(spot));

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([spot.lng, spot.lat])
        .addTo(mapRef.current);

      markersRef.current.set(spot.id, marker);
    },
    [selectSpot]
  );

  /* ── Sync marqueurs ↔ spots visibles ── */
  useEffect(() => {
    const currentIds = new Set(visibleSpots.map((s) => s.id));

    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    visibleSpots.forEach((spot) => {
      if (!markersRef.current.has(spot.id)) createMarker(spot, userVehicleCategory);
    });
  }, [visibleSpots, createMarker, userVehicleCategory]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
