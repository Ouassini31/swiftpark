"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, SlidersHorizontal, Star, Car, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCoins } from "@/lib/utils";
import BottomNav from "@/components/ui/BottomNav";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Spot = any;

interface Filters {
  q?: string; min?: string; max?: string; covered?: string; vehicle?: string;
}

export default function SearchClient({
  spots, initialFilters,
}: {
  spots: Spot[];
  initialFilters: Filters;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  const [q, setQ]         = useState(initialFilters.q ?? "");
  const [min, setMin]     = useState(initialFilters.min ?? "");
  const [max, setMax]     = useState(initialFilters.max ?? "");
  const [covered, setCovered] = useState(initialFilters.covered === "1");
  const [vehicle, setVehicle] = useState(initialFilters.vehicle ?? "all");

  function buildUrl(overrides?: Partial<Filters>) {
    const params = new URLSearchParams();
    const merged = { q, min, max, covered: covered ? "1" : "", vehicle, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `/search?${params.toString()}`;
  }

  function applyFilters() {
    startTransition(() => {
      router.push(buildUrl());
      setShowFilters(false);
    });
  }

  function clearFilters() {
    setMin(""); setMax(""); setCovered(false); setVehicle("all");
    startTransition(() => router.push(`/search${q ? `?q=${q}` : ""}`));
  }

  const hasActiveFilters = min || max || covered || (vehicle && vehicle !== "all");

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-12 pb-3 px-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/map" className="p-2 bg-gray-100 rounded-xl text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-gray-900">Recherche</h1>
        </div>

        {/* Barre de recherche */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Adresse, quartier…"
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
            />
            {q && (
              <button onClick={() => { setQ(""); applyFilters(); }}>
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-3 rounded-2xl border transition ${
              hasActiveFilters
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-gray-50 border-gray-200 text-gray-600"
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                !
              </span>
            )}
          </button>
        </div>

        {/* Panel filtres */}
        {showFilters && (
          <div className="mt-3 p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-200">
            {/* Prix */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Prix (SwiftCoins)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  placeholder="Min"
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-center"
                />
                <span className="text-gray-400 text-sm">—</span>
                <input
                  type="number"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  placeholder="Max"
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-center"
                />
              </div>
            </div>

            {/* Véhicule */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Type de véhicule</p>
              <div className="flex gap-2">
                {[
                  { value: "all",   label: "Tous" },
                  { value: "car",   label: "🚗 Voiture" },
                  { value: "moto",  label: "🏍 Moto" },
                  { value: "truck", label: "🚐 Grand" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setVehicle(value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                      vehicle === value
                        ? "bg-brand-600 text-white"
                        : "bg-white border border-gray-200 text-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Couvert */}
            <button
              onClick={() => setCovered(!covered)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition border ${
                covered
                  ? "bg-brand-50 border-brand-400 text-brand-700"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              🏗 Places couvertes uniquement
            </button>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold"
              >
                Réinitialiser
              </button>
              <button
                onClick={applyFilters}
                className="flex-[2] py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold"
              >
                Appliquer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Résultats */}
      <div className="px-4 mt-4">
        <p className="text-xs text-gray-400 mb-3 font-medium">
          {isPending ? "Recherche…" : `${spots.length} résultat${spots.length !== 1 ? "s" : ""}`}
        </p>

        {spots.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">Aucune place trouvée</p>
            <p className="text-xs mt-1">Modifiez vos filtres ou revenez plus tard</p>
          </div>
        ) : (
          <div className="space-y-3">
            {spots.map((spot: Spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function SpotCard({ spot }: { spot: Spot }) {
  const sharer = spot.profiles;

  return (
    <Link
      href={`/map`}
      className="block bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {spot.address ?? `${Number(spot.lat).toFixed(4)}, ${Number(spot.lng).toFixed(4)}`}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {spot.vehicle_type && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Car className="w-2.5 h-2.5" /> {spot.vehicle_type}
              </span>
            )}
            {spot.is_covered && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">🏗 Couvert</span>
            )}
            {spot.is_handicap && (
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">♿ PMR</span>
            )}
          </div>

          {/* Sharer */}
          {sharer && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              Partagé par <strong className="text-gray-600">{sharer.full_name ?? sharer.username}</strong>
              {sharer.rating && (
                <>
                  <Star className="w-3 h-3 fill-swiftcoin-400 text-swiftcoin-400 ml-1" />
                  {Number(sharer.rating).toFixed(1)}
                </>
              )}
            </p>
          )}
        </div>

        {/* Prix */}
        <div className="shrink-0 text-right">
          <p className="text-lg font-black text-swiftcoin-600">{spot.coin_price}</p>
          <p className="text-[10px] text-gray-400">SC</p>
        </div>
      </div>
    </Link>
  );
}
