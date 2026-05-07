"use client";

import { useEffect, useRef } from "react";
import { useMapStore } from "@/store/useMapStore";

export function useGeolocation() {
  const { setUserLocation } = useMapStore();
  // Guard against React Strict Mode double-mount (prevents double permission prompt)
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    // Already watching — do not start a second watcher
    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setUserLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn("Géolocalisation refusée:", err.message),
      // maximumAge: 30 s — uses cached GPS, avoids re-prompting on hot reload
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // setUserLocation is stable (Zustand action), safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
