import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/donalia/auth";
import { adminClient } from "@/lib/donalia/supabase";

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { needId, mediaUrl, caption, published } = await req.json();
    if (!needId) return NextResponse.json({ error: "needId manquant" }, { status: 400 });

    const sb = adminClient();
    const { error } = await sb.from("donalia_proofs").insert({
      need_id: needId,
      media_url: mediaUrl ?? null, // l'OBJET remis, jamais le visage du bénéficiaire
      caption: caption ?? null,
      published: !!published,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
