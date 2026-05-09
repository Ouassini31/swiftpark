"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { haversineDistance } from "@/lib/utils";

interface LiveTrackingMapProps {
  spotLat: number;
  spotLng: number;
  finderLat: number | null;
  finderLng: number | null;
  isFinderOnline: boolean;
  role: "sharer" | "finder";
}

export default function LiveTrackingMap({
  spotLat,
  spotLng,
  finderLat,
  finderLng,
  isFinderOnline,
  role,
}: LiveTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finderMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  // Compute badge values
  const distance =
    finderLat != null && finderLng != null
      ? haversineDistance(finderLat, finderLng, spotLat, spotLng)
      : null;

  const distanceLabel =
    distance != null
      ? distance < 1000
        ? `À ${Math.round(distance)} m`
        : `À ${(distance / 1000).toFixed(1)} km`
      : null;

  const etaMinutes =
    distance != null ? Math.ceil(distance / 83) : null;
  const etaLabel =
    etaMinutes != null
      ? etaMinutes < 60
        ? `~${etaMinutes} min à pied`
        : `~${Math.round(etaMinutes / 60)}h à pied`
      : null;

  const [mapReady, setMapReady] = useState(false);

  // Init map (client-only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapContainerRef.current) return;

    let cancelled = false;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapContainerRef.current) return;

      // Avoid double-init (React Strict Mode)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const container = mapContainerRef.current as any;
      if (container._leaflet_id) {
        container._leaflet_id = null;
        container.innerHTML = "";
      }

      LRef.current = L;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Green spot marker
      const spotIcon = L.divIcon({
        className: "",
        html: `<div style="
          width: 18px; height: 18px;
          background: #22956b;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.marker([spotLat, spotLng], { icon: spotIcon })
        .addTo(map)
        .bindPopup(role === "finder" ? "📍 Place" : "📍 Votre place");

      mapRef.current = map;

      // Set initial view
      map.setView([spotLat, spotLng], 15);
      if (!cancelled) setMapReady(true);
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        finderMarkerRef.current = null;
        polylineRef.current = null;
      }
    };
    // spotLat/spotLng/role are static per reservation — no need to react to changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update finder marker & polyline when position changes
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    if (finderLat == null || finderLng == null || !isFinderOnline) {
      // Hide finder marker & line
      if (finderMarkerRef.current) {
        finderMarkerRef.current.remove();
        finderMarkerRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      return;
    }

    // Blue animated dot for finder
    const finderIcon = L.divIcon({
      className: "",
      html: `<div style="
        width: 20px; height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(59,130,246,0.5);
        animation: pulse-blue 1.5s infinite;
      "></div>
      <style>
        @keyframes pulse-blue {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
        }
      </style>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (finderMarkerRef.current) {
      finderMarkerRef.current.setLatLng([finderLat, finderLng]);
    } else {
      finderMarkerRef.current = L.marker([finderLat, finderLng], { icon: finderIcon })
        .addTo(map)
        .bindPopup("🚶 Conducteur");
    }

    // Dashed polyline
    if (polylineRef.current) {
      polylineRef.current.setLatLngs([
        [finderLat, finderLng],
        [spotLat, spotLng],
      ]);
    } else {
      polylineRef.current = L.polyline(
        [
          [finderLat, finderLng],
          [spotLat, spotLng],
        ],
        {
          color: "#3b82f6",
          weight: 2,
          dashArray: "6, 8",
          opacity: 0.7,
        }
      ).addTo(map);
    }

    // Fit bounds to show both points
    map.fitBounds(
      [
        [finderLat, finderLng],
        [spotLat, spotLng],
      ],
      { padding: [40, 40] }
    );
  }, [finderLat, finderLng, isFinderOnline, spotLat, spotLng]);

  return (
    <div className="relative w-full h-full">

      {/* Skeleton pendant le chargement de Leaflet */}
      {!mapReady && (
        <div className="absolute inset-0 z-[500] bg-gray-100 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#22956b] border-t-transparent animate-spin" />
          <p className="text-xs text-gray-400 font-semibold">Chargement de la carte…</p>
        </div>
      )}

      {/* Badges distance / ETA */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-1.5 pointer-events-none">
        {!isFinderOnline ? (
          <div className="bg-white/90 backdrop-blur-sm text-gray-500 text-xs font-semibold px-4 py-2 rounded-full shadow-md flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse inline-block" />
            En attente du conducteur…
          </div>
        ) : (
          <>
            {distanceLabel && (
              <div className="bg-white/95 backdrop-blur-sm text-[#22956b] text-sm font-black px-4 py-1.5 rounded-full shadow-md">
                {distanceLabel}
              </div>
            )}
            {etaLabel && (
              <div className="bg-[#22956b]/90 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                {etaLabel}
              </div>
            )}
          </>
        )}
      </div>

      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
