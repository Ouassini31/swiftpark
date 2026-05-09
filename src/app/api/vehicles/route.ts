import { NextRequest, NextResponse } from "next/server";

const BASE = "https://www.carqueryapi.com/api/0.3/";

// Catégorie automatique selon la longueur
export function getCategory(lengthCm: number): string {
  if (lengthCm < 390)  return "citadine";
  if (lengthCm < 440)  return "compacte";
  if (lengthCm < 470)  return "berline";
  if (lengthCm < 500)  return "suv";
  return "grand";
}

export const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  citadine: { label: "Citadine",       emoji: "🟢", color: "text-green-600"  },
  compacte: { label: "Compacte",       emoji: "🟡", color: "text-yellow-600" },
  berline:  { label: "Berline",        emoji: "🟠", color: "text-orange-500" },
  suv:      { label: "SUV",            emoji: "🔴", color: "text-red-500"    },
  grand:    { label: "Grand gabarit",  emoji: "🔴", color: "text-red-700"    },
};

// GET /api/vehicles?cmd=makes
// GET /api/vehicles?cmd=models&make=volkswagen
// GET /api/vehicles?cmd=trims&make=volkswagen&model=golf&year=2020
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cmd   = searchParams.get("cmd");
  const make  = searchParams.get("make") ?? "";
  const model = searchParams.get("model") ?? "";
  const year  = searchParams.get("year") ?? "";

  try {
    let url = "";

    if (cmd === "makes") {
      url = `${BASE}?cmd=getMakes&full_results=1`;
    } else if (cmd === "models" && make) {
      url = `${BASE}?cmd=getModels&make=${encodeURIComponent(make)}&full_results=1`;
    } else if (cmd === "trims" && make && model) {
      url = `${BASE}?cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}${year ? `&year=${year}` : ""}&full_results=1`;
    } else {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const res  = await fetch(url, { headers: { "User-Agent": "SwiftPark/1.0" }, next: { revalidate: 86400 } });
    const text = await res.text();

    // carqueryapi renvoie parfois du JSONP — on extrait le JSON
    const json = text.startsWith("{") ? text : text.replace(/^[^(]+\(/, "").replace(/\);?\s*$/, "");
    const data = JSON.parse(json);

    // Pour les trims : on extrait la longueur moyenne et la catégorie
    if (cmd === "trims" && data.Trims?.length > 0) {
      const lengths: number[] = data.Trims
        .map((t: Record<string, string>) => parseInt(t.model_length ?? "0"))
        .filter((l: number) => l > 1000); // en mm

      const avgLengthMm = lengths.length > 0
        ? Math.round(lengths.reduce((a: number, b: number) => a + b, 0) / lengths.length)
        : 0;

      const lengthCm = Math.round(avgLengthMm / 10);
      const category = lengthCm > 0 ? getCategory(lengthCm) : null;

      return NextResponse.json({
        make, model, year,
        length_cm: lengthCm || null,
        category,
        category_info: category ? CATEGORY_LABELS[category] : null,
        trims_count: data.Trims.length,
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/vehicles]", err);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}
