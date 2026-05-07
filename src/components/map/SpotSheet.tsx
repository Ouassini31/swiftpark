"use client";

import { useState } from "react";
import { X, Navigation } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { haversineDistance, formatCoins } from "@/lib/utils";
import { toast } from "sonner";

const HORIZON = [
  { key: "now", label: "Maintenant", bg: "bg-[#d1fae5]", text: "text-[#065f46]", max: 5 },
  { key: "15",  label: "Dans 15 min", bg: "bg-[#fef3c7]", text: "text-[#92400e]", max: 20 },
  { key: "1h",  label: "Dans 1h",     bg: "bg-[#dbeafe]", text: "text-[#1e40af]", max: 75 },
  { key: "2h",  label: "Dans 2h+",    bg: "bg-[#ede9fe]", text: "text-[#5b21b6]", max: Infinity },
];

function getHorizon(expiresAt: string) {
  const mins = (new Date(expiresAt).getTime() - Date.now()) / 60000;
  return HORIZON.find((h) => mins <= h.max) ?? HORIZON[3];
}

export default function SpotSheet() {
  const { selectedSpot, selectSpot, profile, userLat, userLng } = useMapStore();
  const [loading, setLoading] = useState(false);

  if (!selectedSpot) return null;

  const horizon  = getHorizon(selectedSpot.expires_at);
  const distance = userLat && userLng
    ? haversineDistance(userLat, userLng, selectedSpot.lat, selectedSpot.lng)
    : null;

  const timeAgo = formatDistanceToNow(new Date(selectedSpot.created_at), {
    addSuffix: true, locale: fr,
  });

  function handleNavigate() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedSpot!.lat},${selectedSpot!.lng}&travelmode=driving`;
    window.open(url, "_blank");
    toast("📍 Navigation ouverte dans Google Maps");
  }

  async function handleContrib() {
    if (!profile) return;
    if (profile.coin_balance < selectedSpot!.coin_price) {
      toast.error("SwiftCoins insuffisants");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        spot_id:        selectedSpot!.id,
        finder_id:      profile.id,
        sharer_id:      selectedSpot!.sharer_id,
        coin_amount:    selectedSpot!.coin_price,
        commission:     Math.round(selectedSpot!.coin_price * 0.25),
        sharer_receive: selectedSpot!.coin_price - Math.round(selectedSpot!.coin_price * 0.25),
        status:         "reserved",
        expires_at:     new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de la contribution");
      setLoading(false);
      return;
    }

    await supabase.rpc("process_coin_transaction", {
      p_user_id:      profile.id,
      p_amount:       -selectedSpot!.coin_price,
      p_type:         "spend",
      p_description:  `Contribution · ${selectedSpot!.address ?? "Place"}`,
      p_reservation_id: reservation.id,
    });

    await supabase
      .from("parking_spots")
      .update({ status: "reserved" })
      .eq("id", selectedSpot!.id);

    toast.success("✓ Info achetée !");
    selectSpot(null);
    setLoading(false);
  }

  return (
    <>
      <div className="absolute inset-0 z-[900] bg-black/50 backdrop-blur-sm" onClick={() => selectSpot(null)} />

      <div className="absolute bottom-16 left-0 right-0 z-[910] bg-[var(--s,#fff)] rounded-t-[22px] px-5 pb-9 shadow-[0_-6px_30px_rgba(0,0,0,.12)] animate-in slide-in-from-bottom-4">
        {/* Handle */}
        <div className="w-9 h-1 bg-[var(--b,#e8e8e2)] rounded-full mx-auto mt-2 mb-3" />

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${horizon.bg} ${horizon.text}`}>
                {horizon.label}
              </span>
              <span className="text-[11px] text-[var(--t3,#999)]">{timeAgo}</span>
            </div>
            <h2 className="text-base font-bold text-[var(--t,#111)] leading-tight">
              {selectedSpot.address ?? `${selectedSpot.lat.toFixed(4)}, ${selectedSpot.lng.toFixed(4)}`}
            </h2>
          </div>
          <button
            onClick={() => selectSpot(null)}
            className="w-7 h-7 rounded-full bg-[var(--s2,#f8f8f5)] border-none flex items-center justify-center text-[var(--t3,#999)] shrink-0 ml-2 text-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info grid 3 colonnes */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <InfoCell label="Récompense" value={`${selectedSpot.coin_price} SC`} accent />
          <InfoCell
            label="Distance"
            value={distance != null
              ? distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`
              : "—"}
          />
          <InfoCell label="Partagé par" value={selectedSpot.sharer_id.slice(0, 6) + "…"} small />
        </div>

        {/* Solde */}
        {profile && (
          <div className="flex justify-between text-xs font-semibold text-[var(--t2,#555)] mb-4">
            <span>Ton solde</span>
            <span className="text-[#22956b]">{formatCoins(profile.coin_balance)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleNavigate}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-[9px] border border-[var(--b,#e8e8e2)] bg-[#3b82f6] text-white text-xs font-bold flex-1"
          >
            <Navigation className="w-3 h-3" />
            Naviguer
          </button>
          <button
            onClick={handleContrib}
            disabled={loading || !profile || profile.coin_balance < selectedSpot.coin_price}
            className="flex-[2] py-3 bg-[#22956b] text-white font-bold text-sm rounded-[14px] shadow-[0_3px_12px_rgba(34,149,107,.3)] disabled:opacity-40"
          >
            {loading ? "…" : `Contribuer · ${selectedSpot.coin_price} SC`}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-[var(--t3,#999)] text-center mt-3 leading-relaxed">
          ℹ️ Tu contribues pour l'information, pas pour la place.
        </p>
      </div>
    </>
  );
}

function InfoCell({ label, value, accent, small }: { label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="bg-[var(--s2,#f8f8f5)] rounded-[11px] py-2.5 px-2 text-center">
      <p className={`font-black ${small ? "text-xs" : "text-sm"} ${accent ? "text-[#22956b]" : "text-[var(--t,#111)]"}`}>
        {value}
      </p>
      <p className="text-[10px] text-[var(--t3,#999)] mt-0.5">{label}</p>
    </div>
  );
}
