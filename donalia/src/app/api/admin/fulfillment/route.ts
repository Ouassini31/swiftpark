import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/donalia/auth";
import { adminClient } from "@/lib/donalia/supabase";

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { needId, vendor, amountEur, invoiceUrl, purchasedAt } = await req.json();
    if (!needId) return NextResponse.json({ error: "needId manquant" }, { status: 400 });

    const sb = adminClient();
    const { error } = await sb.from("donalia_fulfillments").insert({
      need_id: needId,
      vendor: vendor ?? null,
      amount_cents: amountEur ? Math.round(Number(amountEur) * 100) : null,
      invoice_url: invoiceUrl ?? null,
      purchased_at: purchasedAt || null,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
