"use client";

import { useState } from "react";
import { X, Search, Clock } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const HORIZONS = [
  { label: "Maintenant", value: "now", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { label: "15 min",     value: "15",  color: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  { label: "1 heure",    value: "1h",  color: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-500" },
  { label: "2h+",        value: "2h",  color: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
];

interface SearchSpotSheetProps { onClose: () => void }

export default function SearchSpotSheet({ onClose }: SearchSpotSheetProps) {
  const [dest, setDest]       = useState("");
  const [horizon, setHorizon] = useState("now");
  const { spots }             = useMapStore();

  function handleSearch() {
    if (!dest.trim()) { toast.error("Saisis ta destination"); return; }
    const filtered = spots.filter((s) => {
      const mins = (new Date(s.expires_at).getTime() - Date.now()) / 60000;
      if (horizon === "now") return mins <= 5;
      if (horizon === "15")  return mins <= 20;
      if (horizon === "1h")  return mins <= 75;
      return true;
    });
    toast.success(`${filtered.length} info${filtered.length > 1 ? "s" : ""} autour de "${dest}"`);
    onClose();
  }

  return (
    <>
      <div className="absolute inset-0 z-[900] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="absolute bottom-0 left-0 right-0 z-[910] bg-white rounded-t-[28px] shadow-[0_-20px_60px_rgba(0,0,0,.15)] animate-in slide-in-from-bottom-4">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-10 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-gray-900">Je cherche une place</h2>
              <p className="text-xs text-gray-500 mt-0.5">Infos de libération en temps réel</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 transition active:scale-90">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Champ destination */}
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="15 rue de Rivoli, Paris…"
              autoFocus
              className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:border-[#22956b] focus:ring-2 focus:ring-[#22956b]/10 transition"
            />
          </div>

          {/* Horizon */}
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Horizon de temps</p>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {HORIZONS.map((h) => (
              <button
                key={h.value}
                onClick={() => setHorizon(h.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-2.5 rounded-2xl border text-xs font-bold transition active:scale-95",
                  horizon === h.value ? h.color + " border-current" : "bg-gray-50 text-gray-500 border-gray-100"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", horizon === h.value ? h.dot : "bg-gray-300")} />
                {h.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleSearch}
            className="w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-bold rounded-2xl text-sm shadow-lg shadow-[#22956b]/30 transition active:scale-[.98]"
          >
            Voir les places disponibles
          </button>
        </div>
      </div>
    </>
  );
}
