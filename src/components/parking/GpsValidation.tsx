"use client";

import { useState, useEffect } from "react";
import { MapPin, CheckCircle, XCircle, Loader } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { haversineDistance, GPS_VALIDATION_RADIUS_M } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/types/database";
import GPSSuccess from "@/components/map/GPSSuccess";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

interface GpsValidationProps {
  reservation:  Reservation;
  role:         "sharer" | "finder";
  spotLat:      number;
  spotLng:      number;
  spotAddress?: string;
  onValidated:  () => void;
}

type ValidationState = "idle" | "locating" | "success" | "failed";

export default function GpsValidation({
  reservation, role, spotLat, spotLng, spotAddress, onValidated,
}: GpsValidationProps) {
  const { userLat, userLng } = useMapStore();
  const [state, setState]       = useState<ValidationState>("idle");
  const [distance, setDistance] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<{
    isFirst: boolean; earned: number;
  } | null>(null);

  useEffect(() => {
    if (userLat && userLng) {
      const d = haversineDistance(userLat, userLng, spotLat, spotLng);
      setDistance(Math.round(d));
    }
  }, [userLat, userLng, spotLat, spotLng]);

  async function validate() {
    if (!userLat || !userLng) {
      toast.error("Impossible d'obtenir votre position GPS");
      return;
    }

    setState("locating");

    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
      })
    ).catch(() => null);

    if (!pos) {
      setState("failed");
      toast.error("Localisation échouée");
      return;
    }

    const dist = haversineDistance(
      pos.coords.latitude, pos.coords.longitude,
      spotLat, spotLng
    );
    const isValid = dist <= GPS_VALIDATION_RADIUS_M;

    const supabase = createClient();

    await supabase.from("gps_validations").insert({
      reservation_id:    reservation.id,
      user_id:           role === "sharer" ? reservation.sharer_id : reservation.finder_id,
      role,
      lat:               pos.coords.latitude,
      lng:               pos.coords.longitude,
      accuracy:          pos.coords.accuracy,
      distance_to_spot:  dist,
      is_valid:          isValid,
    });

    if (!isValid) {
      setState("failed");
      toast.error(`Trop loin de la place (${Math.round(dist)} m). Rapprochez-vous.`);
      return;
    }

    // Mettre à jour les flags GPS sur la place
    const updateField =
      role === "sharer"
        ? { sharer_validated: true, sharer_gps_lat: pos.coords.latitude, sharer_gps_lng: pos.coords.longitude }
        : { finder_validated: true, finder_gps_lat: pos.coords.latitude, finder_gps_lng: pos.coords.longitude };

    await supabase.from("parking_spots").update(updateField).eq("id", reservation.spot_id);

    // Vérifier si les deux ont validé → compléter la réservation
    const { data: spot } = await supabase
      .from("parking_spots")
      .select("sharer_validated, finder_validated")
      .eq("id", reservation.spot_id)
      .single();

    if (spot?.sharer_validated && spot?.finder_validated) {
      // Guard : mettre à jour uniquement si la réservation est encore "reserved"
      // (évite le double-paiement si DepartBanner a déjà complété la réservation)
      const { data: updatedRes } = await supabase
        .from("reservations")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", reservation.id)
        .eq("status", "reserved") // ← atomique : ne touche rien si déjà completed
        .select("id")
        .maybeSingle();

      if (updatedRes) {
        // Seulement si c'est nous qui avons transitionné vers "completed"
        await supabase
          .from("parking_spots")
          .update({ status: "completed", validation_status: "validated", validated_at: new Date().toISOString() })
          .eq("id", reservation.spot_id);

        await supabase.rpc("process_coin_transaction", {
          p_user_id:        reservation.sharer_id,
          p_amount:         reservation.sharer_receive,
          p_type:           "earn",
          p_description:    `Départ signalé — ${reservation.sharer_receive} SC`,
          p_reservation_id: reservation.id,
        });
      }
    }

    setState("success");

    // ── Finder : célébration GPSSuccess ───────────────────────────────
    if (role === "finder") {
      const isFirst = !localStorage.getItem("sp_first_find");
      if (isFirst) localStorage.setItem("sp_first_find", "1");
      setCelebration({ isFirst, earned: 0 });
      // onValidated() sera appelé depuis GPSSuccess.onContinue
      return;
    }

    // Sharer : callback direct (DepartBanner gère son propre feedback)
    onValidated();
  }

  // ── Écran de célébration finder ────────────────────────────────────
  if (celebration) {
    return (
      <div className="fixed inset-0 z-[970]">
        <GPSSuccess
          earnedSC={celebration.earned}
          address={spotAddress ?? `${spotLat.toFixed(4)}, ${spotLng.toFixed(4)}`}
          isFirst={celebration.isFirst}
          role="finder"
          onContinue={() => {
            setCelebration(null);
            onValidated();
          }}
        />
      </div>
    );
  }

  // ── Formulaire de validation GPS ───────────────────────────────────
  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 mx-4 space-y-5">
      <div className="text-center">
        <div className="text-4xl mb-2">📍</div>
        <h3 className="text-lg font-black text-gray-900">Validation GPS</h3>
        <p className="text-sm text-gray-500 mt-1">
          {role === "sharer"
            ? "Confirmez que vous êtes bien sur place pour finaliser"
            : "Confirmez votre arrivée sur place"}
        </p>
      </div>

      {distance !== null && (
        <div className={`flex items-center gap-3 p-3 rounded-2xl ${
          distance <= GPS_VALIDATION_RADIUS_M ? "bg-brand-50" : "bg-orange-50"
        }`}>
          <MapPin className={`w-5 h-5 ${distance <= GPS_VALIDATION_RADIUS_M ? "text-brand-600" : "text-orange-500"}`} />
          <div>
            <p className="text-xs font-medium text-gray-700">Distance à la place</p>
            <p className={`text-lg font-black ${
              distance <= GPS_VALIDATION_RADIUS_M ? "text-brand-600" : "text-orange-500"
            }`}>{distance} m</p>
          </div>
          {distance <= GPS_VALIDATION_RADIUS_M
            ? <CheckCircle className="w-5 h-5 text-brand-600 ml-auto" />
            : <span className="ml-auto text-xs text-orange-500">Rapprochez-vous</span>}
        </div>
      )}

      {state === "success" && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-2xl">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm font-semibold text-green-700">Position validée !</p>
        </div>
      )}
      {state === "failed" && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl">
          <XCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm font-semibold text-red-600">Validation échouée. Réessayez.</p>
        </div>
      )}

      {state !== "success" && (
        <button
          onClick={validate}
          disabled={state === "locating"}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl
            transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {state === "locating" ? (
            <><Loader className="w-5 h-5 animate-spin" /> Localisation…</>
          ) : (
            <><MapPin className="w-5 h-5" /> Valider ma position</>
          )}
        </button>
      )}
    </div>
  );
}
