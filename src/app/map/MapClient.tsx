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
import Onboarding from "@/components/onboarding/Onboarding";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import DepartBanner from "@/components/parking/DepartBanner";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

export default function MapClient() {
  const [showShare, setShowShare]   = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showOb, setShowOb]         = useState(false);

  const { selectedSpot, userLat, userLng, setMapCenter, spots } = useMapStore();
  const { activeSpot, setActiveSpot } = useActiveSpot();

  useProfile();
  useGeolocation();
  useRealtimeSpots();
  usePushNotifications(); // Enregistre SW en arrière-plan

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

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--bg,#f5f5f2)]">
      {showOb && <Onboarding onDone={() => setShowOb(false)} />}

      <MapView />

      <MapHeader
        spotsCount={spots.length}
        onLocate={handleLocate}
        onSearch={() => setShowSearch(true)}
        onShare={() => setShowShare(true)}
      />

      <div className="absolute top-[116px] right-4 z-[810]">
        <NotificationCenter />
      </div>

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

      <BottomNav />
    </div>
  );
}
