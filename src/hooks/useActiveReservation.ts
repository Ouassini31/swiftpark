"use client";

import { useEffect, useRef, useState } from "react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";

export interface ActiveReservation {
  id:             string;
  spot_id:        string;
  sharer_id:      string;
  coin_amount:    number;
  sharer_receive: number;
  status:         string;
  expires_at:     string;
  created_at:     string;
  spot: {
    address:    string | null;
    lat:        number;
    lng:        number;
    expires_at: string; // sharer's planned departure
  } | null;
}

export interface CompletedReservation {
  id:           string;
  sharer_id:    string;
  spot_address: string | null;
}

export function useActiveReservation() {
  const profile = useMapStore((s) => s.profile);
  const [reservation, setReservation]             = useState<ActiveReservation | null>(null);
  const [completedReservation, setCompletedRes]   = useState<CompletedReservation | null>(null);

  // Ref so the realtime callback can access the latest reservation without stale closure
  const reservationRef = useRef<ActiveReservation | null>(null);
  useEffect(() => { reservationRef.current = reservation; }, [reservation]);

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("reservations" as never)
        .select(`
          id, spot_id, sharer_id, coin_amount, sharer_receive,
          status, expires_at, created_at,
          parking_spots ( address, lat, lng, expires_at )
        `)
        .eq("finder_id", profile!.id)
        .eq("status", "reserved")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle() as { data: unknown };

      if (!data) { setReservation(null); return; }
      const row    = data as Record<string, unknown>;
      const spotRow = row["parking_spots"] as Record<string, unknown> | null;
      setReservation({
        id:             row["id"] as string,
        spot_id:        row["spot_id"] as string,
        sharer_id:      row["sharer_id"] as string,
        coin_amount:    row["coin_amount"] as number,
        sharer_receive: row["sharer_receive"] as number,
        status:         row["status"] as string,
        expires_at:     row["expires_at"] as string,
        created_at:     row["created_at"] as string,
        spot: spotRow ? {
          address:    spotRow["address"] as string | null,
          lat:        spotRow["lat"] as number,
          lng:        spotRow["lng"] as number,
          expires_at: spotRow["expires_at"] as string,
        } : null,
      });
    }

    load();

    const channel = supabase
      .channel("active-reservation")
      .on("postgres_changes", {
        event:  "UPDATE",
        schema: "public",
        table:  "reservations",
        filter: `finder_id=eq.${profile.id}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, (payload: any) => {
        const row = payload.new as Record<string, unknown>;

        if (row["status"] === "completed") {
          // Réservation complétée → déclencher la notation
          const current = reservationRef.current;
          setCompletedRes({
            id:           row["id"] as string,
            sharer_id:    row["sharer_id"] as string,
            spot_address: current?.spot?.address ?? null,
          });
          setReservation(null);
        } else {
          load();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  function clearReservation() { setReservation(null); }
  function clearCompleted()   { setCompletedRes(null); }

  return { reservation, clearReservation, completedReservation, clearCompleted };
}
