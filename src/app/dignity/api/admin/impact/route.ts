import { NextRequest, NextResponse } from "next/server";
import { createDignityAdminClient } from "@/lib/dignity/supabase";
import { isDignityAdmin } from "@/lib/dignity/auth";

// Action admin : ajouter une preuve d'impact à un besoin.
export async function POST(req: NextRequest) {
  if (!(await isDignityAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const need_id = String(body.need_id || "");
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const image_url = body.image_url ? String(body.image_url).trim() : null;
    const proof_file_url = body.proof_file_url
      ? String(body.proof_file_url).trim()
      : null;

    if (!need_id || !title || !description) {
      return NextResponse.json(
        { error: "Titre et description requis." },
        { status: 400 }
      );
    }

    const supabase = createDignityAdminClient();

    const { error } = await supabase.from("dignity_impact_updates").insert({
      need_id,
      title,
      description,
      image_url,
      proof_file_url,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}
