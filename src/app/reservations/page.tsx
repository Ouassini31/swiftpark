import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReservationsClient from "./ReservationsClient";

export default async function ReservationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      *,
      parking_spots ( lat, lng, address, coin_price, is_covered, vehicle_type ),
      finder:profiles!reservations_finder_id_fkey ( id, username, full_name, rating ),
      sharer:profiles!reservations_sharer_id_fkey ( id, username, full_name, rating )
    `)
    .or(`finder_id.eq.${user.id},sharer_id.eq.${user.id}`)
    .in("status", ["reserved", "completed", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <ReservationsClient
      reservations={reservations ?? []}
      currentUserId={user.id}
    />
  );
}
