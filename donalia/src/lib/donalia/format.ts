export function euroCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

/** euros (number) → centimes (int) */
export function toCents(euros: number): number {
  return Math.round((euros || 0) * 100);
}

export function pctCents(collected: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((collected / target) * 100));
}

export function dateFr(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
