import { NextResponse } from "next/server";
import { publicClient } from "@/lib/donalia/supabase";

export async function POST(req: Request) {
  try {
    const { needId, reason } = await req.json();
    if (!needId || !reason?.trim()) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }
    // insertion publique autorisée par la RLS (anti-abus)
    const sb = publicClient();
    const { error } = await sb
      .from("donalia_reports")
      .insert({ need_id: needId, reason: reason.slice(0, 1000) });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
