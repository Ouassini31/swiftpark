/**
 * Prix suggéré dynamique selon l'heure (identique au prototype)
 * Heure de pointe → 5 SC · Déjeuner → 4 SC · Heure creuse → 2 SC
 */
export interface PriceSuggestion {
  price: number;
  label: string;
  zone: string;
}

export function getSuggestedPrice(): PriceSuggestion {
  const h = new Date().getHours();

  if ((h >= 7 && h <= 10) || (h >= 17 && h <= 20)) {
    return { price: 5, label: "5 SwiftCoins", zone: "Zone centre-ville · Heure de pointe · Forte demande" };
  }
  if (h >= 11 && h <= 14) {
    return { price: 4, label: "4 SwiftCoins", zone: "Zone centre-ville · Heure de déjeuner · Demande modérée" };
  }
  return { price: 2, label: "2 SwiftCoins", zone: "Zone centre-ville · Heure creuse · Demande faible" };
}

export function netCoins(price: number): string {
  return (price * 0.75).toFixed(2);
}
