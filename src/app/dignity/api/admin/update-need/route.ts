import { NextRequest, NextResponse } from "next/server";
import { createDignityAdminClient } from "@/lib/dignity/supabase";
import { isDignityAdmin } from "@/lib/dignity/auth";
import { DIGNITY_STATUSES } from "@/lib/dignity/constants";

const VALID_STATUSES = Object.keys(DIGNITY_STATUSES);

// Action admin : changer le statut / visibilité d'un besoin et journaliser.
export async function POST(req: NextRequest) {
  if (!(await isDignityAdmin())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const need_id = String(body.need_id || "");
    const status_after = String(body.status || "");
    const verification_method = body.verification_method
      ? String(body.verification_method)
      : null;
    const internal_note = body.internal_note ? String(body.internal_note) : null;
    const public_note = body.public_note ? String(body.public_note) : null;
    const admin_label = body.admin_label ? String(body.admin_label) : "admin";

    if (!need_id || !VALID_STATUSES.includes(status_after)) {
      return NextResponse.json(
        { error: "Paramètres invalides." },
        { status: 400 }
      );
    }

    const supabase = createDignityAdminClient();

    const { data: current } = await supabase
      .from("dignity_needs")
      .select("status, verified_at")
      .eq("id", need_id)
      .maybeSingle();

    if (!current) {
      return NextResponse.json(
        { error: "Besoin introuvable." },
        { status: 404 }
      );
    }

    const status_before = current.status as string;
    const nowIso = new Date().toISOString();

    // Visibilité publique : explicite si fournie, sinon déduite du statut.
    const publicStatuses = ["verified", "funding", "funded", "completed"];
    const is_public =
      typeof body.is_public === "boolean"
        ? body.is_public
        : publicStatuses.includes(status_after);

    const update: Record<string, unknown> = {
      status: status_after,
      is_public,
    };

    // verified_at posé la première fois qu'un besoin devient vérifié/finançable.
    if (
      !current.verified_at &&
      ["verified", "funding", "funded", "completed"].includes(status_after)
    ) {
      update.verified_at = nowIso;
    }
    if (status_after === "completed") {
      update.completed_at = nowIso;
    }

    const { error: updateError } = await supabase
      .from("dignity_needs")
      .update(update)
      .eq("id", need_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Journal de vérification.
    const { error: logError } = await supabase
      .from("dignity_verification_logs")
      .insert({
        need_id,
        admin_label,
        verification_method,
        internal_note,
        public_note,
        status_before,
        status_after,
      });

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}
