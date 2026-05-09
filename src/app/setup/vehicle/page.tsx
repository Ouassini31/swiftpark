"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, Check, Info } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getCategory } from "@/lib/vehicle";

/* ─── Données ─── */
const COLORS = [
  { value: "blanc",   label: "Blanc",    hex: "#f5f5f5", border: "#d1d5db" },
  { value: "noir",    label: "Noir",     hex: "#111111" },
  { value: "gris",    label: "Gris",     hex: "#6b7280" },
  { value: "argent",  label: "Argenté",  hex: "#c0c0c0", border: "#d1d5db" },
  { value: "rouge",   label: "Rouge",    hex: "#dc2626" },
  { value: "bleu",    label: "Bleu",     hex: "#2563eb" },
  { value: "vert",    label: "Vert",     hex: "#16a34a" },
  { value: "jaune",   label: "Jaune",    hex: "#ca8a04" },
  { value: "orange",  label: "Orange",   hex: "#ea580c" },
  { value: "marron",  label: "Marron",   hex: "#7c2d12" },
  { value: "beige",   label: "Beige",    hex: "#d4b483", border: "#c9a96e" },
  { value: "violet",  label: "Violet",   hex: "#7c3aed" },
];

const CATEGORIES = [
  { value: "citadine", label: "Citadine",      size: "XS", desc: "Twingo, 108, C1…",    range: "< 390 cm",  icon: "🚗", w: 60  },
  { value: "compacte", label: "Compacte",      size: "S",  desc: "Clio, 208, Golf…",    range: "390–440 cm", icon: "🚗", w: 72  },
  { value: "berline",  label: "Berline",       size: "M",  desc: "Mégane, 508, Série 3", range: "440–470 cm", icon: "🚗", w: 84  },
  { value: "suv",      label: "SUV",           size: "L",  desc: "Peugeot 3008, RAV4…", range: "470–500 cm", icon: "🚙", w: 96  },
  { value: "grand",    label: "Grand gabarit", size: "XL", desc: "Touareg, Tesla X…",   range: "> 500 cm",  icon: "🚐", w: 108 },
];

const STEPS = ["Véhicule", "Gabarit", "Finitions"];

