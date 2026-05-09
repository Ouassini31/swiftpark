"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Clock, Coins } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { getSuggestedPrice, netCoins } from "@/lib/priceSuggestion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareSpotModalProps { onClose: () => void }

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1h",     value: 60 },
  { label: "2h",     value: 120 },
  { label: "3h+",    value: 180 },
];

const PRICES = [1, 2, 3, 5, 8];

export default function ShareSpotModal({ onClose }: ShareSpotModalProps) {
  const { userLat, userLng, profile, setMode } = useMapStore();
  const suggested = getSuggestedPrice();
  const [price, setPrice]       = useState(suggested.price);
  const [duration, setDuration] = useState(60);
  const [loading, setLoading]   = useState(false);

  useEffect(() => { setPrice(suggested.price); }, [suggested.price]);

  async function handleShare() {
    if (!userLat || !userLng) { toast.error("Active la géolocalisation"); return; }
    if (!profile) return;
    setLoading(true);

    // Anti-fraude : vérifier qu'il n'y a pas déjà une place active
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("parking_spots")
      .select("id")
      .eq("sharer_id", profile.id)
      .in("status", ["available", "reserved"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      toast.error("Tu as déjà une place active — termine-la avant d'en partager une nouvelle.");
      setLoading(false);
      return;
    }

    let address = "";
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json&accept-language=fr`);
      const json = await res.json();
      address = json.display_name ?? "";
    } catch { /* optionnel */ }

    const { error } = await supabase.from("parking_spots").insert({
      sharer_id: profile.id, lat: userLat, lng: userLng,
      location: `POINT(${userLng} ${userLat})` as unknown as never,
      address, coin_price: price, vehicle_type: "car", status: "available",
      available_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + duration * 60 * 1000).toISOString(),
      sharer_vehicle_category: (profile as Record<string, unknown>).vehicle_category as string ?? null,
    });

    if (error) { toast.error("Impossible de partager"); setLoading(false); return; }

    await supabase.from("profiles")
      .update({ spots_shared: (profile.spots_shared ?? 0) + 1 })
      .eq("id", profile.id);

    toast.success(`✓ Partagé ! Tu recevras ${netCoins(price)} SC à ton départ.`);
    setMode("idle");
    onClose();
  }

  return (
    <>
      <div className="absolute inset-0 z-[900] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="absolute bottom-0 left-0 right-0 z-[910] bg-white rounded-t-[28px] shadow-[0_-20px_60px_rgba(0,0,0,.15)] max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4">
        {/* Bande verte */}
        <div className="h-1.5 bg-gradient-to-r from-[#22956b] to-[#1a7a58] rounded-t-[28px]" />

        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-10 pt-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-gray-900">Je viens de me garer</h2>
              <p className="text-xs text-gray-500 mt-0.5">Partage l'info · Gagne des SwiftCoins</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 transition active:scale-90">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Position GPS */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 mb-5">
            <div className="w-8 h-8 bg-[#22956b] rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#22956b]">Position GPS détectée</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {userLat && userLng ? `${userLat.toFixed(5)}, ${userLng.toFixed(5)}` : "Localisation…"}
              </p>
            </div>
            <span className="text-[10px] bg-[#22956b] text-white px-2 py-1 rounded-full font-bold shrink-0">✓ GPS</span>
          </div>

          {/* Durée */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Combien de temps tu restes ?</p>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={cn(
                  "py-3 rounded-2xl text-xs font-bold border transition active:scale-95",
                  duration === d.value
                    ? "bg-[#22956b] text-white border-[#22956b] shadow-lg shadow-[#22956b]/20"
                    : "bg-gray-50 text-gray-600 border-gray-100"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Récompense suggérée */}
          <div className="bg-gradient-to-br from-[#22956b]/5 to-[#22956b]/10 border border-[#22956b]/20 rounded-2xl px-4 py-3.5 mb-5">
            <p className="text-[10px] font-black text-[#22956b] uppercase tracking-wider mb-1">💡 Récompense suggérée</p>
            <p className="text-2xl font-black text-gray-900">{suggested.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{suggested.zone}</p>
          </div>

          {/* Prix */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">Ajuste si tu veux</p>
          <div className="flex gap-2 mb-4">
            {PRICES.map((p) => (
              <button
                key={p}
                onClick={() => setPrice(p)}
                className={cn(
                  "flex-1 py-3 rounded-2xl text-xs font-bold border transition active:scale-95",
                  price === p
                    ? "bg-[#22956b] text-white border-[#22956b] shadow-lg shadow-[#22956b]/20"
                    : "bg-gray-50 text-gray-600 border-gray-100"
                )}
              >
                {p} SC
              </button>
            ))}
          </div>

          {/* Net après commission */}
          <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-5 text-xs text-gray-500 flex justify-between items-center">
            <span>Tu recevras après commission (25%)</span>
            <span className="font-black text-[#22956b] text-sm">⚡ {netCoins(price)} SC</span>
          </div>

          {/* CTA */}
          <button
            onClick={handleShare}
            disabled={loading || !userLat}
            className="w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#22956b]/30 disabled:opacity-40 flex items-center justify-center gap-2 transition active:scale-[.98]"
          >
            <MapPin className="w-4 h-4" />
            {loading ? "Publication…" : "Partager ma place"}
          </button>
        </div>
      </div>
    </>
  );
}
