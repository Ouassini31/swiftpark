import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SearchClient from "./SearchClient";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; min?: string; max?: string; covered?: string; vehicle?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Construire la requête avec filtres
  let query = supabase
    .from("parking_spots")
    .select("*, profiles!parking_spots_sharer_id_fkey(username, full_name, rating)")
    .eq("status", "available")
    .gt("expires_at", new Date().toISOString())
    .order("coin_price", { ascending: true });

  if (searchParams.min) query = query.gte("coin_price", Number(searchParams.min));
  if (searchParams.max) query = query.lte("coin_price", Number(searchParams.max));
  if (searchParams.covered === "1") query = query.eq("is_covered", true);
  if (searchParams.vehicle && searchParams.vehicle !== "all") {
    query = query.eq("vehicle_type", searchParams.vehicle);
  }
  if (searchParams.q) {
    query = query.ilike("address", `%${searchParams.q}%`);
  }

  const { data: spots } = await query.limit(50);

  return <SearchClient spots={spots ?? []} initialFilters={searchParams} />;
}
