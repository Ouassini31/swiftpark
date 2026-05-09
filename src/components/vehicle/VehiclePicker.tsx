"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronRight, RotateCcw, PenLine } from "lucide-react";
import { VEHICLE_DATA, ALL_BRANDS } from "@/lib/vehicleData";

interface VehiclePickerProps {
  make: string;
  model: string;
  onMakeChange: (make: string) => void;
  /** lengthCm is provided when the model is found in the local DB */
  onModelChange: (model: string, lengthCm?: number) => void;
}

export default function VehiclePicker({
  make,
  model,
  onMakeChange,
  onModelChange,
}: VehiclePickerProps) {
  const makeRef  = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  /* Is the current make/model from the local DB or free-typed? */
  const makeInDb  = ALL_BRANDS.includes(make);
  const modelsForMake = makeInDb ? VEHICLE_DATA[make].models : [];
  const modelInDb = modelsForMake.some((m) => m.name === model);

  /* "autre" modes */
  const [customMakeMode, setCustomMakeMode] = useState(!makeInDb && make !== "");
  const [customModelMode, setCustomModelMode] = useState(!modelInDb && model !== "");

  /* Sync modes when props change externally (e.g. reset) */
  useEffect(() => {
    if (!make) { setCustomMakeMode(false); setCustomModelMode(false); }
  }, [make]);

  /* Auto-scroll selected make into view */
  useEffect(() => {
    if (!makeInDb || !makeRef.current) return;
    const el = makeRef.current.querySelector(`[data-make="${make}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [make, makeInDb]);

  /* Auto-scroll selected model into view */
  useEffect(() => {
    if (!modelInDb || !modelRef.current) return;
    const el = modelRef.current.querySelector(`[data-model="${model}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [model, modelInDb]);

  function selectMake(brand: string) {
    setCustomMakeMode(false);
    setCustomModelMode(false);
    onMakeChange(brand);
    onModelChange("", undefined); // reset model when brand changes
  }

  function selectModel(name: string, lengthCm: number) {
    setCustomModelMode(false);
    onModelChange(name, lengthCm);
  }

  function enterCustomMake() {
    setCustomMakeMode(true);
    setCustomModelMode(false);
    onMakeChange("");
    onModelChange("", undefined);
  }

  function enterCustomModel() {
    setCustomModelMode(true);
    onModelChange("", undefined);
  }

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="flex gap-2 h-[272px]">

      {/* ── Left column : Marques ── */}
      <div className="flex flex-col w-[45%]">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 px-1">
          Marque
        </p>

        {customMakeMode ? (
          /* Free-text mode */
          <div className="flex flex-col flex-1 gap-2">
            <input
              autoFocus
              value={make}
              onChange={(e) => onMakeChange(e.target.value)}
              placeholder="Ex: Alpine, Lucid…"
              className="bg-gray-50 border-2 border-[#22956b] rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
            />
            <button
              onClick={() => { setCustomMakeMode(false); onMakeChange(""); onModelChange("", undefined); }}
              className="flex items-center gap-1 text-[11px] text-[#22956b] font-bold px-1"
            >
              <RotateCcw className="w-3 h-3" /> Retour à la liste
            </button>
          </div>
        ) : (
          /* Scrollable list */
          <div ref={makeRef} className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 overscroll-contain">
            {ALL_BRANDS.map((brand) => {
              const active = brand === make && !customMakeMode;
              return (
                <button
                  key={brand}
                  data-make={brand}
                  onClick={() => selectMake(brand)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition border-b border-gray-100/60 last:border-0 ${
                    active
                      ? "bg-[#22956b] text-white font-bold"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  <span className="truncate">{brand}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                </button>
              );
            })}

            {/* "Autre" */}
            <button
              onClick={enterCustomMake}
              className="w-full flex items-center gap-1.5 px-3 py-2.5 text-left text-xs text-[#22956b] font-bold hover:bg-[#22956b]/5 transition"
            >
              <PenLine className="w-3 h-3" /> Autre marque…
            </button>
          </div>
        )}
      </div>

      {/* ── Right column : Modèles ── */}
      <div className="flex flex-col flex-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 px-1">
          Modèle
        </p>

        {!make && !customMakeMode ? (
          /* No brand selected yet */
          <div className="flex-1 flex items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-300 font-semibold text-center px-4">
              Choisis d&apos;abord<br />une marque
            </p>
          </div>
        ) : customModelMode ? (
          /* Free-text model */
          <div className="flex flex-col flex-1 gap-2">
            <input
              autoFocus
              value={model}
              onChange={(e) => onModelChange(e.target.value, undefined)}
              placeholder="Ex: Espace, i10…"
              className="bg-gray-50 border-2 border-[#22956b] rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
            />
            <button
              onClick={() => { setCustomModelMode(false); onModelChange("", undefined); }}
              className="flex items-center gap-1 text-[11px] text-[#22956b] font-bold px-1"
            >
              <RotateCcw className="w-3 h-3" /> Retour à la liste
            </button>
          </div>
        ) : customMakeMode ? (
          /* Custom brand → free-text model */
          <div className="flex flex-col flex-1 gap-2">
            <input
              value={model}
              onChange={(e) => onModelChange(e.target.value, undefined)}
              placeholder="Nom du modèle"
              className="bg-gray-50 border-2 border-transparent focus:border-[#22956b] rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
            />
          </div>
        ) : (
          /* Scrollable model list */
          <div ref={modelRef} className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 overscroll-contain">
            {modelsForMake.map((m) => {
              const active = m.name === model && !customModelMode;
              return (
                <button
                  key={m.name}
                  data-model={m.name}
                  onClick={() => selectModel(m.name, m.lengthCm)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition border-b border-gray-100/60 last:border-0 ${
                    active
                      ? "bg-[#22956b] text-white font-bold"
                      : "text-gray-700 hover:bg-white"
                  }`}
                >
                  <span className="truncate">{m.name}</span>
                  {active && (
                    <span className="text-[10px] font-bold opacity-80 shrink-0 ml-1">
                      {m.lengthCm} cm
                    </span>
                  )}
                </button>
              );
            })}

            {/* "Autre" */}
            <button
              onClick={enterCustomModel}
              className="w-full flex items-center gap-1.5 px-3 py-2.5 text-left text-xs text-[#22956b] font-bold hover:bg-[#22956b]/5 transition"
            >
              <PenLine className="w-3 h-3" /> Autre modèle…
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
