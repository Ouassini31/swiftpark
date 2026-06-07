import { NextRequest, NextResponse } from "next/server";
import { createDignityAdminClient } from "@/lib/dignity/supabase";

// Enregistre une intention de contribution (MVP — aucun paiement réel).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const need_id = String(body.need_id || "");
    const donor_name = String(body.donor_name || "").trim();
    const donor_email = String(body.donor_email || "").trim();
    const amount = Number(body.amount);
    const message = body.message ? String(body.message).trim() : null;

    if (!need_id || !donor_name || !donor_email || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Champs manquants ou invalides." },
        { status: 400 }
      );
    }

    const supabase = createDignityAdminClient();

    // Le besoin doit exister et être public.
    const { data: need } = await supabase
      .from("dignity_needs")
      .select("id, is_public")
      .eq("id", need_id)
      .maybeSingle();

    if (!need || !need.is_public) {
      return NextResponse.json(
        { error: "Besoin introuvable ou non disponible." },
        { status: 404 }
      );
    }

    const { error } = await supabase.from("dignity_contributions").insert({
      need_id,
      donor_name,
      donor_email,
      amount,
      message,
      payment_status: "pending",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Requête invalide." },
      { status: 400 }
    );
  }
}
