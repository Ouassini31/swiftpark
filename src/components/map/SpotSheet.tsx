"use client";

import { useState } from "react";
import { X, Navigation, Clock, Coins, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { haversineDistance } from "@/lib/utils";
import { toast } from "sonner";

const HORIZON = [
  { key: "now", label: "Maintenant", bg: "from-emerald-400 to-emerald-600", badge: "bg-emerald-100 text-emerald-700", max: 5 },
  { key: "15",  label: "~15 min",    bg: "from-amber-400 to-amber-500",     badge: "bg-amber-100 text-amber-700",   max: 20 },
  { key: "1h",  label: "~1 heure",   bg: "from-blue-400 to-blue-600",       badge: "bg-blue-100 text-blue-700",     max: 75 },
  { key: "2h",  label: "2h+",        bg: "from-violet-400 to-violet-600",   badge: "bg-violet-100 text-violet-700", max: Infinity },
];

function getHorizon(expiresAt: string) {
  const mins = (new Date(expiresAt).getTime() - Date.now()) / 60000;
  return HORIZON.find((h) => mins <= h.max) ?? HORIZON[3];
}

function getMinutesLeft(expiresAt: string) {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000));
}

export default function SpotSheet() {
  const { selectedSpot, selectSpot, profile, userLat, userLng } = useMapStore();
  const [loading, setLoading] = useState(false);

  if (!selectedSpot) return null;

  const horizon  = getHorizon(selectedSpot.expires_at);
  const minsLeft = getMinutesLeft(selectedSpot.expires_at);
  const distance = userLat && userLng
    ? haversineDistance(userLat, userLng, selectedSpot.lat, selectedSpot.lng)
    : null;
  const timeAgo = formatDistanceToNow(new Date(selectedSpot.created_at), { addSuffix: true, locale: fr });

  function handleNavigate() {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot!.lat},${selectedSpot!.lng}&travelmode=driving`, "_blank");
    toast("📍 Navigation ouverte dans Google Maps");
  }

  async function handleContrib() {
    if (!profile) return;
    if (profile.coin_balance < selectedSpot!.coin_price) { toast.error("SwiftCoins insuffisants"); return; }
    setLoading(true);
    const supabase = createClient();
    const { data: reservation, error } = await supabase
      .from("reservations")
      .insert({
        spot_id: selectedSpot!.id, finder_id: profile.id, sharer_id: selectedSpot!.sharer_id,
        coin_amount: selectedSpot!.coin_price,
        commission: Math.round(selectedSpot!.coin_price * 0.25),
        sharer_receive: selectedSpot!.coin_price - Math.round(selectedSpot!.coin_price * 0.25),
        status: "reserved",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }).select().single();
    if (error) { toast.error("Erreur lors de la contribution"); setLoading(false); return; }
    await supabase.rpc("process_coin_transaction", {
      p_user_id: profile.id, p_amount: -selectedSpot!.coin_price,
      p_type: "spend", p_description: `Contribution · ${selectedSpot!.address ?? "Place"}`,
      p_reservation_id: reservation.id,
    });
    await supabase.from("parking_spots").update({ status: "reserved" }).eq("id", selectedSpot!.id);
    toast.success("✓ Info achetée !");
    selectSpot(null);
    setLoading(false);
  }

  return (
    <>
      <div className="absolute inset-0 z-[900] bg-black/40 backdrop-blur-[2px]" onClick={() => selectSpot(null)} />

      <div className="absolute bottom-0 left-0 right-0 z-[910] bg-white rounded-t-[28px] shadow-[0_-20px_60px_rgba(0,0,0,.15)] animate-in slide-in-from-bottom-4">
        {/* Bande de couleur horizon */}
        <div className={`h-1.5 bg-gradient-to-r ${horizon.bg} rounded-t-[28px]`} />

        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-10 pt-2">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${horizon.badge}`}>
                  {horizon.label}
                </span>
                {minsLeft > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    dans {minsLeft} min
                  </span>
                )}
              </div>
              <h2 className="text-base font-black text-gray-900 leading-snug">
                {selectedSpot.address ?? `${selectedSpot.lat.toFixed(4)}, ${selectedSpot.lng.toFixed(4)}`}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
            </div>
            <button onClick={() => selectSpot(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 transition active:scale-90">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <StatCard
              icon={<span className="text-lg">⚡</span>}
              label="Récompense"
              value={`${selectedSpot.coin_price} SC`}
              accent
            />
            <StatCard
              icon={<MapPin className="w-4 h-4 text-blue-500" />}
              label="Distance"
              value={distance != null
                ? distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`
                : "—"}
            />
            <StatCard
              icon={<span className="text-lg">👤</span>}
              label="Partagé"
              value={selectedSpot.sharer_id.slice(0, 6) + "…"}
              small
            />
          </div>

          {/* Solde */}
          {profile && (
            <div className="flex justify-between items-center bg-gray-50 rounded-2xl px-4 py-3 mb-4">
              <span className="text-xs font-semibold text-gray-500">Ton solde actuel</span>
              <span className="text-sm font-black text-[#22956b]">⚡ {profile.coin_balance} SC</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              onClick={handleNavigate}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-blue-500 text-white text-xs font-bold flex-1 shadow-lg shadow-blue-500/30 transition active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              Naviguer
            </button>
            <button
              onClick={handleContrib}
              disabled={loading || !profile || profile.coin_balance < selectedSpot.coin_price}
              className="flex-[2] py-3.5 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#22956b]/30 disabled:opacity-40 transition active:scale-[.98]"
            >
              {loading ? "…" : `Contribuer · ${selectedSpot.coin_price} SC`}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 text-center mt-3">
            ℹ️ Tu contribues pour l'information, pas pour la place
          </p>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, accent, small }: { icon: React.ReactNode; label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center gap-1">
      {icon}
      <p className={`font-black ${small ? "text-xs" : "text-sm"} ${accent ? "text-[#22956b]" : "text-gray-900"}`}>
        {value}
      </p>
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
    </div>
  );
}
