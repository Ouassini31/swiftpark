import type { DignityNeed } from "./types";

/** Formate un montant en euros (locale FR). */
export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Date lisible en français. */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

/** Pourcentage de financement (0–100, borné). */
export function fundingProgress(need: Pick<DignityNeed, "amount_requested" | "amount_collected">): number {
  if (!need.amount_requested || need.amount_requested <= 0) return 0;
  const pct = (need.amount_collected / need.amount_requested) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * Nom à afficher publiquement selon la préférence d'anonymisation.
 * Anonymisé → prénom + initiale du nom. Sinon → prénom + nom.
 */
export function publicDisplayName(
  need: Pick<DignityNeed, "first_name" | "last_name" | "anonymized_publication">
): string {
  if (need.anonymized_publication) {
    const initial = need.last_name?.trim()?.[0];
    return initial ? `${need.first_name} ${initial}.` : need.first_name;
  }
  return `${need.first_name} ${need.last_name}`.trim();
}
