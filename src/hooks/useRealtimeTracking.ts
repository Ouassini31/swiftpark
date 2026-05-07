"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClientAny as createClient } from "@/lib/supabase/client";

interface TrackingState {
  finderLat: number | null;
  finderLng: number | null;
  finderAccuracy: number | null;
  isFinderOnline: boolean;
}

interface UseRealtimeTrackingReturn extends TrackingState {
  sendPosition: (lat: number, lng: number, accuracy: number) => void;
}

export function useRealtimeTracking(reservationId: string): UseRealtimeTrackingReturn {
  const [state, setState] = useState<TrackingState>({
    finderLat: null,
    finderLng: null,
    finderAccuracy: null,
    isFinderOnline: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!reservationId) return;

    const supabase = createClient();
    const channelName = `tracking:${reservationId}`;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on(
        "broadcast",
        { event: "position" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (msg: any) => {
          const { lat, lng, accuracy } = msg.payload ?? {};
          if (lat == null || lng == null) return;

          setState({
            finderLat: lat,
            finderLng: lng,
            finderAccuracy: accuracy ?? null,
            isFinderOnline: true,
          });

          // Mark finder offline if no position received for 12 s (3× interval)
          if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = setTimeout(() => {
            setState((prev) => ({ ...prev, isFinderOnline: false }));
          }, 12000);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [reservationId]);

  const sendPosition = useCallback(
    (lat: number, lng: number, accuracy: number) => {
      const channel = channelRef.current;
      if (!channel) return;

      channel.send({
        type: "broadcast",
        event: "position",
        payload: { lat, lng, accuracy },
      });
    },
    []
  );

  return { ...state, sendPosition };
}
