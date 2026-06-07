import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/donalia/auth";
import { adminClient } from "@/lib/donalia/supabase";
import { callOpenFisca, sumAids } from "@/lib/donalia/openfisca";

/**
 * Enregistre un bilan des droits (rights_diagnoses) pour un besoin.
 * OpenFisca est la source de vérité : si configuré, on l'interroge pour pré-remplir
 * les aides ; sinon l'agent fournit les aides estimées manuellement.
 *
 * `aids` : map { libellé: euros }. `residualEur` : reste après droits (= base besoin).
 * Tout est ESTIMATION : « seul l'organisme décide ».
 */
export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { needId, aids, residualEur, note, situation, setNeedAmount } = await req.json();
    if (!needId) return NextResponse.json({ error: "needId manquant" }, { status: 400 });

    // Aides : en centimes. Pré-remplissage OpenFisca si configuré.
    let aidsCents: Record<string, number> = {};
    const fromOpenFisca = situation ? await callOpenFisca(situation) : null;
    if (fromOpenFisca) {
      aidsCents = fromOpenFisca; // déjà en centimes (convention API)
    } else if (aids && typeof aids === "object") {
      for (const [k, v] of Object.entries(aids)) aidsCents[k] = Math.round(Number(v) * 100) || 0;
    }

    const residualCents =
      residualEur != null ? Math.round(Number(residualEur) * 100) : null;

    const sb = adminClient();
    const { error } = await sb.from("donalia_rights_diagnoses").insert({
      need_id: needId,
      estimated_aids: aidsCents,
      residual_cents: residualCents,
      source: fromOpenFisca ? "openfisca" : "saisie_agent",
      is_estimate: true,
      note: note ?? null,
    });
    if (error) throw error;

    // Optionnel : aligner le montant du besoin sur le résiduel diagnostiqué.
    if (setNeedAmount && residualCents && residualCents >= 3000 && residualCents <= 50000) {
      await sb.from("donalia_needs").update({ amount_cents: residualCents }).eq("id", needId);
    }

    return NextResponse.json({
      ok: true,
      sumAidsCents: sumAids(aidsCents),
      residualCents,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
