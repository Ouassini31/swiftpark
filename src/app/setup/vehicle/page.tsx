"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Car, ArrowRight } from "lucide-react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const COLORS = [
  { value: "blanc",   label: "Blanc",   hex: "#ffffff" },
  { value: "noir",    label: "Noir",    hex: "#111111" },
  { value: "gris",    label: "Gris",    hex: "#888888" },
  { value: "argent",  label: "Argenté", hex: "#c0c0c0" },
  { value: "rouge",   label: "Rouge",   hex: "#e53e3e" },
  { value: "bleu",    label: "Bleu",    hex: "#3182ce" },
  { value: "vert",    label: "Vert",    hex: "#38a169" },
  { value: "jaune",   label: "Jaune",   hex: "#d69e2e" },
  { value: "orange",  label: "Orange",  hex: "#dd6b20" },
  { value: "marron",  label: "Marron",  hex: "#7b341e" },
  { value: "beige",   label: "Beige",   hex: "#d4b483" },
  { value: "violet",  label: "Violet",  hex: "#805ad5" },
];

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  citadine: { label: "Citadine",      emoji: "🟢" },
  compacte: { label: "Compacte",      emoji: "🟡" },
  berline:  { label: "Berline",       emoji: "🟠" },
  suv:      { label: "SUV",           emoji: "🔴" },
  grand:    { label: "Grand gabarit", emoji: "🔴" },
};

export default function SetupVehiclePage() {
  const router = useRouter();
  const [userId, setUserId]       = useState<string | null>(null);
  const [makes, setMakes]         = useState<string[]>([]);
  const [models, setModels]       = useState<string[]>([]);
  const [make, setMake]           = useState("");
  const [model, setModel]         = useState("");
  const [year, setYear]           = useState<number | null>(null);
  const [color, setColor]         = useState("");
  const [specs, setSpecs]         = useState<{ length_cm: number; category: string } | null>(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [saving, setSaving]       = useState(false);

  // Récupérer l'utilisateur
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient().auth.getUser() as Promise<any>).then((res: any) => {
      if (res?.data?.user) setUserId(res.data.user.id);
    });
  }, []);

  // Charger les marques
  useEffect(() => {
    fetch("/api/vehicles?cmd=makes")
      .then((r) => r.json())
      .then((d) => setMakes((d.Makes ?? []).map((m: Record<string, string>) => m.make_display ?? m.make_id)))
      .catch(() => {});
  }, []);

  // Charger les modèles selon la marque
  useEffect(() => {
    if (!make) { setModels([]); return; }
    fetch(`/api/vehicles?cmd=models&make=${encodeURIComponent(make)}`)
      .then((r) => r.json())
      .then((d) => setModels((d.Models ?? []).map((m: Record<string, string>) => m.model_name)))
      .catch(() => {});
  }, [make]);

  // Récupérer les specs auto
  useEffect(() => {
    if (!make || !model) { setSpecs(null); return; }
    setLoadingSpecs(true);
    const y = year ? `&year=${year}` : "";
    fetch(`/api/vehicles?cmd=trims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}${y}`)
      .then((r) => r.json())
      .then((d) => { if (d.length_cm) setSpecs({ length_cm: d.length_cm, category: d.category }); else setSpecs(null); })
      .catch(() => setSpecs(null))
      .finally(() => setLoadingSpecs(false));
  }, [make, model, year]);

  const canSave = make && model && color;

  async function handleSave() {
    if (!canSave || !userId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles" as never)
      .update({
        vehicle_make:      make,
        vehicle_model:     model,
        vehicle_year:      year,
        vehicle_color:     color,
        vehicle_length_cm: specs?.length_cm ?? null,
        vehicle_category:  specs?.category ?? null,
      })
      .eq("id", userId);

    if (error) { toast.error("Erreur lors de la sauvegarde"); setSaving(false); return; }
    router.push("/map");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8f5ef] to-[#f5f5f2] flex flex-col">

      {/* Header */}
      <div className="px-6 pt-14 pb-6 text-center">
        <div className="w-16 h-16 bg-[#22956b] rounded-[20px] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#22956b]/40">
          <Car className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Ton véhicule</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
          Obligatoire pour utiliser SwiftPark. Cela permet aux autres conducteurs de savoir si ta place leur convient.
        </p>
      </div>

      {/* Formulaire */}
      <div className="flex-1 px-5 space-y-4 pb-10">

        {/* Marque */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Marque <span className="text-red-400">*</span></label>
          <input
            list="makes-list"
            value={make}
            onChange={(e) => { setMake(e.target.value); setModel(""); setSpecs(null); }}
            placeholder="Ex: Volkswagen, Renault, Peugeot…"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#22956b] shadow-sm"
          />
          <datalist id="makes-list">
            {makes.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>

        {/* Modèle */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Modèle <span className="text-red-400">*</span></label>
          <input
            list="models-list"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={make ? "Ex: Golf, Clio, 308…" : "Choisis d'abord une marque"}
            disabled={!make}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#22956b] shadow-sm disabled:opacity-50"
          />
          <datalist id="models-list">
            {models.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>

        {/* Année */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Année <span className="text-gray-400 font-normal">(optionnel)</span></label>
          <input
            type="number"
            min={1990}
            max={new Date().getFullYear()}
            value={year ?? ""}
            onChange={(e) => setYear(parseInt(e.target.value) || null)}
            placeholder="Ex: 2019"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-[#22956b] shadow-sm"
          />
        </div>

        {/* Gabarit auto */}
        {loadingSpecs && (
          <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Récupération des dimensions…
          </div>
        )}
        {!loadingSpecs && specs && (
          <div className="bg-white border-2 border-[#22956b]/30 rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[11px] text-gray-400 font-semibold">Gabarit détecté automatiquement</p>
              <p className="text-lg font-black text-[#22956b] mt-0.5">
                {CATEGORY_LABELS[specs.category]?.emoji} {CATEGORY_LABELS[specs.category]?.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#22956b]">{specs.length_cm}<span className="text-sm font-semibold"> cm</span></p>
            </div>
          </div>
        )}

        {/* Couleur */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">Couleur <span className="text-red-400">*</span></label>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                title={c.label}
                className={`w-9 h-9 rounded-full border-[3px] transition-all ${
                  color === c.value ? "border-[#22956b] scale-110 shadow-lg" : "border-gray-200"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          {color && (
            <p className="text-xs text-gray-400 mt-2">
              {COLORS.find((c) => c.value === color)?.label} sélectionné
            </p>
          )}
        </div>

        {/* Bouton */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black rounded-2xl text-sm shadow-xl shadow-[#22956b]/30 disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>Accéder à la carte <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          Tu pourras modifier ces infos à tout moment dans ton profil
        </p>
      </div>
    </div>
  );
}

