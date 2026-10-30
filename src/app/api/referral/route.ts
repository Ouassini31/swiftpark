import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appliquerParrainage } from "@/lib/parrainage";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { referral_code } = await req.json();
    if (!referral_code) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const refus = await appliquerParrainage(user.id, referral_code);
    if (refus) return NextResponse.json({ error: refus.error }, { status: refus.status });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[referral]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
