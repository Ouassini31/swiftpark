"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useCallback } from "react";
import { useRealtimeTracking } from "@/hooks/useRealtimeTracking";
import { haversineDistance } from "@/lib/utils";

// Load Leaflet map only on client to avoid SSR issues
const LiveTrackingMap = dynamic(() => import("./LiveTrackingMap"), { ssr: false });

interface TrackingPanelProps {
  reservationId: string;
  spotLat: number;
  spotLng: number;
  role: "finder" | "sharer";
  finderName?: string;
  onClose?: () => void;
}

const DEPART_THRESHOLD_M = 200; // Sharer can leave when Finder is within 200 m

export default function TrackingPanel({
  reservationId,
  spotLat,
  spotLng,
  role,
  finderName,
  onClose,
}: TrackingPanelProps) {
  const { finderLat, finderLng, finderAccuracy, isFinderOnline, sendPosition } =
    useRealtimeTracking(reservationId);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cached last-known position for interval-based sending
  const lastPosRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) return;
    if (watchIdRef.current !== null) return;

    // Watch for position changes continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastPosRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
      },
      (err) => console.warn("GPS error:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // Broadcast every 4 seconds
    intervalRef.current = setInterval(() => {
      if (lastPosRef.current) {
        sendPosition(
          lastPosRef.current.lat,
          lastPosRef.current.lng,
          lastPosRef.current.accuracy
        );
      }
    }, 4000);
  }, [sendPosition]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (role === "finder") {
      startWatching();
    }
    return () => {
      stopWatching();
    };
  }, [role, startWatching, stopWatching]);

  // Distance & ETA
  const distance =
    finderLat != null && finderLng != null && isFinderOnline
      ? haversineDistance(finderLat, finderLng, spotLat, spotLng)
      : null;

  const distanceLabel =
    distance != null
      ? distance < 1000
        ? `${Math.round(distance)} m`
        : `${(distance / 1000).toFixed(1)} km`
      : null;

  const etaMinutes = distance != null ? Math.ceil(distance / 83) : null;
  const etaLabel =
    etaMinutes != null
      ? etaMinutes < 60
        ? `${etaMinutes} min`
        : `${Math.round(etaMinutes / 60)} h`
      : null;

  const canDepart =
    role === "sharer" &&
    isFinderOnline &&
    distance != null &&
    distance <= DEPART_THRESHOLD_M;

  return (
    <div className="flex flex-col h-full bg-[#f5f5f2]">
      {/* Top bar */}
      <div className="bg-gradient-to-br from-[#22956b] to-[#1a7a58] pt-safe px-4 py-4 flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white text-lg font-bold"
          aria-label="Fermer"
        >
          ✕
        </button>
        <div className="flex-1">
          <h2 className="text-white font-black text-base leading-tight">
            {role === "finder" ? "Ma position en direct" : "Suivi du conducteur"}
          </h2>
          {role === "sharer" && finderName && (
            <p className="text-white/70 text-xs mt-0.5">{finderName} arrive…</p>
          )}
        </div>

        {/* Online indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isFinderOnline ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span className="text-white/80 text-xs font-medium">
            {isFinderOnline ? "En ligne" : "Hors ligne"}
          </span>
        </div>
      </div>

      {/* Map — 2/3 of screen */}
      <div className="flex-[2] min-h-0 relative">
        <LiveTrackingMap
          spotLat={spotLat}
          spotLng={spotLng}
          finderLat={finderLat}
          finderLng={finderLng}
          isFinderOnline={isFinderOnline}
          role={role}
        />
      </div>

      {/* Info panel — 1/3 of screen */}
      <div className="flex-1 bg-white rounded-t-3xl shadow-lg px-5 py-5 space-y-4 shrink-0 overflow-y-auto">
        {/* Stats row */}
        <div className="flex gap-3">
          <StatCard
            icon="📏"
            label="Distance"
            value={distanceLabel ?? "—"}
            active={isFinderOnline}
          />
          <StatCard
            icon="🕐"
            label="ETA"
            value={etaLabel ? `~${etaLabel} à pied` : "—"}
            active={isFinderOnline}
          />
        </div>

        {/* Accuracy hint */}
        {role === "finder" && finderAccuracy != null && (
          <p className="text-xs text-gray-400 text-center">
            Précision GPS : ±{Math.round(finderAccuracy)} m
          </p>
        )}

        {/* Status messages */}
        {role === "sharer" && !isFinderOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 font-medium text-center">
            ⏳ En attente que le conducteur active le suivi…
          </div>
        )}

        {role === "sharer" && isFinderOnline && distance != null && distance > DEPART_THRESHOLD_M && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-700 font-medium text-center">
            🚶 Le conducteur arrive — restez encore un peu !
          </div>
        )}

        {role === "finder" && (
          <div className="bg-[#22956b]/10 border border-[#22956b]/20 rounded-2xl px-4 py-3 text-sm text-[#22956b] font-medium text-center">
            📡 Votre position est partagée en temps réel
          </div>
        )}

        {/* Depart button — only for sharer when finder is close */}
        {canDepart && (
          <button
            onClick={onClose}
            className="w-full py-4 bg-[#22956b] text-white text-base font-black rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            🚗 Je pars — la place est libre !
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({
  icon,
  label,
  value,
  active,
}: {
  icon: string;
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex-1 rounded-2xl p-3 text-center transition-colors ${
        active ? "bg-[#22956b]/10" : "bg-gray-100"
      }`}
    >
      <div className="text-xl mb-1">{icon}</div>
      <p className={`text-base font-black ${active ? "text-[#22956b]" : "text-gray-400"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
