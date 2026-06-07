import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/donalia/auth";
import { adminClient } from "@/lib/donalia/supabase";
import { NEED_MIN_CENTS, NEED_MAX_CENTS, GAP_REASONS } from "@/lib/donalia/constants";

/** Crée un besoin (statut initial draft). Le montant = résiduel après droits. */
export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { programId, title, amountCents, gapReason, gapExplainer, region, beneficiaryRef } =
      await req.json();
    if (!programId || !title) {
      return NextResponse.json({ error: "Programme et titre requis" }, { status: 400 });
    }
    if (!gapReason || !(gapReason in GAP_REASONS)) {
      return NextResponse.json({ error: "Raison du trou (gap_reason) invalide" }, { status: 400 });
    }
    const cents = Number(amountCents);
    if (!cents || cents < NEED_MIN_CENTS || cents > NEED_MAX_CENTS) {
      return NextResponse.json(
        { error: `Montant entre ${NEED_MIN_CENTS / 100} et ${NEED_MAX_CENTS / 100} €.` },
        { status: 400 }
      );
    }
    const sb = adminClient();
    const { data, error } = await sb
      .from("donalia_needs")
      .insert({
        program_id: programId,
        title,
        amount_cents: cents,
        gap_reason: gapReason,
        gap_explainer: gapExplainer ?? null,
        region: region ?? null,
        beneficiary_ref: beneficiaryRef ?? null,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
