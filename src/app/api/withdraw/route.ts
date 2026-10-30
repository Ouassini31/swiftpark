import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const MIN_WITHDRAW = 20;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { iban, name, amount } = await req.json();

    if (!iban || !name || !amount) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    if (!Number.isInteger(amount) || amount < MIN_WITHDRAW) {
      return NextResponse.json({ error: "Solde insuffisant (minimum 20 SC)" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Seules les pièces gagnées se retirent : ni les offertes, ni les rechargées
    const { data: withdrawable, error: balanceError } = await supabase.rpc("get_withdrawable_balance" as never, {
      p_user_id: user.id,
    }) as { data: number | null; error: unknown };

    if (balanceError) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    if ((withdrawable ?? 0) < amount) {
      return NextResponse.json({ error: "Montant supérieur au solde retirable" }, { status: 400 });
    }

    // Vérifier qu'il n'y a pas déjà une demande en attente
    const { data: existing } = await supabase
      .from("withdrawal_requests" as never)
      .select("id")
      .eq("user_id", user.id)
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
      p_user_id:        user.id,
      p_amount:         -amount,
      p_type:           "withdraw",
      p_description:    `💸 Retrait virement SEPA – ${amount}€`,
      p_reservation_id: null,
    });

    if (debitError) {
      return NextResponse.json({ error: "Erreur lors du débit" }, { status: 500 });
    }

    // Enregistrer la demande de retrait
    const { error: insertError } = await supabase.from("withdrawal_requests" as never).insert({
      user_id:      user.id,
      amount_sc:    amount,
      amount_eur:   amount,
      iban:         iban.replace(/\s/g, "").toUpperCase(),
      account_name: name,
      status:       "pending",
    });

    if (insertError) {
      console.error("Withdraw insert error:", insertError);
      await supabase.rpc("process_coin_transaction" as never, {
        p_user_id:        user.id,
        p_amount:         amount,
        p_type:           "refund",
        p_description:    `↩️ Retrait non enregistré – ${amount} SC`,
        p_reservation_id: null,
      });
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Withdraw error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
