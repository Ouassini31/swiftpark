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
        .gt("expires_at", new Date().toISOString()) // ← ignore les spots expirés
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Si le spot est expiré côté DB, on le marque comme tel
      if (!data) {
        // Nettoyer les vieux spots expirés en arrière-plan
        supabase
          .from("parking_spots")
          .update({ status: "expired" })
          .eq("sharer_id", profile!.id)
          .in("status", ["available", "reserved"])
          .lt("expires_at", new Date().toISOString())
          .then(() => {});
      }

      setActiveSpot(data ?? null);
    }

    fetchActiveSpot();

    // Vérifier toutes les minutes si le spot actif vient d'expirer
    const interval = setInterval(fetchActiveSpot, 60_000);

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

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [profile]);

  return { activeSpot, setActiveSpot };
}
