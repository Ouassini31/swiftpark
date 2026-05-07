"use client";

import { useEffect } from "react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";

const RADIUS_KM = 2;

export function useRealtimeSpots() {
  const { userLat, userLng, setSpots, upsertSpot, removeSpot } = useMapStore();

  useEffect(() => {
    if (!userLat || !userLng) return;

    const supabase = createClient();

    async function loadNearbySpots() {
      const { data } = await supabase
        .from("parking_spots")
        .select("*")
        .eq("status", "available")
        .gte("lat", userLat! - RADIUS_KM / 111)
        .lte("lat", userLat! + RADIUS_KM / 111)
        .gte("lng", userLng! - RADIUS_KM / (111 * Math.cos((userLat! * Math.PI) / 180)))
        .lte("lng", userLng! + RADIUS_KM / (111 * Math.cos((userLat! * Math.PI) / 180)))
        .order("created_at", { ascending: false });

      if (data) setSpots(data);
    }

    loadNearbySpots();

    // Souscription temps réel
    const channel = supabase
      .channel("spots-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "parking_spots" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => upsertSpot(payload.new as Parameters<typeof upsertSpot>[0])
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "parking_spots" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const spot = payload.new as Parameters<typeof upsertSpot>[0];
          if (spot.status !== "available") removeSpot(spot.id);
          else upsertSpot(spot);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "parking_spots" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => removeSpot(payload.old.id as string)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userLat, userLng, setSpots, upsertSpot, removeSpot]);
}
