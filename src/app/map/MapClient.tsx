"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useRealtimeSpots } from "@/hooks/useRealtimeSpots";
import { useProfile } from "@/hooks/useProfile";
import { useActiveSpot } from "@/hooks/useActiveSpot";
import { useActiveReservation } from "@/hooks/useActiveReservation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useMapStore } from "@/store/useMapStore";
import SpotSheet from "@/components/map/SpotSheet";
import BottomNav from "@/components/ui/BottomNav";
import ShareSpotModal from "@/components/parking/ShareSpotModal";
import SearchSpotSheet from "@/components/map/SearchSpotSheet";
import MapHeader from "@/components/map/MapHeader";
import { type MapFilters, DEFAULT_FILTERS } from "@/components/map/FilterBar";
import Onboarding from "@/components/onboarding/Onboarding";
import DepartBanner, { type DepartResult } from "@/components/parking/DepartBanner";
import InstallBanner from "@/components/ui/InstallBanner";
import NavigationBanner from "@/components/map/NavigationBanner";
import CyclePrompt from "@/components/map/CyclePrompt";
import GPSSuccess from "@/components/map/GPSSuccess";
import RatingModal from "@/components/rating/RatingModal";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

// Gabarits — ordre croissant de taille (XS→XL)
const CATEGORY_ORDER = ["citadine", "compacte", "berline", "suv", "grand"];

