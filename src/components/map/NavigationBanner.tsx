"use client";

// NavigationBanner — Point 2 : "trou noir" entre contribution et arrivée.
// Affiché quand le finder a une réservation active (status = "reserved").
// Montre le compte à rebours du départ du sharer en temps réel.
// Si le sharer part → banner mise à jour "La place est libre !".

import { useState, useEffect } from "react";
import { Navigation, X } from "lucide-react";
import type { ActiveReservation } from "@/hooks/useActiveReservation";
import { haversineDistance } from "@/lib/utils";
import { useMapStore } from "@/store/useMapStore";

const T = {
  bg:      "#fafaf7",
  surface: "#f4f4f0",
  ink:     "#1a1a16",
  muted:   "#aaa9a0",
  divider: "#eeeee6",
  accent:  "#22956b",
  amber:   "#a07116",
} as const;

const DM = "var(--font-dm-sans), system-ui, sans-serif";

function fmtTimer(s: number) {
  s = Math.max(0, Math.floor(s));
  const m = (s / 60) | 0;
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

interface Props {
  reservation: ActiveReservation;
  onDismiss: () => void;
}

export default function NavigationBanner({ reservation, onDismiss }: Props) {
  const { userLat, userLng } = useMapStore();

  // Countdown to sharer departure (spot.expires_at)
  const [sharerSecs, setSharerSecs] = useState(() =>
    Math.max(0, Math.round((new Date(reservation.spot?.expires_at ?? reservation.expires_at).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setSharerSecs(Math.max(0, Math.round(
        (new Date(reservation.spot?.expires_at ?? reservation.expires_at).getTime() - Date.now()) / 1000
      )));
    }, 1000);
    return () => clearInterval(id);
  }, [reservation.spot?.expires_at, reservation.expires_at]);

  const sharerLeft = sharerSecs > 0;
  const urgent = sharerSecs < 120 && sharerLeft;

  // ETA to spot (crow-flies estimate)
  const distance = userLat && userLng && reservation.spot
    ? haversineDistance(userLat, userLng, reservation.spot.lat, reservation.spot.lng)
    : null;
  const etaMin = distance != null
    ? distance < 800
      ? Math.ceil((distance * 1.4) / 80)
      : Math.ceil((distance * 1.4) / 350)
    : null;

  const address = reservation.spot?.address
    ? reservation.spot.address.split(",").slice(0, 2).join(",")
    : "Place réservée";

  function openNav() {
    if (!reservation.spot) return;
    const { lat, lng } = reservation.spot;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.location.href = url;
  }

  // Determine window ratio for the progress bar (10-min reservation window)
  const WINDOW_SEC = 10 * 60;
  const reservationSecsLeft = Math.max(0, Math.round(
    (new Date(reservation.expires_at).getTime() - Date.now()) / 1000
  ));
  const ratio = Math.max(0, Math.min(1, reservationSecsLeft / WINDOW_SEC));

  return (
    <div
      className="absolute left-3 right-3 z-[820] animate-in slide-in-from-bottom-2"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)", fontFamily: DM }}
    >
      <div
        className="rounded-[14px] overflow-hidden"
        style={{ background: "#fff", border: `1px solid ${T.divider}` }}
      >
        {/* Progress bar — temps restant sur la réservation */}
        <div style={{ height: 2, background: T.divider }}>
          <div
            className="h-full transition-[width] duration-700 ease-out"
            style={{ width: `${ratio * 100}%`, background: urgent ? T.amber : T.accent }}
          />
        </div>

        <div className="px-4 py-3.5 flex items-center gap-3">
          {/* Sharer countdown */}
          <div className="flex flex-col shrink-0">
            <span style={{
              fontSize: 10, fontWeight: 300, letterSpacing: "0.08em",
              textTransform: "uppercase", color: T.muted,
            }}>
              {sharerLeft ? "Il part dans" : "Place libre !"}
            </span>
            <span style={{
              marginTop: 2,
              fontSize: 26,
              fontWeight: 300,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              color: sharerLeft ? (urgent ? T.amber : T.ink) : T.accent,
            }}>
              {sharerLeft ? fmtTimer(sharerSecs) : "🎯"}
            </span>
          </div>

          {/* Address + ETA */}
          <div className="flex-1 min-w-0">
            <p
              className="truncate"
              style={{ fontSize: 13, fontWeight: 400, color: T.ink, letterSpacing: "-0.005em" }}
            >
              {address}
            </p>
            <p style={{ fontSize: 11.5, fontWeight: 300, color: T.muted, marginTop: 2 }}>
              {sharerLeft
                ? etaMin
                  ? `Tu arrives dans ~${etaMin} min · ${sharerSecs > 60 * etaMin ? "tu arrives avant ✓" : "dépêche-toi !"}`
                  : "En route…"
                : `${reservation.coin_amount} SC dépensés · place libre`}
            </p>
          </div>

          {/* Navigate + dismiss */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openNav}
              className="inline-flex items-center gap-1.5 transition active:scale-[0.97]"
              style={{
                height: 40, paddingLeft: 14, paddingRight: 14,
                borderRadius: 12,
                background: T.accent, color: "#fff",
                fontSize: 13, fontWeight: 400,
                fontFamily: DM,
              }}
            >
              <Navigation className="w-3.5 h-3.5" />
              Navi
            </button>
            <button
              type="button"
              onClick={onDismiss}
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: T.surface,
                border: `1px solid ${T.divider}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.muted,
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
