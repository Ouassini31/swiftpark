import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/donalia/auth";
import { adminClient } from "@/lib/donalia/supabase";
import { TRANSITIONS, type NeedStatus } from "@/lib/donalia/constants";

export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id, status, patch } = await req.json();
    if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
    const sb = adminClient();

    // ── Changement d'état (machine à états + garde-fous « droits d'abord ») ────
    if (status) {
      const { data: need } = await sb
        .from("donalia_needs")
        .select("status, gap_reason, activation_traced")
        .eq("id", id)
        .maybeSingle();
      if (!need) return NextResponse.json({ error: "Besoin introuvable" }, { status: 404 });

      const allowed = TRANSITIONS[need.status as NeedStatus] ?? [];
      if (!allowed.includes(status as NeedStatus)) {
        return NextResponse.json(
          { error: `Transition ${need.status} → ${status} non autorisée.` },
          { status: 400 }
        );
      }

      // GARDE-FOU : pas de en_revue / publie sans diagnostic des droits lié.
      if (status === "en_revue" || status === "publie") {
        const { count } = await sb
          .from("donalia_rights_diagnoses")
          .select("*", { count: "exact", head: true })
          .eq("need_id", id);
        if (!count) {
          return NextResponse.json(
            { error: "Diagnostic des droits requis avant cette étape (droits d'abord)." },
            { status: 400 }
          );
        }
      }
      // GARDE-FOU : non_recours non publiable tant que l'activation n'est pas tracée.
      if (status === "publie" && need.gap_reason === "non_recours" && !need.activation_traced) {
        return NextResponse.json(
          { error: "Non-recours : tracez d'abord la tentative d'activation du droit." },
          { status: 400 }
        );
      }

      await sb.from("donalia_needs").update({ status }).eq("id", id);
      return NextResponse.json({ ok: true });
    }

    // ── Édition de champs autorisés ───────────────────────────────────────────
    if (patch && typeof patch === "object") {
      const allowedFields = [
        "title",
        "amount_cents",
        "gap_reason",
        "gap_explainer",
        "region",
        "beneficiary_ref",
        "justification_url",
        "activation_traced",
        "proof_required",
      ];
      const clean: Record<string, unknown> = {};
      for (const k of allowedFields) if (k in patch) clean[k] = patch[k];
      await sb.from("donalia_needs").update(clean).eq("id", id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
