"use client";

import { useState } from "react";
import { Loader2, CheckCircle, Check, Info } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { getCategory } from "@/lib/vehicle";
import { toast } from "sonner";
import VehiclePicker from "@/components/vehicle/VehiclePicker";

/* ─── Couleurs ─── */
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

/* ─── Gabarits ─── */
const CATEGORIES = [
  { value: "citadine", label: "Citadine",      size: "XS", desc: "Twingo, 108, C1…",     range: "< 390 cm",   w: 60  },
  { value: "compacte", label: "Compacte",      size: "S",  desc: "Clio, 208, Golf…",     range: "390–440 cm", w: 72  },
  { value: "berline",  label: "Berline",       size: "M",  desc: "Mégane, 508, Série 3", range: "440–470 cm", w: 84  },
  { value: "suv",      label: "SUV",           size: "L",  desc: "3008, RAV4, Touareg…", range: "470–500 cm", w: 96  },
  { value: "grand",    label: "Grand gabarit", size: "XL", desc: "Tesla X, Sprinter…",   range: "> 500 cm",   w: 108 },
];

interface VehicleData {
  make: string;
  model: string;
  year: number | null;
  color: string;
  length_cm: number | null;
  category: string | null;
  plate?: string;
}

interface Props {
  userId: string;
  initial: VehicleData;
}

export default function VehicleSelector({ userId, initial }: Props) {
  /* Champs */
  const [make, setMake]         = useState(initial.make ?? "");
  const [model, setModel]       = useState(initial.model ?? "");
  const [year, setYear]         = useState<number | null>(initial.year ?? null);
  const [color, setColor]       = useState(initial.color ?? "");
  const [plate, setPlate]       = useState((initial as unknown as Record<string, unknown>).plate as string ?? "");
  const [lengthCm, setLengthCm] = useState<number>(initial.length_cm ?? 420);
  const [category, setCategory] = useState<string>(initial.category ?? "compacte");

  /* UI */
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);

  /* Appelé par VehiclePicker quand un modèle est sélectionné */
  function handleModelSelect(newMake: string, newModel: string, localLengthCm?: number) {
    setMake(newMake);
    setModel(newModel);
    setAutoDetected(false);

    if (!newModel) return;

    if (localLengthCm) {
      setLengthCm(localLengthCm);
      setCategory(getCategory(localLengthCm));
      setAutoDetected(true);
    } else if (newMake && newModel) {
      setLoadingSpecs(true);
      const y = year ? `&year=${year}` : "";
      fetch(`/api/vehicles?cmd=trims&make=${encodeURIComponent(newMake)}&model=${encodeURIComponent(newModel)}${y}`)
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
    }
  }

  function handleLengthChange(val: number) {
    setLengthCm(val);
    setCategory(getCategory(val));
    setAutoDetected(false);
  }

  function handleCategoryCard(cat: string) {
    setCategory(cat);
    const mid: Record<string, number> = {
      citadine: 370, compacte: 415, berline: 455, suv: 485, grand: 520,
    };
    setLengthCm(mid[cat] ?? 420);
    setAutoDetected(false);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles" as never)
      .update({
        vehicle_make:      make || null,
        vehicle_model:     model || null,
        vehicle_year:      year || null,
        vehicle_color:     color || null,
        vehicle_length_cm: lengthCm || null,
        vehicle_category:  category || null,
        vehicle_plate:     plate.trim().toUpperCase() || null,
      })
      .eq("id", userId);

    if (error) { toast.error("Erreur lors de la sauvegarde"); }
    else { setSaved(true); toast.success("Véhicule mis à jour ✓"); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <section className="space-y-3">

      {/* ── Marque + Modèle + Année ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <p className="text-sm font-black text-gray-900">🚗 Mon véhicule</p>

        {/* Two-panel picker */}
        <VehiclePicker
          make={make}
          model={model}
          onMakeChange={(m) => { setMake(m); setModel(""); setAutoDetected(false); }}
          onModelChange={(m, len) => handleModelSelect(make, m, len)}
        />

        {/* Année */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            Année <span className="normal-case font-normal text-gray-400">(optionnel)</span>
          </label>
          <input
            type="number"
            min={1990}
            max={new Date().getFullYear()}
            value={year ?? ""}
            onChange={(e) => setYear(parseInt(e.target.value) || null)}
            placeholder="Ex : 2021"
            className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#22956b] focus:bg-white transition"
          />
        </div>
      </div>

      {/* ── Gabarit ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-gray-900">📐 Gabarit</p>
          {loadingSpecs && <Loader2 className="w-4 h-4 animate-spin text-[#22956b]" />}
          {!loadingSpecs && autoDetected && (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Détecté auto
            </span>
          )}
          {!loadingSpecs && !autoDetected && make && model && (
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
              <Info className="w-3 h-3" /> Manuel
            </span>
          )}
        </div>

        {/* Slider longueur */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-semibold">Longueur</span>
            <span className="text-sm font-black text-[#22956b]">{lengthCm} cm</span>
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
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>300</span><span>450</span><span>600 cm</span>
          </div>
        </div>

        {/* Cartes gabarit */}
        <div className="space-y-2">
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryCard(cat.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                  active ? "border-[#22956b] bg-[#22956b]/5" : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex items-end shrink-0" style={{ width: 44 }}>
                  <div
                    className={`rounded transition-all ${active ? "bg-[#22956b]" : "bg-gray-300"}`}
                    style={{ height: 18, width: Math.round((cat.w / 108) * 44) }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      active ? "bg-[#22956b] text-white" : "bg-gray-200 text-gray-500"
                    }`}>{cat.size}</span>
                    <span className="text-xs font-bold text-gray-800">{cat.label}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{cat.desc}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{cat.range}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Couleur ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-gray-900">🎨 Couleur</p>
          <p className="text-xs font-bold text-gray-500 h-4">
            {hoveredColor
              ? COLORS.find(c => c.value === hoveredColor)?.label
              : color
              ? `${COLORS.find(c => c.value === color)?.label} ✓`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              onMouseEnter={() => setHoveredColor(c.value)}
              onMouseLeave={() => setHoveredColor(null)}
              title={c.label}
              className={`relative w-8 h-8 rounded-full border-[3px] transition-all active:scale-95 ${
                color === c.value ? "scale-110 shadow-md" : ""
              }`}
              style={{
                backgroundColor: c.hex,
                borderColor: color === c.value ? "#22956b" : (c.border ?? "#e5e7eb"),
              }}
            >
              {color === c.value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check
                    className="w-3 h-3 drop-shadow"
                    style={{ color: ["blanc", "argent", "beige", "jaune"].includes(c.value) ? "#22956b" : "#fff" }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plaque ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-black text-gray-900">🪪 Plaque d&apos;immatriculation</p>
          <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-semibold">Optionnel</span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          Utile si tu as plusieurs voitures similaires au même endroit. Jamais visible par les autres.
        </p>
        <input
          type="text"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="AB-123-CD"
          maxLength={9}
          className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-black tracking-widest text-center uppercase outline-none focus:border-[#22956b] focus:bg-white transition"
        />
      </div>

      {/* ── Bouton save ── */}
      <button
        onClick={handleSave}
        disabled={saving || !make}
        className="w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black rounded-2xl text-sm shadow-lg shadow-[#22956b]/30 disabled:opacity-40 flex items-center justify-center gap-2 transition active:scale-[.98]"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <><CheckCircle className="w-4 h-4" /> Véhicule enregistré !</>
        ) : (
          "Enregistrer mon véhicule"
        )}
      </button>
    </section>
  );
}
