import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WalletClient from "./WalletClient";

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("coin_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return <WalletClient profile={profile} transactions={transactions ?? []} />;
}
