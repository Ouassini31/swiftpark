"use client";

import { useEffect, useState } from "react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";
import type { Database } from "@/types/database";

type Spot = Database["public"]["Tables"]["parking_spots"]["Row"];

export function useActiveSpot() {
  const profile = useMapStore((s) => s.profile);
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);

  useEffect(() => {
    if (!profile) return;

    async function fetchActiveSpot() {
      const supabase = createClient();
      const { data } = await supabase
        .from("parking_spots")
        .select("*")
        .eq("sharer_id", profile!.id)
        .in("status", ["available", "reserved"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setActiveSpot(data ?? null);
    }

    fetchActiveSpot();

    // Écouter les changements en temps réel
    const supabase = createClient();
    const channel = supabase
      .channel("active-spot")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "parking_spots",
        filter: `sharer_id=eq.${profile.id}`,
      }, () => fetchActiveSpot())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  return { activeSpot, setActiveSpot };
}
