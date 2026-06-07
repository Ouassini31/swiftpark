import { NextResponse } from "next/server";
import { adminClient, isAdminConfigured } from "@/lib/donalia/supabase";
import { createCheckout } from "@/lib/donalia/helloasso";

export async function POST(req: Request) {
  try {
    const { programId, needId, amountCents, tipCents, donorEmail, donorName } = await req.json();

    // ── GARDE-FOU : un don exige TOUJOURS un programme ────────────────────────
    if (!programId) {
      return NextResponse.json(
        { error: "Un don doit être rattaché à un programme." },
        { status: 400 }
      );
    }
    if (!amountCents || Number(amountCents) < 100) {
      return NextResponse.json({ error: "Montant invalide (min 1 €)." }, { status: 400 });
    }
    if (!donorEmail || !String(donorEmail).includes("@")) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    const checkout = await createCheckout({
      amountCents: Number(amountCents),
      tipCents: Number(tipCents) || 0,
      donorEmail,
      donorName: donorName ?? undefined,
      programId,
      needId: needId ?? null,
      siteUrl: origin,
    });

    if (isAdminConfigured) {
      const sb = adminClient();
      await sb.from("donalia_donations").insert({
        program_id: programId,
        need_id: needId ?? null,
        amount_cents: Number(amountCents),
        tip_cents: Number(tipCents) || 0,
        donor_email: donorEmail,
        donor_name: donorName ?? null,
        status: "pending",
        helloasso_checkout_intent_id: checkout.checkoutIntentId,
      });
    }

    return NextResponse.json({ redirectUrl: checkout.redirectUrl, demo: checkout.demo });
  } catch (err) {
    console.error("donate error", err);
    return NextResponse.json({ error: "Erreur lors de la création du don." }, { status: 500 });
  }
}
