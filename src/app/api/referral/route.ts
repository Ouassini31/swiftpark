import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { user_id, referral_code } = await req.json();
    if (!user_id || !referral_code) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Vérifier que l'utilisateur n'a pas déjà un parrain
    const { data: profile } = await supabase
      .from("profiles" as never)
      .select("referred_by")
      .eq("id", user_id)
      .single() as { data: { referred_by: string | null } | null };

    if (!profile || profile.referred_by) {
      return NextResponse.json({ error: "Déjà parrainé" }, { status: 400 });
    }

    // Trouver le parrain via son code
    const { data: referrer } = await supabase
      .from("profiles" as never)
      .select("id")
      .eq("referral_code", referral_code.toUpperCase())
      .single() as { data: { id: string } | null };

    if (!referrer) return NextResponse.json({ error: "Code invalide" }, { status: 404 });
    if (referrer.id === user_id) return NextResponse.json({ error: "Tu ne peux pas te parrainer toi-même" }, { status: 400 });

    // Lier le filleul au parrain
    await supabase.from("profiles" as never).update({ referred_by: referrer.id }).eq("id", user_id);

    // +5 SC au filleul
    await supabase.rpc("process_coin_transaction" as never, {
      p_user_id: user_id, p_amount: 5,
      p_type: "bonus", p_description: "🎁 Bonus parrainage SwiftPark",
    });

    // +5 SC au parrain
    await supabase.rpc("process_coin_transaction" as never, {
      p_user_id: referrer.id, p_amount: 5,
      p_type: "bonus", p_description: "🤝 Tu as parrainé un ami !",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[referral]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
