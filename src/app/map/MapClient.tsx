"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRealtimeSpots } from "@/hooks/useRealtimeSpots";
import { useProfile } from "@/hooks/useProfile";
import { useActiveSpot } from "@/hooks/useActiveSpot";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useMapStore } from "@/store/useMapStore";
import SpotSheet from "@/components/map/SpotSheet";
import BottomNav from "@/components/ui/BottomNav";
import ShareSpotModal from "@/components/parking/ShareSpotModal";
import SearchSpotSheet from "@/components/map/SearchSpotSheet";
import MapHeader from "@/components/map/MapHeader";
import FilterBar, { type MapFilters, DEFAULT_FILTERS } from "@/components/map/FilterBar";
import Onboarding from "@/components/onboarding/Onboarding";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import DepartBanner from "@/components/parking/DepartBanner";
import InstallBanner from "@/components/ui/InstallBanner";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });


export default function MapClient() {
  const [showShare, setShowShare]   = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showOb, setShowOb]         = useState(false);
  const [filters, setFilters]       = useState<MapFilters>(DEFAULT_FILTERS);

  const { selectedSpot, userLat, userLng, setMapCenter, spots, profile } = useMapStore();
  const { activeSpot, setActiveSpot } = useActiveSpot();

  useProfile();
  useGeolocation();
  useRealtimeSpots();
  usePushNotifications(profile?.id ?? null);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("sp_ob")) {
      setShowOb(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("share") === "1") setShowShare(true);
    }
  }, []);

  function handleLocate() {
    if (userLat && userLng) setMapCenter(userLat, userLng, 16);
  }

  // Appliquer les filtres
  const filteredSpots = spots.filter((s) => {
    if (filters.maxPrice !== null && s.coin_price > filters.maxPrice) return false;
    if (filters.covered  && !s.is_covered)  return false;
    if (filters.handicap && !s.is_handicap) return false;
    if (filters.vehicleType && s.vehicle_type !== filters.vehicleType) return false;

    // Filtre arrivée
    // arrivalMin = 0 → "Maintenant" : on montre tout ce qui est encore dispo (pas de limite haute)
    // arrivalMin > 0 → fenêtre [arrivalMin-10, arrivalMin+50] autour du moment d'arrivée
    const minsLeft = Math.round((new Date(s.expires_at).getTime() - Date.now()) / 60000);
    if (filters.arrivalMin === 0) {
      if (minsLeft < 0) return false; // place déjà expirée
    } else {
      const lo = Math.max(0, filters.arrivalMin - 10);
      const hi = filters.arrivalMin + 50;
      if (minsLeft < lo || minsLeft > hi) return false;
    }

    return true;
  });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--bg,#f5f5f2)]">
      {showOb && <Onboarding onDone={() => setShowOb(false)} />}

      <MapView filteredSpots={filteredSpots} />

      <MapHeader
        spotsCount={filteredSpots.length}
        onLocate={handleLocate}
        onSearch={() => setShowSearch(true)}
        onShare={() => setShowShare(true)}
        filters={filters}
        onFiltersChange={setFilters}
        hasActiveSpot={!!activeSpot}
      />

      {/* Bannière "Je pars" si place active */}
      {activeSpot && (
        <DepartBanner
          spot={activeSpot}
          onDone={() => setActiveSpot(null)}
        />
      )}

      {/* Légende temporelle — remonte si le bandeau DepartBanner est actif */}
      <div
        className="absolute left-3 z-[700] bg-white/90 backdrop-blur-xl rounded-2xl px-3 py-2.5 shadow-lg border border-white/50 space-y-1.5 transition-all duration-300"
        style={{ bottom: activeSpot ? "220px" : "96px" }}
      >
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1">Libération</p>
        {[
          { color: "#22956b", label: "Maintenant" },
          { color: "#f59e0b", label: "~15 min"    },
          { color: "#3b82f6", label: "~1h"        },
          { color: "#7c3aed", label: "2h+"        },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[11px] font-semibold text-gray-700">{label}</span>
          </div>
        ))}
      </div>

      {selectedSpot && <SpotSheet />}
      {showSearch && <SearchSpotSheet onClose={() => setShowSearch(false)} />}
      {showShare  && <ShareSpotModal  onClose={() => setShowShare(false)} />}

      <InstallBanner />
      <BottomNav />
    </div>
  );
}
