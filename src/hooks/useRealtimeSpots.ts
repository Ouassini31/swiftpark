"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import { haversineDistance } from "@/lib/utils";

const RADIUS_KM    = 2;
const NOTIF_RADIUS = 1000; // mètres — alerte si place à moins d'1 km

export function useRealtimeSpots() {
  const { userLat, userLng, setSpots, upsertSpot, removeSpot, profile } = useMapStore();

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

    // ── Temps réel ──────────────────────────────────────────────────────
    const channel = supabase
      .channel("spots-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "parking_spots" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const spot = payload.new as Parameters<typeof upsertSpot>[0];
          upsertSpot(spot);

          // Notification in-app si la place est proche et pas la nôtre
          if (!profile || spot.sharer_id === profile.id) return;
          if (!userLat || !userLng) return;

          const dist = haversineDistance(userLat, userLng, spot.lat, spot.lng);
          if (dist <= NOTIF_RADIUS) {
            const distStr = dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`;
            toast(`🅿️ Place disponible à ${distStr} !`, {
              description: spot.address?.split(",")[0] ?? "Près de toi",
              duration: 6000,
              action: {
                label: "Voir",
                onClick: () => {
                  // Centrer la carte sur la place
                  useMapStore.getState().setMapCenter(spot.lat, spot.lng, 16);
                },
              },
            });
          }
        }
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
  }, [userLat, userLng, setSpots, upsertSpot, removeSpot, profile]);
}
