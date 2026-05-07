"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { toast } from "sonner";

const HORIZONS = [
  { label: "Maintenant", value: "now",  cls: "bg-[#d1fae5] text-[#065f46]" },
  { label: "15 min",     value: "15",   cls: "bg-[#fef3c7] text-[#92400e]" },
  { label: "1h",         value: "1h",   cls: "bg-[#dbeafe] text-[#1e40af]" },
  { label: "2h+",        value: "2h",   cls: "bg-[#ede9fe] text-[#5b21b6]" },
];

interface SearchSpotSheetProps {
  onClose: () => void;
}

export default function SearchSpotSheet({ onClose }: SearchSpotSheetProps) {
  const [dest, setDest]       = useState("");
  const [horizon, setHorizon] = useState("now");
  const { setSpots, spots }   = useMapStore();

  function handleSearch() {
    if (!dest.trim()) {
      toast.error("Saisis ton adresse de destination");
      return;
    }

    // Filtrer les places selon l'horizon
    const filtered = spots.filter((s) => {
      const mins = (new Date(s.expires_at).getTime() - Date.now()) / 60000;
      if (horizon === "now")  return mins <= 5;
      if (horizon === "15")   return mins <= 20;
      if (horizon === "1h")   return mins <= 75;
      return true; // 2h+
    });

    toast.success(`✓ ${filtered.length} infos affichées autour de "${dest}"`);
    onClose();
  }

  return (
    <>
      {/* Overlay */}
      <div className="absolute inset-0 z-[900] bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-16 left-0 right-0 z-[910] bg-[var(--s,#fff)] rounded-t-[22px] px-5 pb-9 shadow-[0_-6px_30px_rgba(0,0,0,.12)] animate-in slide-in-from-bottom-4">
        {/* Handle */}
        <div className="w-9 h-1 bg-[var(--b,#e8e8e2)] rounded-full mx-auto mt-2 mb-3" />

        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-[var(--t,#111)]">Je cherche une place</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[var(--s2,#f8f8f5)] flex items-center justify-center text-[var(--t3,#999)]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[13px] text-[var(--t2,#555)] mb-4 leading-relaxed">
          Les informations de libération autour de ta destination
        </p>

        {/* Adresse */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[var(--t2,#555)] mb-1.5">
            Adresse de destination
          </label>
          <input
            type="text"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Ex : 15 rue de Rivoli, Paris"
            autoFocus
            className="w-full border border-[var(--b,#e8e8e2)] rounded-[10px] px-3 py-3 text-sm text-[var(--t,#111)] bg-[var(--s2,#f8f8f5)] outline-none focus:border-[#22956b] focus:bg-white"
          />
        </div>

        {/* Horizon de temps */}
        <p className="text-xs font-bold text-[var(--t2,#555)] mb-2">Horizon de temps</p>
        <div className="flex gap-2 mb-5">
          {HORIZONS.map((h) => (
            <button
              key={h.value}
              onClick={() => setHorizon(h.value)}
              className={`flex-1 py-2 rounded-[9px] text-xs font-bold border transition ${
                horizon === h.value
                  ? `${h.cls} border-transparent`
                  : "bg-[var(--s,#fff)] text-[var(--t2,#555)] border-[var(--b,#e8e8e2)]"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSearch}
          className="w-full py-3.5 bg-[#22956b] text-white font-bold rounded-[14px] text-sm shadow-[0_3px_12px_rgba(34,149,107,.3)]"
        >
          Voir les informations disponibles
        </button>
      </div>
    </>
  );
}
