import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profilsPublics } from "@/lib/profilsPublics";
import ReservationsClient from "./ReservationsClient";

export default async function ReservationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: reservations } = await supabase
    .from("reservations")
    .select(`
      *,
      parking_spots ( lat, lng, address, coin_price, is_covered, vehicle_type )
    `)
    .or(`finder_id.eq.${user.id},sharer_id.eq.${user.id}`)
    .in("status", ["reserved", "completed", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (reservations ?? []) as any[];
  const profils = await profilsPublics(supabase, rows.flatMap((r) => [r.finder_id, r.sharer_id]));

  return (
    <ReservationsClient
      reservations={rows.map((r) => ({
        ...r,
        finder: profils[r.finder_id] ?? null,
        sharer: profils[r.sharer_id] ?? null,
      }))}
      currentUserId={user.id}
    />
  );
}
