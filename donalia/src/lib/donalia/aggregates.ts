import "server-only";
import { adminClient, isAdminConfigured } from "./supabase";
import { sumAids } from "./openfisca";

/**
 * Taux de couverture moyen par les droits AVANT sollicitation des donateurs,
 * au niveau d'un PROGRAMME (jamais d'un individu).
 *
 * RGPD : le calcul lit les diagnostics (données sensibles) côté serveur, mais
 * seule une moyenne agrégée quitte le serveur. On n'expose RIEN par besoin.
 * Anti ré-identification : on ne renvoie la stat que si l'échantillon est
 * suffisant (>= MIN_SAMPLE besoins diagnostiqués).
 */
export const MIN_SAMPLE = 3;

export async function programRightsCoverage(
  programId: string
): Promise<{ pct: number; n: number } | null> {
  if (!isAdminConfigured) return null;
  const sb = adminClient();

  const { data: needs } = await sb
    .from("donalia_needs")
    .select("id, amount_cents")
    .eq("program_id", programId);
  if (!needs?.length) return null;

  const amountByNeed = new Map(needs.map((n) => [n.id, Number(n.amount_cents)]));
  const { data: diags } = await sb
    .from("donalia_rights_diagnoses")
    .select("need_id, estimated_aids")
    .in("need_id", Array.from(amountByNeed.keys()));
  if (!diags?.length) return null;

  const seen = new Set<string>();
  const coverages: number[] = [];
  for (const d of diags) {
    if (seen.has(d.need_id)) continue; // un diagnostic par besoin
    seen.add(d.need_id);
    const aids = sumAids(d.estimated_aids as Record<string, number> | null); // centimes
    const residual = amountByNeed.get(d.need_id) ?? 0;
    const denom = aids + residual;
    if (denom > 0) coverages.push(aids / denom);
  }

  if (coverages.length < MIN_SAMPLE) return null; // échantillon trop petit
  const pct = Math.round((100 * coverages.reduce((a, b) => a + b, 0)) / coverages.length);
  return { pct, n: coverages.length };
}
