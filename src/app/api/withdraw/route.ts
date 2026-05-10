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
    const { user_id, iban, name, amount } = await req.json();

    if (!user_id || !iban || !name || !amount) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Vérifier le solde
    const { data: profile } = await supabase
      .from("profiles" as never)
      .select("coin_balance")
      .eq("id", user_id)
      .single() as { data: { coin_balance: number } | null };

    if (!profile) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    if (profile.coin_balance < 20) {
      return NextResponse.json({ error: "Solde insuffisant (minimum 20 SC)" }, { status: 400 });
    }

    if (profile.coin_balance < amount) {
      return NextResponse.json({ error: "Montant supérieur au solde disponible" }, { status: 400 });
    }

    // Vérifier qu'il n'y a pas déjà une demande en attente
    const { data: existing } = await supabase
      .from("withdrawal_requests" as never)
      .select("id")
      .eq("user_id", user_id)
      .eq("status", "pending")
      .maybeSingle() as { data: { id: string } | null };

    if (existing) {
      return NextResponse.json(
        { error: "Tu as déjà une demande de retrait en cours. Attends qu'elle soit traitée avant d'en faire une nouvelle." },
        { status: 409 }
      );
    }

    // Débiter les SwiftCoins
    const { error: debitError } = await supabase.rpc("process_coin_transaction" as never, {
      p_user_id:        user_id,
      p_amount:         -amount,
      p_type:           "spend",
      p_description:    `💸 Retrait virement SEPA – ${amount}€`,
      p_reservation_id: null,
    });

    if (debitError) {
      return NextResponse.json({ error: "Erreur lors du débit" }, { status: 500 });
    }

    // Enregistrer la demande de retrait
    await supabase.from("withdrawal_requests" as never).insert({
      user_id,
      amount_sc:    amount,
      amount_eur:   amount,
      iban:         iban.replace(/\s/g, "").toUpperCase(),
      account_name: name,
      status:       "pending",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Withdraw error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
