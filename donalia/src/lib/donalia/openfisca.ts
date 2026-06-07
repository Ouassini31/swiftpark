/**
 * Diagnostic des droits — OpenFisca est la SOURCE DE VÉRITÉ du calcul.
 *
 * GARDE-FOU : on ne réécrit JAMAIS les règles socio-fiscales ici. Si
 * OPENFISCA_API_URL est configurée, on interroge l'API ; sinon l'agent saisit
 * manuellement les aides estimées (le résiduel est alors calculé côté serveur).
 *
 * Tout résultat est une ESTIMATION : « seul l'organisme décide ».
 */

const OPENFISCA_URL = process.env.OPENFISCA_API_URL ?? "";
export const openFiscaConfigured = Boolean(OPENFISCA_URL);

export type DiagnoseSituation = {
  // Saisie agent (minimisée). Étendre selon les variables OpenFisca utilisées.
  household_size?: number;
  monthly_resources_eur?: number;
  variables?: string[]; // aides à calculer (ex: ["rsa","aspa","cheque_energie"])
  raw?: Record<string, unknown>; // payload OpenFisca complet si fourni
};

export type AidsEstimate = Record<string, number>; // libellé → centimes estimés

/**
 * Interroge OpenFisca si configuré. Retourne une carte d'aides (centimes) ou
 * null si non configuré / indisponible (l'agent saisira alors manuellement).
 */
export async function callOpenFisca(
  situation: DiagnoseSituation
): Promise<AidsEstimate | null> {
  if (!openFiscaConfigured) return null;
  try {
    const res = await fetch(`${OPENFISCA_URL.replace(/\/$/, "")}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(situation.raw ?? situation),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    // La forme exacte dépend du payload ; on renvoie tel quel pour stockage/affichage.
    return (json?.aids ?? json) as AidsEstimate;
  } catch {
    return null;
  }
}

/** Somme des aides (centimes). */
export function sumAids(aids: AidsEstimate | null | undefined): number {
  if (!aids) return 0;
  return Object.values(aids).reduce((s, v) => s + (Number(v) || 0), 0);
}
