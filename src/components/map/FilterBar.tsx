"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";

export interface MapFilters {
  maxPrice: number | null;
  covered: boolean;
  handicap: boolean;
  vehicleType: string | null;
}

const DEFAULT_FILTERS: MapFilters = {
  maxPrice: null,
  covered: false,
  handicap: false,
  vehicleType: null,
};

interface FilterBarProps {
  filters: MapFilters;
  onChange: (f: MapFilters) => void;
}

const VEHICLE_TYPES = [
  { value: null,    label: "Tous" },
  { value: "car",   label: "🚗 Voiture" },
  { value: "moto",  label: "🏍️ Moto" },
  { value: "truck", label: "🚚 Utilitaire" },
];

const PRICES = [
  { value: null, label: "Prix libre" },
  { value: 1,    label: "≤ 1 SC" },
  { value: 2,    label: "≤ 2 SC" },
  { value: 5,    label: "≤ 5 SC" },
];

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const spots = useMapStore((s) => s.spots);

  const hasActive =
    filters.maxPrice !== null ||
    filters.covered ||
    filters.handicap ||
    filters.vehicleType !== null;

  function reset() {
    onChange(DEFAULT_FILTERS);
    setOpen(false);
  }

  return (
    <div className="relative">
      {/* Bouton filtre */}
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

      {/* Panel */}
      {open && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-[900]" onClick={() => setOpen(false)} />

          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1000] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-black text-gray-900 text-sm">Filtres</p>
              {hasActive && (
                <button onClick={reset} className="text-xs text-red-400 font-semibold flex items-center gap-1">
                  <X className="w-3 h-3" /> Réinitialiser
                </button>
              )}
            </div>

            {/* Prix max */}
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

            {/* Type de véhicule */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Véhicule</p>
              <div className="flex flex-wrap gap-1.5">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={String(v.value)}
                    onClick={() => onChange({ ...filters, vehicleType: v.value })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      filters.vehicleType === v.value
                        ? "bg-[#22956b] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
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

            {/* Résultat */}
            <p className="text-center text-xs text-gray-400">
              {spots.filter((s) => {
                if (filters.maxPrice !== null && s.coin_price > filters.maxPrice) return false;
                if (filters.covered && !s.is_covered) return false;
                if (filters.handicap && !s.is_handicap) return false;
                if (filters.vehicleType && s.vehicle_type !== filters.vehicleType) return false;
                return true;
              }).length} place(s) correspondante(s)
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