export default function MapClient() {
  const [showShare, setShowShare]   = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showOb, setShowOb]         = useState(false);
  const [filters, setFilters]       = useState<MapFilters>(DEFAULT_FILTERS);

  // Point 3 — CyclePrompt (A→B)
  const [showCyclePrompt, setShowCyclePrompt] = useState(false);
  const [cycleAddress, setCycleAddress]       = useState("");
  const stopTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptCooldown = useRef(false);

  // Point 6 — GPSSuccess celebration
  const [gpsSuccess, setGpsSuccess] = useState<{
    earnedSC: number; address: string; isFirst: boolean;
  } | null>(null);

  const { selectedSpot, userLat, userLng, setMapCenter, spots, profile } = useMapStore();
  const { activeSpot, setActiveSpot } = useActiveSpot();
  const { reservation, clearReservation, completedReservation, clearCompleted } = useActiveReservation();

  useProfile();
  useGeolocation();
  useRealtimeSpots();
  usePushNotifications(profile?.id ?? null);

  // Onboarding
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("sp_ob")) {
      setShowOb(true);
    }
  }, []);

  // URL params: centre carte + open share
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("share") === "1") setShowShare(true);
    const lat = parseFloat(params.get("lat") ?? "");
    const lng = parseFloat(params.get("lng") ?? "");
    if (!isNaN(lat) && !isNaN(lng)) setMapCenter(lat, lng, 17);
  }, [setMapCenter]);

  // ── Point 3 : détection d'arrêt GPS → CyclePrompt ──────────────────
  useEffect(() => {
    if (!navigator?.geolocation) return;

    let lowSpeedSince: number | null = null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const speed = pos.coords.speed ?? 0;
        const now   = Date.now();

        if (speed < 1.0) {
          if (lowSpeedSince === null) lowSpeedSince = now;
          // 5 s de stop → déclencher le timer 30 s
          if (now - (lowSpeedSince ?? now) >= 5000 &&
              !stopTimerRef.current && !promptCooldown.current && !activeSpot) {
            const addr = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            stopTimerRef.current = setTimeout(() => {
              setCycleAddress(addr);
              setShowCyclePrompt(true);
              stopTimerRef.current = null;
            }, 30_000);
          }
        } else {
          lowSpeedSince = null;
          if (stopTimerRef.current) {
            clearTimeout(stopTimerRef.current);
            stopTimerRef.current = null;
          }
        }
      },
      () => { /* permission refusée */ },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSpot]);

  // Annuler CyclePrompt si place active créée entre-temps
  useEffect(() => {
    if (activeSpot && showCyclePrompt) setShowCyclePrompt(false);
  }, [activeSpot, showCyclePrompt]);

  function handleLocate() {
    if (userLat && userLng) setMapCenter(userLat, userLng, 16);
  }

  // ── Filtrage des spots ──────────────────────────────────────────────
  const filteredSpots = spots.filter((s) => {
    if (filters.maxPrice !== null && s.coin_price > filters.maxPrice) return false;
    if (filters.covered  && !s.is_covered)  return false;
    if (filters.handicap && !s.is_handicap) return false;
    if (filters.vehicleType && s.vehicle_type !== filters.vehicleType) return false;

    // Filtre gabarit : places ≥ taille du véhicule cherché
    if (filters.vehicleCategory) {
      const finderIdx = CATEGORY_ORDER.indexOf(filters.vehicleCategory);
      const spotCat   = (s as Record<string, unknown>)["vehicle_category"] as string | null;
      if (spotCat && CATEGORY_ORDER.indexOf(spotCat) < finderIdx) return false;
    }

    const minsLeft = Math.round((new Date(s.expires_at).getTime() - Date.now()) / 60000);
    if (filters.arrivalMin === 0) {
      if (minsLeft < 0) return false;
    } else {
      const lo = Math.max(0, filters.arrivalMin - 10);
      const hi = filters.arrivalMin + 50;
      if (minsLeft < lo || minsLeft > hi) return false;
    }
    return true;
  });

  // Le NavigationBanner s'affiche quand le finder a une résa active (pas sharer)
  const showNavBanner = !!reservation && !activeSpot;
  const bannerActive  = !!(activeSpot || showNavBanner);

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

      {/* Bannière sharer — "Je pars" */}
      {activeSpot && (
        <DepartBanner
          spot={activeSpot}
          onDone={(result?: DepartResult) => {
            setActiveSpot(null);
            if (result) {
              // Point 6 — isFirst : flag localStorage pour ne célébrer qu'une fois
              const isFirst = !localStorage.getItem("sp_first_done");
              if (isFirst) localStorage.setItem("sp_first_done", "1");
              setGpsSuccess({ earnedSC: result.earnedSC, address: result.address, isFirst });
            }
          }}
        />
      )}

      {/* Bannière finder — navigation vers la place (Point 2) */}
      {showNavBanner && (
        <NavigationBanner
          reservation={reservation!}
          onDismiss={clearReservation}
        />
      )}

      {/* CyclePrompt — A→B (Point 3) */}
      {showCyclePrompt && !selectedSpot && (
        <CyclePrompt
          address={cycleAddress || "cette adresse"}
          estimatedSC={profile?.coin_balance != null
            ? Math.max(5, Math.round(profile.coin_balance * 0.1))
            : 8}
          onAccept={() => {
            setShowCyclePrompt(false);
            promptCooldown.current = true;
            setTimeout(() => { promptCooldown.current = false; }, 30 * 60 * 1000);
            setShowShare(true);
          }}
          onDecline={() => {
            setShowCyclePrompt(false);
            promptCooldown.current = true;
            setTimeout(() => { promptCooldown.current = false; }, 30 * 60 * 1000);
          }}
        />
      )}

      {/* GPSSuccess — célébration (Point 6) */}
      {gpsSuccess && (
        <GPSSuccess
          earnedSC={gpsSuccess.earnedSC}
          address={gpsSuccess.address}
          isFirst={gpsSuccess.isFirst}
          onContinue={() => setGpsSuccess(null)}
        />
      )}

      {/* Rating live — déclenché quand la réservation passe en "completed" via realtime */}
      {completedReservation && !gpsSuccess && (
        <div className="fixed inset-0 z-[940]">
          <RatingModal
            reservationId={completedReservation.id}
            sharerId={completedReservation.sharer_id}
            spotAddress={completedReservation.spot_address}
            onClose={clearCompleted}
          />
        </div>
      )}

      {/* Légende temporelle */}
      <div
        className="absolute left-3 z-[700] bg-white/90 backdrop-blur-xl rounded-2xl px-3 py-2.5 shadow-lg border border-white/50 space-y-1.5 transition-all duration-300"
        style={{ bottom: bannerActive ? "260px" : "96px" }}
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

      {/* Empty state */}
      {filteredSpots.length === 0 && userLat && !selectedSpot && !showShare && !showSearch && (
        <div
          className="absolute left-4 right-4 z-[700] bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-3.5 shadow-lg border border-gray-100 flex items-center gap-3 transition-all duration-300"
          style={{ bottom: bannerActive ? "268px" : "224px" }}
        >
          <div className="w-9 h-9 bg-[#e8f5ef] rounded-xl flex items-center justify-center shrink-0">
            <span className="text-lg">🅿️</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900">Aucune place autour de toi</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {filters.arrivalMin > 0 || filters.maxPrice !== null || filters.vehicleCategory
                ? "Essaie d'élargir tes filtres"
                : "Sois le premier à partager ta place 🚗"}
            </p>
          </div>
          <button
            onClick={() => setShowShare(true)}
            className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white text-xs font-bold rounded-xl"
          >
            Partager
          </button>
        </div>
      )}

      {selectedSpot && <SpotSheet />}
      {showSearch && <SearchSpotSheet onClose={() => setShowSearch(false)} />}
      {showShare  && <ShareSpotModal  onClose={() => setShowShare(false)} />}

      <InstallBanner />
      <BottomNav />
    </div>
  );
}
