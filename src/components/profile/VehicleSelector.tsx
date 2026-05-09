"use client";

import { useState, useEffect } from "react";
import { Loader2, Car, CheckCircle } from "lucide-react";
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

interface VehicleData {
  make: string;
  model: string;
  year: number | null;
  color: string;
  length_cm: number | null;
  category: string | null;
}

interface Props {
  userId: string;
  initial: VehicleData;
}

export default function VehicleSelector({ userId, initial }: Props) {
  const [makes, setMakes]     = useState<string[]>([]);
  const [models, setModels]   = useState<string[]>([]);
  const [vehicle, setVehicle] = useState<VehicleData>(initial);
  const [specs, setSpecs]     = useState<{ length_cm: number | null; category: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [makeInput, setMakeInput] = useState(initial.make ?? "");
  const [modelInput, setModelInput] = useState(initial.model ?? "");

  // Charger les marques au montage
  useEffect(() => {
    fetch("/api/vehicles?cmd=makes")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.Makes ?? []).map((m: Record<string, string>) => m.make_display ?? m.make_id);
        setMakes(list);
      })
      .catch(() => {});
  }, []);

  // Charger les modèles quand la marque change
  useEffect(() => {
    if (!vehicle.make) { setModels([]); return; }
    fetch(`/api/vehicles?cmd=models&make=${encodeURIComponent(vehicle.make)}`)
      .then((r) => r.json())
      .then((d) => {
        const list = (d.Models ?? []).map((m: Record<string, string>) => m.model_name);
        setModels(list);
      })
      .catch(() => {});
  }, [vehicle.make]);

  // Récupérer les specs quand make + model + year sont renseignés
  useEffect(() => {
    if (!vehicle.make || !vehicle.model) { setSpecs(null); return; }
    setLoading(true);
    const y = vehicle.year ? `&year=${vehicle.year}` : "";
    fetch(`/api/vehicles?cmd=trims&make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}${y}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.length_cm) {
          setSpecs({ length_cm: d.length_cm, category: d.category });
          setVehicle((v) => ({ ...v, length_cm: d.length_cm, category: d.category }));
        } else {
          setSpecs(null);
        }
      })
      .catch(() => setSpecs(null))
      .finally(() => setLoading(false));
  }, [vehicle.make, vehicle.model, vehicle.year]);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles" as never)
      .update({
        vehicle_make:      vehicle.make || null,
        vehicle_model:     vehicle.model || null,
        vehicle_year:      vehicle.year || null,
        vehicle_color:     vehicle.color || null,
        vehicle_length_cm: vehicle.length_cm || null,
        vehicle_category:  vehicle.category || null,
      })
      .eq("id", userId);

    if (error) toast.error("Erreur lors de la sauvegarde");
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  const cat = vehicle.category ? CATEGORY_LABELS[vehicle.category] : null;

  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Car className="w-5 h-5 text-[#22956b]" />
        <h3 className="font-black text-gray-900 text-sm">Mon véhicule</h3>
        <p className="text-xs text-gray-400 ml-auto">Aide les autres à évaluer la taille de la place</p>
      </div>

      {/* Marque */}
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1.5">Marque</label>
        <input
          list="makes-list"
          value={makeInput}
          onChange={(e) => {
            setMakeInput(e.target.value);
            const match = makes.find((m) => m.toLowerCase() === e.target.value.toLowerCase());
            if (match) setVehicle((v) => ({ ...v, make: match, model: "", year: null }));
          }}
          placeholder="Ex: Volkswagen, Renault…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22956b] bg-gray-50"
        />
        <datalist id="makes-list">
          {makes.map((m) => <option key={m} value={m} />)}
        </datalist>
      </div>

      {/* Modèle */}
      {vehicle.make && (
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Modèle</label>
          <input
            list="models-list"
            value={modelInput}
            onChange={(e) => {
              setModelInput(e.target.value);
              const match = models.find((m) => m.toLowerCase() === e.target.value.toLowerCase());
              if (match) setVehicle((v) => ({ ...v, model: match }));
              else setVehicle((v) => ({ ...v, model: e.target.value }));
            }}
            placeholder="Ex: Golf, Clio…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22956b] bg-gray-50"
          />
          <datalist id="models-list">
            {models.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>
      )}

      {/* Année */}
      {vehicle.model && (
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Année (optionnel)</label>
          <input
            type="number"
            min={1990}
            max={new Date().getFullYear()}
            value={vehicle.year ?? ""}
            onChange={(e) => setVehicle((v) => ({ ...v, year: parseInt(e.target.value) || null }))}
            placeholder="Ex: 2019"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#22956b] bg-gray-50"
          />
        </div>
      )}

      {/* Gabarit auto-détecté */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Récupération des dimensions…
        </div>
      )}

      {!loading && specs && (
        <div className="bg-[#e8f5ef] border border-[#22956b]/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#085041]">Gabarit détecté automatiquement</p>
            <p className="text-lg font-black text-[#22956b] mt-0.5">
              {cat?.emoji} {cat?.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#22956b]">{specs.length_cm} cm</p>
            <p className="text-[10px] text-gray-400">longueur</p>
          </div>
        </div>
      )}

      {/* Couleur */}
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-2">Couleur</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setVehicle((v) => ({ ...v, color: c.value }))}
              title={c.label}
              className={`w-8 h-8 rounded-full border-2 transition ${
                vehicle.color === c.value ? "border-[#22956b] scale-110 shadow-md" : "border-gray-200"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
        {vehicle.color && (
          <p className="text-xs text-gray-400 mt-1.5">
            Couleur sélectionnée : <span className="font-bold text-gray-700">
              {COLORS.find((c) => c.value === vehicle.color)?.label}
            </span>
          </p>
        )}
      </div>

      {/* Bouton save */}
      <button
        onClick={handleSave}
        disabled={saving || !vehicle.make}
        className="w-full py-3 bg-[#22956b] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
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
