"use client";

import { Search, Locate } from "lucide-react";
import { useMapStore } from "@/store/useMapStore";
import NotificationCenter from "@/components/notifications/NotificationCenter";

interface MapTopBarProps {
  onLocate: () => void;
}

export default function MapTopBar({ onLocate }: MapTopBarProps) {
  const spots = useMapStore((s) => s.spots);

  return (
    <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-12 pb-3 pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Barre de recherche */}
        <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl shadow-lg px-4 py-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-400">Rechercher un quartier…</span>
        </div>

        {/* Bouton localiser */}
        <button
          onClick={onLocate}
          className="p-3 bg-white rounded-2xl shadow-lg text-brand-600 active:scale-95 transition"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* Centre de notifications */}
        <NotificationCenter />
      </div>

      {/* Badge places disponibles */}
      {spots.length > 0 && (
        <div className="mt-2 flex justify-center pointer-events-none">
          <span className="px-3 py-1 bg-brand-600 text-white text-xs font-bold rounded-full shadow-md">
            {spots.length} place{spots.length > 1 ? "s" : ""} disponible{spots.length > 1 ? "s" : ""} à proximité
          </span>
        </div>
      )}
    </div>
  );
}
