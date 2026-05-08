import { createClient } from "@/lib/supabase/server";
import WithdrawClient from "./WithdrawClient";
import { redirect } from "next/navigation";

export const metadata = { title: "Retirer mes SwiftCoins – SwiftPark" };

export default async function WithdrawPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("coin_balance, full_name, username")
    .eq("id", user.id)
    .single();

  return <WithdrawClient profile={profile} userId={user.id} />;
}
