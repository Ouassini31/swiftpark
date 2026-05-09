export function getCategory(lengthCm: number): string {
  if (lengthCm < 390) return "citadine";
  if (lengthCm < 440) return "compacte";
  if (lengthCm < 470) return "berline";
  if (lengthCm < 500) return "suv";
  return "grand";
}

export const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  citadine: { label: "Citadine",      emoji: "🟢", color: "text-green-600"  },
  compacte: { label: "Compacte",      emoji: "🟡", color: "text-yellow-600" },
  berline:  { label: "Berline",       emoji: "🟠", color: "text-orange-500" },
  suv:      { label: "SUV",           emoji: "🔴", color: "text-red-500"    },
  grand:    { label: "Grand gabarit", emoji: "🔴", color: "text-red-700"    },
};
