"use client";

import { useEffect } from "react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { useMapStore } from "@/store/useMapStore";

export function useProfile() {
  const { profile, setProfile } = useMapStore();

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
    }

    load();

    // Écoute les changements du profil en temps réel (balance SC, etc.)
    const sub = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => setProfile(payload.new as ReturnType<typeof useMapStore.getState>["profile"])
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [setProfile]);

  return profile;
}
