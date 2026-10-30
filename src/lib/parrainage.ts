import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Applique un code de parrainage au compte donné. Renvoie l'erreur, ou null si tout s'est bien passé. */
export async function appliquerParrainage(
  userId: string,
  referralCode: string
): Promise<{ error: string; status: number } | null> {
  const supabase = getSupabase();

  // Trouver le parrain via son code
  const { data: referrer } = await supabase
    .from("profiles" as never)
    .select("id")
    .eq("referral_code", referralCode.toUpperCase())
    .single() as { data: { id: string } | null };

  if (!referrer) return { error: "Code invalide", status: 404 };
  if (referrer.id === userId) return { error: "Tu ne peux pas te parrainer toi-même", status: 400 };

  // Lier le filleul au parrain : la condition empêche deux appels simultanés de payer deux fois
  const { data: linked } = await supabase
    .from("profiles" as never)
    .update({ referred_by: referrer.id })
    .eq("id", userId)
    .is("referred_by", null)
    .select("id")
    .maybeSingle() as { data: { id: string } | null };

  if (!linked) return { error: "Déjà parrainé", status: 400 };

  // +5 SC au filleul
  await supabase.rpc("process_coin_transaction" as never, {
    p_user_id: userId, p_amount: 5,
    p_type: "bonus", p_description: "🎁 Bonus parrainage SwiftPark", p_is_withdrawable: false,
  });

  // +5 SC au parrain
  await supabase.rpc("process_coin_transaction" as never, {
    p_user_id: referrer.id, p_amount: 5,
    p_type: "bonus", p_description: "🤝 Tu as parrainé un ami !", p_is_withdrawable: false,
  });

  return null;
}
