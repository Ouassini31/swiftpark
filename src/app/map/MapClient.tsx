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
import FilterBar, { type MapFilters } from "@/components/map/FilterBar";
import Onboarding from "@/components/onboarding/Onboarding";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import DepartBanner from "@/components/parking/DepartBanner";
import InstallBanner from "@/components/ui/InstallBanner";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

const DEFAULT_FILTERS: MapFilters = {
  maxPrice: null,
  covered: false,
  handicap: false,
  vehicleType: null,
};

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
    if (filters.covered && !s.is_covered) return false;
    if (filters.handicap && !s.is_handicap) return false;
    if (filters.vehicleType && s.vehicle_type !== filters.vehicleType) return false;
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
      />

      {/* Bannière "Je pars" si place active */}
      {activeSpot && (
        <DepartBanner
          spot={activeSpot}
          onDone={() => setActiveSpot(null)}
        />
      )}

      {selectedSpot && <SpotSheet />}
      {showSearch && <SearchSpotSheet onClose={() => setShowSearch(false)} />}
      {showShare  && <ShareSpotModal  onClose={() => setShowShare(false)} />}

      <InstallBanner />
      <BottomNav />
    </div>
  );
}
