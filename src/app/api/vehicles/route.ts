import { NextRequest, NextResponse } from "next/server";
import { getCategory, CATEGORY_LABELS } from "@/lib/vehicle";
import { VEHICLE_BRANDS } from "@/lib/vehicleBrands";

const BASE = "https://www.carqueryapi.com/api/0.3/";

// GET /api/vehicles?cmd=makes   → liste locale worldwide
// GET /api/vehicles?cmd=models&make=volkswagen
// GET /api/vehicles?cmd=trims&make=volkswagen&model=golf&year=2020
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cmd   = searchParams.get("cmd");
  const make  = searchParams.get("make") ?? "";
  const model = searchParams.get("model") ?? "";
  const year  = searchParams.get("year") ?? "";

  // Marques : liste locale — aucune dépendance externe, couvre toutes les régions
  if (cmd === "makes") {
    return NextResponse.json({
      Makes: VEHICLE_BRANDS.map((b) => ({ make_id: b, make_display: b })),
    });
  }

  try {
    let url = "";

    if (cmd === "models" && make) {
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
