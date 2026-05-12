"use client";

// CyclePrompt — Point 3 : transition A→B.
// Affiché 30 secondes après que le GPS détecte que l'utilisateur s'est garé
// (vitesse ≈ 0 depuis 5+ secondes, pas de place active déjà partagée).
// Compte à rebours 30s : si pas de réponse → se ferme automatiquement.

import { useEffect, useState } from "react";

const T = {
  bg:      "#fafaf7",
  surface: "#f4f4f0",
  ink:     "#1a1a16",
  muted:   "#aaa9a0",
  divider: "#eeeee6",
  accent:  "#22956b",
} as const;

const DM = "var(--font-dm-sans), system-ui, sans-serif";
const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 300, letterSpacing: "0.08em",
  textTransform: "uppercase", color: T.muted,
};

interface CyclePromptProps {
  address:     string;
  estimatedSC: number;
  onAccept:    () => void;
  onDecline:   () => void;
}

export default function CyclePrompt({
  address, estimatedSC, onAccept, onDecline,
}: CyclePromptProps) {
  const INITIAL = 30;
  const [s, setS] = useState(INITIAL);

  useEffect(() => {
    if (s <= 0) { onDecline(); return; }
    const id = setTimeout(() => setS((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [s, onDecline]);

  const ratio = Math.max(0, s / INITIAL);
  const street = address.split(",")[0] ?? address;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-[950] flex items-end"
      style={{ background: "rgba(26,26,22,0.32)", backdropFilter: "blur(2px)", fontFamily: DM }}
    >
      <div
        className="w-full"
        style={{
          background: T.bg,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
        }}
      >
        {/* Countdown bar */}
        <div
          style={{
            height: 2, background: T.divider,
            borderTopLeftRadius: 14, borderTopRightRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            className="h-full transition-[width] duration-1000"
            style={{ width: `${ratio * 100}%`, background: T.accent }}
          />
        </div>

        <div className="px-6 pt-6 pb-4">
          <p style={label}>Vous restez ici un moment ?</p>
          <h2 style={{
            marginTop: 8, fontSize: 22, fontWeight: 400,
            color: T.ink, letterSpacing: "-0.02em", lineHeight: 1.2,
          }}>
            Partagez votre information<br />
            de départ et gagnez {estimatedSC} SC
          </h2>
          <p style={{
            marginTop: 10, fontSize: 13, fontWeight: 300,
            color: T.muted, lineHeight: 1.5,
          }}>
            Quand vous quitterez {street}, prévenez la communauté pour qu'un
            autre conducteur puisse récupérer l'emplacement.
          </p>

          {/* Récompense + countdown */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-[14px] px-4 py-3" style={{ background: "#f0faf6" }}>
              <p style={{ ...label, color: T.accent }}>Récompense estimée</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span style={{
                  fontSize: 28, fontWeight: 300, color: T.ink,
                  lineHeight: 1, letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {estimatedSC}
                </span>
                <span style={{ fontSize: 13, fontWeight: 300, color: T.muted }}>SC</span>
              </div>
            </div>
            <div className="rounded-[14px] px-4 py-3" style={{ background: T.surface }}>
              <p style={label}>Réponse dans</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span style={{
                  fontSize: 28, fontWeight: 300, color: T.ink,
                  lineHeight: 1, letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {s}
                </span>
                <span style={{ fontSize: 13, fontWeight: 300, color: T.muted }}>s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 flex gap-2">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 transition active:scale-[0.995]"
            style={{
              height: 48, borderRadius: 14,
              background: T.surface, color: T.ink,
              fontSize: 14.5, fontWeight: 300, letterSpacing: "-0.005em",
              fontFamily: DM,
            }}
          >
            Non, merci
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="transition active:scale-[0.995]"
            style={{
              flex: 1.4, height: 48, borderRadius: 14,
              background: T.accent, color: "#fff",
              fontSize: 14.5, fontWeight: 400, letterSpacing: "-0.005em",
              fontFamily: DM,
            }}
          >
            Oui, je signale
          </button>
        </div>
      </div>
    </div>
  );
}
