import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WalletClient from "./WalletClient";

export const metadata = { title: "Wallet — SwiftPark" };

export default async function WalletPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: transactions }, { data: packs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("coin_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("coin_packs").select("*").order("sort_order"),
  ]);

  return (
    <Suspense>
      <WalletClient
        profile={profile}
        transactions={transactions ?? []}
        packs={packs ?? []}
      />
    </Suspense>
  );
}
