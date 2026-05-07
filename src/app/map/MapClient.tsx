"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRealtimeSpots } from "@/hooks/useRealtimeSpots";
import { useProfile } from "@/hooks/useProfile";
import { useMapStore } from "@/store/useMapStore";
import SpotSheet from "@/components/map/SpotSheet";
import BottomNav from "@/components/ui/BottomNav";
import ShareSpotModal from "@/components/parking/ShareSpotModal";
import SearchSpotSheet from "@/components/map/SearchSpotSheet";
import MapHeader from "@/components/map/MapHeader";
import Onboarding from "@/components/onboarding/Onboarding";
import NotificationCenter from "@/components/notifications/NotificationCenter";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

export default function MapClient() {
  const [showShare, setShowShare]   = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showOb, setShowOb]         = useState(false);

  const { selectedSpot, userLat, userLng, setMapCenter, spots } = useMapStore();

  useProfile();
  useGeolocation();
  useRealtimeSpots();

  // Vérifier si onboarding déjà vu
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("sp_ob")) {
      setShowOb(true);
    }
  }, []);

  // Ouvrir share si ?share=1
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
      {/* Onboarding */}
      {showOb && <Onboarding onDone={() => setShowOb(false)} />}

      {/* Carte Leaflet plein écran */}
      <MapView />

      {/* Header */}
      <MapHeader
        spotsCount={spots.length}
        onLocate={handleLocate}
        onSearch={() => setShowSearch(true)}
        onShare={() => setShowShare(true)}
      />

      {/* Centre notifications */}
      <div className="absolute top-[116px] right-4 z-10">
        <NotificationCenter />
      </div>

      {/* Fiche détail d'une place */}
      {selectedSpot && <SpotSheet />}

      {/* Sheet "Je cherche" */}
      {showSearch && <SearchSpotSheet onClose={() => setShowSearch(false)} />}

      {/* Modal "Je me gare" */}
      {showShare && <ShareSpotModal onClose={() => setShowShare(false)} />}

      {/* Navigation bottom */}
      <BottomNav />
    </div>
  );
}
