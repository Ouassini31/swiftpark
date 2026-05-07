"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Clock, MapPin, Loader2, Navigation } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: { road?: string; city?: string; town?: string; village?: string };
}

const HORIZONS = [
  { label: "Maintenant", value: "now", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { label: "15 min",     value: "15",  color: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  { label: "1 heure",    value: "1h",  color: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-500" },
  { label: "2h+",        value: "2h",  color: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
];

// Formate un résultat Nominatim pour l'afficher proprement
function formatResult(r: NominatimResult) {
  const parts = r.display_name.split(", ");
  const main  = parts.slice(0, 2).join(", ");
  const sub   = parts.slice(2, 4).join(", ");
  return { main, sub };
}

interface SearchSpotSheetProps { onClose: () => void }

export default function SearchSpotSheet({ onClose }: SearchSpotSheetProps) {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<NominatimResult[]>([]);
  const [selected, setSelected]     = useState<NominatimResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [horizon, setHorizon]       = useState("now");
  const { spots, setMapCenter, userLat, userLng } = useMapStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Autocomplétion Nominatim (debounce 400 ms) ──────────────────────────
  useEffect(() => {
    if (selected) return; // ne pas chercher si déjà sélectionné
    if (query.length < 3) { setResults([]); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", query);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", "5");
        url.searchParams.set("accept-language", "fr");
        url.searchParams.set("addressdetails", "1");
        // Priorité à la France
        if (userLat && userLng) {
          url.searchParams.set("viewbox", `${userLng - 0.5},${userLat + 0.3},${userLng + 0.5},${userLat - 0.3}`);
          url.searchParams.set("bounded", "0");
        }
        const res  = await fetch(url.toString(), { headers: { "Accept-Language": "fr" } });
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selected, userLat, userLng]);

  // ── Sélection d'une adresse ─────────────────────────────────────────────
  function handleSelect(r: NominatimResult) {
    setSelected(r);
    setQuery(r.display_name.split(", ").slice(0, 3).join(", "));
    setResults([]);
  }

  // ── Recherche des places à proximité ────────────────────────────────────
  function handleSearch() {
    if (!selected && query.trim().length < 3) {
      toast.error("Saisis au moins 3 caractères");
      return;
    }

    const lat = selected ? parseFloat(selected.lat) : userLat;
    const lng = selected ? parseFloat(selected.lon) : userLng;

    if (!lat || !lng) { toast.error("Adresse introuvable"); return; }

    // Centre la carte sur l'adresse choisie
    setMapCenter(lat, lng, 15);

    // Compte les places à moins de 1 km selon l'horizon
    const nearby = spots.filter((s) => {
      const dLat  = (s.lat - lat) * 111000;
      const dLng  = (s.lng - lng) * 111000 * Math.cos(lat * Math.PI / 180);
      const dist  = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist > 1000) return false;
      const mins  = (new Date(s.expires_at).getTime() - Date.now()) / 60000;
      if (horizon === "now") return mins <= 5;
      if (horizon === "15")  return mins <= 20;
      if (horizon === "1h")  return mins <= 75;
      return true;
    });

    const name = query.split(",")[0];
    if (nearby.length > 0) {
      toast.success(`${nearby.length} info${nearby.length > 1 ? "s" : ""} près de « ${name} »`);
    } else {
      toast(`Aucune info dans ce secteur pour l'instant`, { icon: "📍" });
    }
    onClose();
  }

  // ── Ma position ─────────────────────────────────────────────────────────
  function handleMyLocation() {
    if (!userLat || !userLng) { toast.error("Position non disponible"); return; }
    setMapCenter(userLat, userLng, 16);
    toast("Centré sur ta position 📍");
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

          {/* Champ de recherche */}
          <div className="relative mb-2">
            <div className="relative">
              {loading
                ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22956b] animate-spin" />
                : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              }
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Adresse, rue, quartier, ville…"
                autoFocus
                className="w-full pl-10 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 outline-none focus:border-[#22956b] focus:ring-2 focus:ring-[#22956b]/10 transition"
              />
              {query.length > 0 && (
                <button
                  onClick={() => { setQuery(""); setSelected(null); setResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300 text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Suggestions autocomplétion */}
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10">
                {results.map((r) => {
                  const { main, sub } = formatResult(r);
                  return (
                    <button
                      key={r.place_id}
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 transition"
                    >
                      <MapPin className="w-4 h-4 text-[#22956b] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{main}</p>
                        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ma position */}
          <button
            onClick={handleMyLocation}
            className="flex items-center gap-2 text-xs font-semibold text-[#22956b] mb-5 py-1"
          >
            <Navigation className="w-3.5 h-3.5" />
            Utiliser ma position actuelle
          </button>

          {/* Horizon */}
          <div className="flex items-center gap-1.5 mb-2.5">
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
            disabled={query.length < 3}
            className="w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-bold rounded-2xl text-sm shadow-lg shadow-[#22956b]/30 disabled:opacity-40 transition active:scale-[.98]"
          >
            Voir les places disponibles
          </button>
        </div>
      </div>
    </>
  );
}
