"use client";

import { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { getSuggestedPrice, netCoins } from "@/lib/priceSuggestion";
import { toast } from "sonner";

interface ShareSpotModalProps {
  onClose: () => void;
}

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
  const [price, setPrice]     = useState(suggested.price);
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);

  // Aligner le chip prix sur la suggestion initiale
  useEffect(() => { setPrice(suggested.price); }, [suggested.price]);

  async function handleShare() {
    if (!userLat || !userLng) {
      toast.error("Activez la géolocalisation pour partager une place");
      return;
    }
    if (!profile) return;
    setLoading(true);

    // Géocodage inverse (adresse) via Nominatim (gratuit)
    let address = "";
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json&accept-language=fr`
      );
      const json = await res.json();
      address = json.display_name ?? "";
    } catch { /* adresse optionnelle */ }

    const supabase = createClient();
    const { error } = await supabase.from("parking_spots").insert({
      sharer_id:   profile.id,
      lat:         userLat,
      lng:         userLng,
      location:    `POINT(${userLng} ${userLat})` as unknown as never,
      address,
      coin_price:  price,
      vehicle_type: "car",
      status:      "available",
      available_at: new Date().toISOString(),
      expires_at:  new Date(Date.now() + duration * 60 * 1000).toISOString(),
    });

    if (error) {
      toast.error("Impossible de partager l'info");
      setLoading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({ spots_shared: (profile.spots_shared ?? 0) + 1 })
      .eq("id", profile.id);

    toast.success(`✓ Info partagée ! Tu recevras ${netCoins(price)} SC après validation GPS.`);
    setMode("idle");
    onClose();
  }

  return (
    <>
      <div className="absolute inset-0 z-[900] bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute bottom-0 left-0 right-0 z-[910] bg-[var(--s,#fff)] rounded-t-[22px] px-5 pb-9 shadow-[0_-6px_30px_rgba(0,0,0,.12)] max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4">
        {/* Handle */}
        <div className="w-9 h-1 bg-[var(--b,#e8e8e2)] rounded-full mx-auto mt-2 mb-0" />

        {/* Header */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h2 className="text-base font-black text-[var(--t,#111)]">Je viens de me garer</h2>
            <p className="text-[13px] text-[var(--t2,#555)] mt-0.5">
              Partage l'information et gagne des SwiftCoins quand tu partiras.
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[var(--s2,#f8f8f5)] flex items-center justify-center text-[var(--t3,#999)] shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Position GPS */}
        <div className="flex items-center gap-3 p-3 bg-[#e8f5ef] rounded-[14px] mb-5">
          <MapPin className="w-4 h-4 text-[#22956b] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#22956b] font-semibold">Ma position GPS</p>
            <p className="text-[11px] text-[var(--t2,#555)] truncate">
              {userLat && userLng ? `${userLat.toFixed(5)}, ${userLng.toFixed(5)}` : "Localisation…"}
            </p>
          </div>
          <span className="text-[10px] bg-[#22956b] text-white px-2 py-0.5 rounded-full font-bold shrink-0">
            GPS ✓
          </span>
        </div>

        {/* Durée */}
        <p className="text-xs font-bold text-[var(--t2,#555)] mb-2">Combien de temps tu restes ?</p>
        <div className="flex gap-2 mb-5">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`flex-1 py-2 rounded-[9px] text-xs font-bold border transition ${
                duration === d.value
                  ? "bg-[#22956b] text-white border-[#22956b]"
                  : "bg-[var(--s,#fff)] text-[var(--t2,#555)] border-[var(--b,#e8e8e2)]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Suggestion de prix */}
        <div className="bg-[var(--s2,#f8f8f5)] rounded-[11px] px-4 py-3 mb-4 border-l-[3px] border-[#22956b]">
          <p className="text-[10px] font-black text-[#22956b] uppercase tracking-[.4px] mb-1">
            💡 Récompense suggérée
          </p>
          <p className="text-xl font-black text-[var(--t,#111)]">{suggested.label}</p>
          <p className="text-[11px] text-[var(--t2,#555)] mt-0.5">{suggested.zone}</p>
        </div>

        {/* Prix personnalisé */}
        <p className="text-xs font-bold text-[var(--t2,#555)] mb-2">Ajuste si tu veux</p>
        <div className="flex gap-2 mb-4">
          {PRICES.map((p) => (
            <button
              key={p}
              onClick={() => setPrice(p)}
              className={`flex-1 py-2 rounded-[9px] text-xs font-bold border transition ${
                price === p
                  ? "bg-[#22956b] text-white border-[#22956b]"
                  : "bg-[var(--s,#fff)] text-[var(--t2,#555)] border-[var(--b,#e8e8e2)]"
              }`}
            >
              {p} SC
            </button>
          ))}
        </div>

        {/* Net après commission */}
        <div className="bg-[var(--s2,#f8f8f5)] rounded-[11px] px-4 py-3 mb-5 text-xs text-[var(--t2,#555)]">
          Tu recevras{" "}
          <strong className="text-[#22956b]">{netCoins(price)} SC</strong> après commission (25%). Versé si GPS validé.
        </div>

        {/* CTA */}
        <button
          onClick={handleShare}
          disabled={loading || !userLat}
          className="w-full py-3.5 bg-[#22956b] text-white font-black text-sm rounded-[14px] shadow-[0_3px_12px_rgba(34,149,107,.3)] disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          {loading ? "Publication…" : "Partager l'information"}
        </button>
      </div>
    </>
  );
}