export default function SetupVehiclePage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [userId, setUserId]       = useState<string | null>(null);

  /* Étape 1 */
  const [makes, setMakes]         = useState<string[]>([]);
  const [models, setModels]       = useState<string[]>([]);
  const [make, setMake]           = useState("");
  const [model, setModel]         = useState("");
  const [year, setYear]           = useState<number | null>(null);

  /* Étape 2 */
  const [lengthCm, setLengthCm]   = useState<number>(420);
  const [category, setCategory]   = useState<string>("compacte");
  const [autoDetected, setAutoDetected] = useState(false);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  /* Étape 3 */
  const [color, setColor]         = useState("");
  const [plate, setPlate]         = useState("");
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);

  /* Auth */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient().auth.getUser() as Promise<any>).then((res: any) => {
      if (res?.data?.user) setUserId(res.data.user.id);
    });
  }, []);

  /* Marques */
  useEffect(() => {
    fetch("/api/vehicles?cmd=makes")
      .then((r) => r.json())
      .then((d) => setMakes((d.Makes ?? []).map((m: Record<string, string>) => m.make_display ?? m.make_id)))
      .catch(() => {});
  }, []);

  /* Modèles */
  useEffect(() => {
    if (!make) { setModels([]); return; }
    fetch(`/api/vehicles?cmd=models&make=${encodeURIComponent(make)}`)
      .then((r) => r.json())
      .then((d) => setModels((d.Models ?? []).map((m: Record<string, string>) => m.model_name)))
      .catch(() => {});
  }, [make]);

  /* Specs auto */
  useEffect(() => {
    if (!make || !model) return;
    setLoadingSpecs(true);
    setAutoDetected(false);
    const y = year ? `&year=${year}` : "";
    fetch(`/api/vehicles?cmd=trims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}${y}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.length_cm) {
          setLengthCm(d.length_cm);
          setCategory(d.category ?? getCategory(d.length_cm));
          setAutoDetected(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSpecs(false));
  }, [make, model, year]);

  /* Sync catégorie ↔ longueur (quand slider bouge) */
  function handleLengthChange(val: number) {
    setLengthCm(val);
    setCategory(getCategory(val));
  }

  /* Catégorie ↔ longueur (quand on clique sur une carte) */
  function handleCategoryCard(cat: string) {
    setCategory(cat);
    const mid: Record<string, number> = {
      citadine: 370, compacte: 415, berline: 455, suv: 485, grand: 520,
    };
    setLengthCm(mid[cat] ?? 420);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles" as never)
      .update({
        vehicle_make:      make,
        vehicle_model:     model,
        vehicle_year:      year,
        vehicle_color:     color,
        vehicle_length_cm: lengthCm,
        vehicle_category:  category,
        vehicle_plate:     plate.trim().toUpperCase() || null,
      })
      .eq("id", userId);

    if (error) { toast.error("Erreur lors de la sauvegarde"); setSaving(false); return; }
    router.push("/map");
  }

  const canStep1 = make.trim().length > 0 && model.trim().length > 0;
  const canStep3 = color !== "";

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f5ef] via-[#f0f9f5] to-[#f5f5f2] flex flex-col">

      {/* Header + Progress */}
      <div className="px-6 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#22956b] to-[#1a7a58] rounded-2xl flex items-center justify-center shadow-lg shadow-[#22956b]/30">
            <span className="text-xl">🚗</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Mon véhicule</h1>
            <p className="text-xs text-gray-500">Étape {step + 1} sur {STEPS.length}</p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="flex gap-2 mb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${
                i < step  ? "bg-[#22956b]" :
                i === step ? "bg-[#22956b]" :
                             "bg-gray-200"
              }`} />
              <p className={`text-[10px] font-bold mt-1 text-center ${
                i <= step ? "text-[#22956b]" : "text-gray-400"
              }`}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Étape 1 : Marque / Modèle / Année ─── */}
      {step === 0 && (
        <div className="flex-1 px-5 space-y-4 pb-10">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
            <p className="text-sm font-black text-gray-900">Quelle est ta voiture ?</p>

            {/* Marque */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Marque <span className="text-red-400">*</span></label>
              <input
                list="makes-list"
                value={make}
                onChange={(e) => { setMake(e.target.value); setModel(""); setAutoDetected(false); }}
                placeholder="Renault, BYD, Tesla, Peugeot…"
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#22956b] focus:bg-white transition font-medium"
              />
              <datalist id="makes-list">
                {makes.map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>

            {/* Modèle */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Modèle <span className="text-red-400">*</span></label>
              <input
                list="models-list"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={make ? "Golf, Clio, Model 3…" : "Choisis d'abord une marque"}
                disabled={!make}
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#22956b] focus:bg-white transition font-medium disabled:opacity-40"
              />
              <datalist id="models-list">
                {models.map((m) => <option key={m} value={m} />)}
              </datalist>
            </div>

            {/* Année */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Année <span className="text-gray-400 normal-case font-normal">(optionnel)</span>
              </label>
              <input
                type="number"
                min={1990}
                max={new Date().getFullYear()}
                value={year ?? ""}
                onChange={(e) => setYear(parseInt(e.target.value) || null)}
                placeholder="Ex : 2021"
                className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#22956b] focus:bg-white transition font-medium"
              />
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 px-4">
            Si ta marque n&apos;apparaît pas dans les suggestions, tape-la directement.
          </p>

          <button
            onClick={() => setStep(1)}
            disabled={!canStep1}
            className="w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black rounded-2xl text-sm shadow-xl shadow-[#22956b]/30 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            Continuer <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Étape 2 : Gabarit ─── */}
      {step === 1 && (
        <div className="flex-1 px-5 space-y-4 pb-10">

          {/* Résumé véhicule */}
          <div className="bg-white rounded-3xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#22956b]/10 rounded-xl flex items-center justify-center text-base">🚗</div>
            <div>
              <p className="text-sm font-black text-gray-900">{make} {model}</p>
              <p className="text-xs text-gray-400">{year ?? "Année non renseignée"}</p>
            </div>
          </div>

          {/* Chargement specs */}
          {loadingSpecs && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Détection des dimensions…
            </div>
          )}

          {!loadingSpecs && (
            <>
              {/* Badge auto-détecté */}
              {autoDetected && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold text-emerald-700">Dimensions détectées automatiquement · tu peux les ajuster si besoin</p>
                </div>
              )}
              {!autoDetected && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs font-semibold text-amber-700">Dimensions non trouvées — choisis ton gabarit ci-dessous</p>
                </div>
              )}

              {/* Slider longueur */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-black text-gray-900">Longueur du véhicule</p>
                  <div className="bg-[#22956b]/10 rounded-xl px-3 py-1">
                    <span className="text-lg font-black text-[#22956b]">{lengthCm}</span>
                    <span className="text-xs font-semibold text-[#22956b]"> cm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={300}
                  max={600}
                  step={5}
                  value={lengthCm}
                  onChange={(e) => handleLengthChange(Number(e.target.value))}
                  className="w-full accent-[#22956b] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>300 cm</span>
                  <span>450 cm</span>
                  <span>600 cm</span>
                </div>
              </div>

              {/* Cartes gabarit */}
              <div className="space-y-2">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide px-1">Gabarit</p>
                {CATEGORIES.map((cat) => {
                  const active = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => handleCategoryCard(cat.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition text-left ${
                        active
                          ? "border-[#22956b] bg-[#22956b]/5"
                          : "border-gray-100 bg-white"
                      }`}
                    >
                      {/* Silhouette taille */}
                      <div className="flex items-end shrink-0" style={{ width: 56 }}>
                        <div
                          className={`rounded-lg transition-all ${active ? "bg-[#22956b]" : "bg-gray-200"}`}
                          style={{ height: 24, width: Math.round((cat.w / 108) * 56) }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                            active ? "bg-[#22956b] text-white" : "bg-gray-100 text-gray-500"
                          }`}>{cat.size}</span>
                          <span className="text-sm font-black text-gray-900">{cat.label}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">{cat.range}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-500 shadow-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black rounded-2xl text-sm shadow-xl shadow-[#22956b]/30 flex items-center justify-center gap-2"
            >
              Continuer <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Étape 3 : Couleur + Plaque ─── */}
      {step === 2 && (
        <div className="flex-1 px-5 space-y-4 pb-10">

          {/* Résumé */}
          <div className="bg-white rounded-3xl px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-gray-900">{make} {model}</p>
              <p className="text-xs text-gray-400">{year ?? ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-[#22956b]/10 text-[#22956b]">
                {CATEGORIES.find(c => c.value === category)?.size ?? "?"} · {lengthCm} cm
              </span>
            </div>
          </div>

          {/* Couleur */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm font-black text-gray-900 mb-4">Couleur <span className="text-red-400">*</span></p>

            <div className="grid grid-cols-6 gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  onMouseEnter={() => setHoveredColor(c.value)}
                  onMouseLeave={() => setHoveredColor(null)}
                  title={c.label}
                  className={`relative w-full aspect-square rounded-2xl border-[3px] transition-all active:scale-95 ${
                    color === c.value
                      ? "border-[#22956b] scale-110 shadow-lg"
                      : "border-gray-100"
                  }`}
                  style={{ backgroundColor: c.hex, borderColor: color === c.value ? "#22956b" : (c.border ?? "transparent") }}
                >
                  {color === c.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-4 h-4 drop-shadow-md" style={{ color: c.value === "blanc" || c.value === "argent" || c.value === "beige" ? "#22956b" : "#fff" }} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Nom de la couleur survolée ou sélectionnée */}
            <div className="mt-3 h-6 flex items-center justify-center">
              {(hoveredColor || color) && (
                <p className="text-sm font-bold text-gray-700 transition-all">
                  {hoveredColor
                    ? COLORS.find(c => c.value === hoveredColor)?.label
                    : color
                    ? `${COLORS.find(c => c.value === color)?.label} sélectionné ✓`
                    : ""}
                </p>
              )}
            </div>
          </div>

          {/* Plaque d'immatriculation */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-black text-gray-900">Plaque d&apos;immatriculation</p>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">Optionnel</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Aide à identifier ta voiture parmi d&apos;autres similaires (couleur, marque identiques).
            </p>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="AB-123-CD"
              maxLength={9}
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#22956b] focus:bg-white transition font-black tracking-widest text-center uppercase"
            />
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Format français · jamais visible par les autres utilisateurs
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-500 shadow-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={!canStep3 || saving || !userId}
              className="flex-1 py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black rounded-2xl text-sm shadow-xl shadow-[#22956b]/30 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Accéder à la carte <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400">
            Tu pourras modifier tout ça dans ton profil à tout moment.
          </p>
        </div>
      )}
    </div>
  );
}
