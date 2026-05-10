import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Places trouvées (finder)
  const { data: found } = await supabase
    .from("reservations")
    .select(`
      id, coin_amount, status, created_at, completed_at,
      parking_spots ( address, lat, lng )
    `)
    .eq("finder_id", user.id)
    .in("status", ["completed", "cancelled", "expired"])
    .order("created_at", { ascending: false })
    .limit(50);

  // Places partagées (sharer)
  const { data: shared } = await supabase
    .from("parking_spots")
    .select("id, address, lat, lng, coin_price, status, created_at, validated_at")
    .eq("sharer_id", user.id)
    .in("status", ["completed", "expired", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(50);

  // Profil pour les stats globales
  const { data: profile } = await supabase
    .from("profiles")
    .select("spots_found, spots_shared, coins_earned, coins_spent")
    .eq("id", user.id)
    .single();

  return (
    <HistoryClient
      found={found ?? []}
      shared={shared ?? []}
      profile={profile}
    />
  );
}
