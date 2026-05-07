"use client";

import { useState } from "react";
import { MapPin, LogOut, CheckCircle, Loader2, X, Clock } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { haversineDistance, GPS_VALIDATION_RADIUS_M } from "@/lib/utils";
import { notifyUser } from "@/lib/notify";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type Spot = Database["public"]["Tables"]["parking_spots"]["Row"];

interface DepartBannerProps {
  spot: Spot;
  onDone: () => void;
}

type Step = "idle" | "confirm" | "done";


export default function DepartBanner({ spot, onDone }: DepartBannerProps) {
  const { userLat, userLng, profile } = useMapStore();
  const [step, setStep]       = useState<Step>("idle");
  const [locating, setLocating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const minsLeft = Math.max(0, Math.round(
    (new Date(spot.expires_at).getTime() - Date.now()) / 60000
  ));

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

    // Marquer la place comme complétée
    await supabase
      .from("parking_spots")
      .update({
        status: "completed",
        sharer_validated: true,
        sharer_gps_lat: lat,
        sharer_gps_lng: lng,
        validated_at: new Date().toISOString(),
      })
      .eq("id", spot.id);

    setStep("done");
    setTimeout(() => { onDone(); }, 2000);
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
  return (
    <div className="absolute bottom-[88px] left-4 right-4 z-[820]">
      <div className="bg-white rounded-2xl shadow-xl border border-[#22956b]/20 overflow-hidden">
        {/* Barre verte en haut */}
        <div className="h-1 bg-gradient-to-r from-[#22956b] to-[#1a7a58]" />
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#e8f5ef] rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-[#22956b]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900">Place active partagée</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-500">
                {minsLeft > 0 ? `Expire dans ${minsLeft} min` : "Expirée"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep("confirm")}
              className="px-3.5 py-2 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#22956b]/30 transition active:scale-95 whitespace-nowrap"
            >
              Je pars 🚗
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
