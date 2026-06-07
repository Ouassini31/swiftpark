import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/donalia/auth";
import { adminClient } from "@/lib/donalia/supabase";
import { CATEGORY_LABEL } from "@/lib/donalia/constants";

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id, title, category, description, isPublic } = await req.json();
    if (!title || !category || !(category in CATEGORY_LABEL)) {
      return NextResponse.json({ error: "Titre et catégorie valides requis" }, { status: 400 });
    }
    const sb = adminClient();

    // Organisation de référence (créée une fois)
    let { data: org } = await sb.from("donalia_organizations").select("id").limit(1).maybeSingle();
    if (!org) {
      const { data: created } = await sb
        .from("donalia_organizations")
        .insert({ name: "Association Donalia", is_interet_general: true })
        .select("id")
        .single();
      org = created;
    }

    if (id) {
      await sb
        .from("donalia_programs")
        .update({ title, category, description: description ?? null, is_public: !!isPublic })
        .eq("id", id);
      return NextResponse.json({ ok: true, id });
    }

    // slug unique
    let slug = slugify(title) || `programme-${Date.now()}`;
    const { data: existing } = await sb.from("donalia_programs").select("id").eq("slug", slug).maybeSingle();
    if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await sb
      .from("donalia_programs")
      .insert({
        org_id: org?.id,
        slug,
        title,
        category,
        description: description ?? null,
        is_public: !!isPublic,
      })
      .select("id, slug")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
