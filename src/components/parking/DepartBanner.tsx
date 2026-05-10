"use client";

import { useState, useEffect } from "react";
import { LogOut, CheckCircle, Loader2 } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { haversineDistance, GPS_VALIDATION_RADIUS_M } from "@/lib/utils";
import { notifyUser } from "@/lib/notify";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type Spot = Database["public"]["Tables"]["parking_spots"]["Row"];

export interface DepartResult {
  earnedSC: number;
  address:  string;
}

interface DepartBannerProps {
  spot: Spot;
  onDone: (result?: DepartResult) => void;
}

type Step = "idle" | "confirm" | "done";


/* ── Design tokens ───────────────────────────────────────────────────── */
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
const WINDOW_SEC = 30 * 60; // 30 min sharing window

function fmtTimer(s: number) {
  s = Math.max(0, Math.floor(s));
  const m = (s / 60) | 0;
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function DepartBanner({ spot, onDone }: DepartBannerProps) {
  const { userLat, userLng, profile } = useMapStore();
  const [step, setStep]       = useState<Step>("idle");
  const [locating, setLocating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [secsLeft, setSecsLeft] = useState(() =>
    Math.max(0, Math.round((new Date(spot.expires_at).getTime() - Date.now()) / 1000))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setSecsLeft(Math.max(0, Math.round((new Date(spot.expires_at).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [spot.expires_at]);

  if (dismissed) return null;

  const earningSC = Math.round(spot.coin_price * 0.75);
  const ratio     = Math.max(0, Math.min(1, secsLeft / WINDOW_SEC));
  const urgent    = secsLeft < 120;

  async function handleDepart() {
    setLocating(true);

    // Récupérer la position précise
    const pos = await new Promise<GeolocationPosition | null>((resolve) =>
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
        enableHighAccuracy: true, timeout: 10000,
      })
    );

    const lat = pos?.coords.latitude  ?? userLat;
    const lng = pos?.coords.longitude ?? userLng;

    if (!lat || !lng || !profile) {
      toast.error("Position GPS indisponible");
      setLocating(false);
      return;
    }

    const dist = haversineDistance(lat, lng, spot.lat, spot.lng);
    const supabase = createClient();

    // Chercher une réservation active sur cette place
    const { data: reservation } = await supabase
      .from("reservations")
      .select("*")
      .eq("spot_id", spot.id)
      .eq("status", "reserved")
      .maybeSingle();

    if (reservation) {
      // Valider la GPS du partageur
      await supabase.from("gps_validations").insert({
        reservation_id: reservation.id,
        user_id: profile.id,
        role: "sharer",
        lat, lng,
        accuracy: pos?.coords.accuracy ?? 0,
        distance_to_spot: dist,
        is_valid: dist <= GPS_VALIDATION_RADIUS_M * 3, // 3× pour tolérance urbaine
      });

      // Compléter la réservation et payer
      await supabase
        .from("reservations")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", reservation.id);

      await supabase.rpc("process_coin_transaction", {
        p_user_id: profile.id,
        p_amount: reservation.sharer_receive,
        p_type: "earn",
        p_description: `Gain place partagée · ${reservation.sharer_receive} SC`,
        p_reservation_id: reservation.id,
      });

      // Notifier le Finder que le Sharer part
      notifyUser({
        user_id:        reservation.finder_id,
        type:           "spot_validated",
        title:          "🏃 Le partageur part maintenant !",
        message:        `La place se libère ! Dépêche-toi d'arriver.`,
        reservation_id: reservation.id,
        url:            "/map",
      });

      // Notifier le Sharer de ses gains
      notifyUser({
        user_id:        profile.id,
        type:           "payment_received",
        title:          `✅ +${reservation.sharer_receive} SC reçus !`,
        message:        `Merci d'avoir partagé ta place. Tes SwiftCoins sont crédités.`,
        reservation_id: reservation.id,
        url:            "/wallet",
      });

      toast.success(`✅ Bravo ! Tu gagnes ${reservation.sharer_receive} SC`);
    } else {
      toast(`Place libérée — pas de finder trouvé cette fois 🙁`, { icon: "📍" });
    }

    // Marquer la place comme complétée + sharer_confirmed pour stopper les nudges
    await supabase
      .from("parking_spots")
      .update({
        status:           "completed",
        sharer_validated: true,
        sharer_confirmed: true,   // stoppe les nudges pré-départ
        sharer_gps_lat:   lat,
        sharer_gps_lng:   lng,
        validated_at:     new Date().toISOString(),
      })
      .eq("id", spot.id);

    setStep("done");
    setTimeout(() => {
      onDone(reservation ? {
        earnedSC: reservation.sharer_receive,
        address:  spot.address ?? `${spot.lat.toFixed(4)}, ${spot.lng.toFixed(4)}`,
      } : undefined);
    }, 2000);
  }

  // ── Étape "done" ──────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="absolute bottom-[88px] left-4 right-4 z-[820]">
        <div className="bg-[#22956b] rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-xl shadow-[#22956b]/30">
          <CheckCircle className="w-5 h-5 text-white shrink-0" />
          <p className="text-white font-bold text-sm flex-1">Place libérée avec succès !</p>
        </div>
      </div>
    );
  }

  // ── Étape "confirm" ──────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <>
        <div className="absolute inset-0 z-[900] bg-black/50 backdrop-blur-sm" />
        <div className="absolute bottom-[88px] left-4 right-4 z-[910]">
          <div className="bg-white rounded-3xl p-5 shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-[#e8f5ef] rounded-full flex items-center justify-center mx-auto mb-3">
                <LogOut className="w-6 h-6 text-[#22956b]" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Tu pars maintenant ?</h3>
              <p className="text-sm text-gray-500 mt-1">
                {spot.address
                  ? spot.address.split(",").slice(0, 2).join(",")
                  : `${spot.lat.toFixed(4)}, ${spot.lng.toFixed(4)}`}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-xs text-gray-500">Récompense estimée</span>
              <span className="font-black text-[#22956b]">⚡ {spot.coin_price} SC</span>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setStep("idle")}
                className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl text-sm transition active:scale-95"
              >
                Pas encore
              </button>
              <button
                onClick={handleDepart}
                disabled={locating}
                className="flex-[2] py-3.5 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black rounded-2xl text-sm shadow-lg shadow-[#22956b]/30 flex items-center justify-center gap-2 transition active:scale-95"
              >
                {locating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Localisation…</>
                  : <><LogOut className="w-4 h-4" /> Je pars !</>
                }
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Étape "idle" — bannière persistante ──────────────────────────────
  const address = spot.address
    ? spot.address.split(",").slice(0, 2).join(",")
    : `${spot.lat.toFixed(4)}, ${spot.lng.toFixed(4)}`;

  return (
    <div
      className="absolute left-3 right-3 z-[820]"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)", fontFamily: DM }}
    >
      <div
        className="rounded-[14px] overflow-hidden"
        style={{ background: "#fff", border: `1px solid ${T.divider}` }}
      >
        {/* Thin progress bar */}
        <div style={{ height: 2, background: T.divider }}>
          <div
            className="h-full transition-[width] duration-700 ease-out"
            style={{ width: `${ratio * 100}%`, background: urgent ? T.amber : T.accent }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Timer */}
          <div className="flex flex-col shrink-0">
            <span
              style={{
                fontSize: 10, fontWeight: 300, letterSpacing: "0.08em",
                textTransform: "uppercase", color: T.muted,
              }}
            >
              Place active
            </span>
            <span
              style={{
                marginTop: 2,
                fontSize: 26,
                fontWeight: 300,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                fontVariantNumeric: "tabular-nums",
                color: urgent ? T.amber : T.ink,
              }}
            >
              {fmtTimer(secsLeft)}
            </span>
          </div>

          {/* Address + earning */}
          <div className="flex-1 min-w-0">
            <p
              className="truncate"
              style={{ fontSize: 13, fontWeight: 400, color: T.ink, letterSpacing: "-0.005em" }}
            >
              {address}
            </p>
            <p style={{ fontSize: 11.5, fontWeight: 300, color: T.muted, marginTop: 2 }}>
              + {earningSC} SC accumulés
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => setStep("confirm")}
            className="shrink-0 inline-flex items-center gap-1.5 transition active:scale-[0.97]"
            style={{
              height: 44,
              paddingLeft: 16,
              paddingRight: 16,
              borderRadius: 14,
              background: T.accent,
              color: "#fff",
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: "-0.005em",
              fontFamily: DM,
            }}
          >
            Je pars <span aria-hidden style={{ fontSize: 14 }}>🚗</span>
          </button>
        </div>
      </div>
    </div>
  );
}
