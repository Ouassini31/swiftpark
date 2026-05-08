import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code     = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/map";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // Vérifier si c'est un nouvel utilisateur (0 coins gagnés = première connexion)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("coin_balance, coins_earned")
        .eq("id", user.id)
        .single();

      // Nouvel utilisateur → 5 SwiftCoins de bienvenue
      if (profile && profile.coin_balance === 0 && profile.coins_earned === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc("process_coin_transaction", {
          p_user_id:     user.id,
          p_amount:      5,
          p_type:        "bonus",
          p_description: "🎁 Bonus de bienvenue SwiftPark",
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirect}`);
}
