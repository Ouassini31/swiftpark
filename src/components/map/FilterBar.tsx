"use client";

import { useState } from "react";
import { SlidersHorizontal, X, Clock } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";

export interface MapFilters {
  maxPrice:        number | null;
  covered:         boolean;
  handicap:        boolean;
  vehicleType:     string | null;
  vehicleCategory: string | null;   // gabarit XS→XL
  arrivalMin:      number;          // 0 = maintenant
}

export const DEFAULT_FILTERS: MapFilters = {
  maxPrice:        null,
  covered:         false,
  handicap:        false,
  vehicleType:     null,
  vehicleCategory: null,
  arrivalMin:      0,
};

interface FilterBarProps {
  filters:  MapFilters;
  onChange: (f: MapFilters) => void;
}

const PRICES = [
  { value: null, label: "Tous" },
  { value: 1,    label: "≤ 1 SC" },
  { value: 2,    label: "≤ 2 SC" },
  { value: 5,    label: "≤ 5 SC" },
];

const CATEGORIES: { value: string | null; label: string; size: string }[] = [
  { value: null,        label: "Tous",       size: "—"  },
  { value: "citadine",  label: "Citadine",   size: "XS" },
  { value: "compacte",  label: "Compacte",   size: "S"  },
  { value: "berline",   label: "Berline",    size: "M"  },
  { value: "suv",       label: "SUV",        size: "L"  },
  { value: "grand",     label: "Grand",      size: "XL" },
];

function formatArrival(min: number): string {
  if (min === 0)  return "Maintenant";
  if (min < 60)  return `Dans ${min} min`;
  if (min === 60) return "Dans 1h";
  return `Dans ${Math.floor(min / 60)}h${min % 60 > 0 ? String(min % 60).padStart(2, "0") : ""}`;
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const spots = useMapStore((s) => s.spots);

  const hasActive =
    filters.maxPrice        !== null ||
    filters.covered                  ||
    filters.handicap                 ||
    filters.vehicleType     !== null ||
    filters.vehicleCategory !== null ||
    filters.arrivalMin      > 0;

  function reset() {
    onChange(DEFAULT_FILTERS);
    setOpen(false);
  }

  const previewCount = spots.filter((s) => {
    if (filters.maxPrice !== null && s.coin_price > filters.maxPrice) return false;
    if (filters.covered  && !s.is_covered)  return false;
    if (filters.handicap && !s.is_handicap) return false;
    if (filters.vehicleType && s.vehicle_type !== filters.vehicleType) return false;
    const minsLeft = Math.round((new Date(s.expires_at).getTime() - Date.now()) / 60000);
    if (filters.arrivalMin === 0) {
      if (minsLeft < 0) return false;
    } else {
      const lo = Math.max(0, filters.arrivalMin - 10);
      const hi = filters.arrivalMin + 50;
      if (minsLeft < lo || minsLeft > hi) return false;
    }
    return true;
  }).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition active:scale-95 ${
          hasActive
            ? "bg-[#22956b] text-white border-[#22956b] shadow-lg shadow-[#22956b]/30"
            : "bg-white/90 backdrop-blur-xl border-white/50 text-gray-700 shadow-lg"
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filtres
        {hasActive && (
          <span className="w-4 h-4 bg-white text-[#22956b] rounded-full text-[10px] font-black flex items-center justify-center">
            !
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[900]" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1000] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-black text-gray-900 text-sm">Filtres</p>
              {hasActive && (
                <button onClick={reset} className="text-xs text-red-400 font-semibold flex items-center gap-1">
                  <X className="w-3 h-3" /> Réinitialiser
                </button>
              )}
            </div>

            {/* ── Gabarit véhicule ── */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Mon véhicule</p>
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={String(cat.value)}
                    onClick={() => onChange({ ...filters, vehicleCategory: cat.value })}
                    className={`flex flex-col items-center py-2 rounded-xl text-xs font-bold transition ${
                      filters.vehicleCategory === cat.value
                        ? "bg-[#22956b] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span className={`text-[11px] font-black ${filters.vehicleCategory === cat.value ? "text-white/70" : "text-gray-400"}`}>
                      {cat.size}
                    </span>
                    <span className="text-[11px] mt-0.5">{cat.label}</span>
                  </button>
                ))}
              </div>
              {filters.vehicleCategory && (
                <p className="text-[10px] text-[#22956b] mt-1.5 text-center font-semibold">
                  Places ≥ {CATEGORIES.find(c => c.value === filters.vehicleCategory)?.size} affichées
                </p>
              )}
            </div>

            {/* ── Arrivée ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> J&apos;arrive dans…
                </p>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  filters.arrivalMin === 0    ? "bg-emerald-100 text-emerald-700" :
                  filters.arrivalMin <= 20   ? "bg-amber-100 text-amber-700"     :
                  filters.arrivalMin <= 75   ? "bg-blue-100 text-blue-700"       :
                                               "bg-violet-100 text-violet-700"
                }`}>
                  {formatArrival(filters.arrivalMin)}
                </span>
              </div>
              <input
                type="range"
                min={0} max={120} step={5}
                value={filters.arrivalMin}
                onChange={(e) => onChange({ ...filters, arrivalMin: Number(e.target.value) })}
                className="w-full accent-[#22956b] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>Maintenant</span><span>30 min</span><span>1h</span><span>2h</span>
              </div>
            </div>

            {/* ── Prix max ── */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Prix maximum</p>
              <div className="flex flex-wrap gap-1.5">
                {PRICES.map((p) => (
                  <button
                    key={String(p.value)}
                    onClick={() => onChange({ ...filters, maxPrice: p.value })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      filters.maxPrice === p.value
                        ? "bg-[#22956b] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Toggles ── */}
            <div className="space-y-2">
              <Toggle
                label="🏠 Place couverte"
                active={filters.covered}
                onToggle={() => onChange({ ...filters, covered: !filters.covered })}
              />
              <Toggle
                label="♿ Handicapé"
                active={filters.handicap}
                onToggle={() => onChange({ ...filters, handicap: !filters.handicap })}
              />
            </div>

            <p className="text-center text-xs text-gray-400">
              {previewCount} place{previewCount !== 1 ? "s" : ""} correspondante{previewCount !== 1 ? "s" : ""}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 active:scale-95 transition"
    >
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      <div className={`w-9 h-5 rounded-full transition-colors ${active ? "bg-[#22956b]" : "bg-gray-200"}`}>
        <div className={`w-4 h-4 bg-white rounded-full mt-0.5 shadow transition-transform ${active ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}
