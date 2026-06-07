import { NextRequest, NextResponse } from "next/server";
import { createDignityAdminClient } from "@/lib/dignity/supabase";
import { DIGNITY_CATEGORIES } from "@/lib/dignity/constants";

const URGENCY = ["faible", "moyenne", "forte", "critique"];

// Dépôt public d'un besoin. Statut initial : pending_verification, non public.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const first_name = String(body.first_name || "").trim();
    const last_name = String(body.last_name || "").trim();
    const email = String(body.email || "").trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const country = String(body.country || "").trim();
    const city = String(body.city || "").trim();
    const category = String(body.category || "").trim();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const amount_requested = Number(body.amount_requested);
    const urgency_level = String(body.urgency_level || "moyenne");
    const anonymized_publication = body.anonymized_publication !== false;
    const main_image_url = body.main_image_url
      ? String(body.main_image_url).trim()
      : null;

    // Validation
    if (
      !first_name ||
      !last_name ||
      !email ||
      !country ||
      !city ||
      !title ||
      !description ||
      !amount_requested ||
      amount_requested <= 0
    ) {
      return NextResponse.json(
        { error: "Merci de remplir tous les champs obligatoires." },
        { status: 400 }
      );
    }

    if (!DIGNITY_CATEGORIES.includes(category as never)) {
      return NextResponse.json(
        { error: "Catégorie invalide." },
        { status: 400 }
      );
    }

    if (!URGENCY.includes(urgency_level)) {
      return NextResponse.json(
        { error: "Niveau d'urgence invalide." },
        { status: 400 }
      );
    }

    const supabase = createDignityAdminClient();

    const { data, error } = await supabase
      .from("dignity_needs")
      .insert({
        first_name,
        last_name,
        email,
        phone,
        country,
        city,
        category,
        title,
        description,
        amount_requested,
        urgency_level,
        anonymized_publication,
        main_image_url,
        status: "pending_verification",
        is_public: false,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}
