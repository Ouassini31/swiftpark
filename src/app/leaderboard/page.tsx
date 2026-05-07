import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: sharers }, { data: finders }, { data: currentProfile }] = await Promise.all([
    supabase.from("top_sharers").select("*").limit(20),
    supabase.from("top_finders").select("*").limit(20),
    supabase.from("profiles").select("id, username, coins_earned, spots_found, spots_shared").eq("id", user.id).single(),
  ]);

  return (
    <LeaderboardClient
      sharers={sharers ?? []}
      finders={finders ?? []}
      currentUserId={user.id}
      currentProfile={currentProfile}
    />
  );
}
