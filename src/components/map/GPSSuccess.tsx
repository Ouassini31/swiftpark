"use client";

// GPSSuccess — Point 6 : magie du premier usage.
// Affiché après le premier GPS check réussi (ou toute validation GPS).
// Animation radiale du check + récompense + message adapté selon si c'est
// la première contribution.

import { useEffect, useState } from "react";

const T = {
  bg:      "#fafaf7",
  ink:     "#1a1a16",
  muted:   "#aaa9a0",
  divider: "#eeeee6",
  accent:  "#22956b",
} as const;

const DM = "var(--font-dm-sans), system-ui, sans-serif";
const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 300, letterSpacing: "0.08em",
  textTransform: "uppercase",
};

interface GPSSuccessProps {
  earnedSC:   number;
  address:    string;
  isFirst?:   boolean; // première contribution → message spécial
  role?:      "finder" | "sharer"; // finder : pas de récompense SC
  onContinue: () => void;
}

export default function GPSSuccess({
  earnedSC, address, isFirst = false, role = "sharer", onContinue,
}: GPSSuccessProps) {
  const isFinder = role === "finder";
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShown(true), 50);
    return () => clearTimeout(id);
  }, []);

  const street = address.split(",")[0] ?? address;

  return (
    <div
      className="absolute inset-0 z-[960] flex flex-col"
      style={{
        background: T.bg,
        fontFamily: DM,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 18px)",
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-8">

        {/* Animated radial check */}
        <div className="relative" style={{ width: 96, height: 96 }}>
          {/* Expanding ring */}
          <span
            className="absolute rounded-full"
            style={{
              inset: -8,
              background: T.accent,
              opacity: shown ? 0 : 0.15,
              transform: shown ? "scale(1.6)" : "scale(1)",
              transition: "transform 900ms ease-out, opacity 900ms",
            }}
          />
          {/* Circle fill */}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: "#f0faf6",
              transform: shown ? "scale(1)" : "scale(0.6)",
              opacity: shown ? 1 : 0,
              transition: "transform 600ms cubic-bezier(0.2,0.9,0.2,1.1), opacity 400ms",
            }}
          />
          {/* Checkmark SVG */}
          <svg
            viewBox="0 0 32 32"
            className="absolute m-auto"
            style={{ inset: 0, width: 40, height: 40 }}
            fill="none"
            stroke={T.accent}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M7 16.5l5.5 5.5L25 9.5"
              style={{
                strokeDasharray: 24,
                strokeDashoffset: shown ? 0 : 24,
                transition: "stroke-dashoffset 700ms ease-out 250ms",
              }}
            />
          </svg>
        </div>

        {/* Title */}
        <h1 style={{
          marginTop: 28,
          fontSize: 22, fontWeight: 400,
          color: T.ink, letterSpacing: "-0.02em",
          textAlign: "center",
        }}>
          {isFinder
            ? (isFirst ? "Première place trouvée !" : "Place trouvée !")
            : (isFirst ? "Première contribution validée !" : "Position confirmée")}
        </h1>

        <p style={{
          marginTop: 6, fontSize: 13, fontWeight: 300,
          color: T.muted, textAlign: "center", maxWidth: 260,
          lineHeight: 1.5,
        }}>
          {isFinder
            ? (isFirst
                ? `Bienvenue dans SwiftPark ! Tu es maintenant à ${street}.`
                : `Tu es bien arrivé à ${street}. Profite de ta place !`)
            : (isFirst
                ? `Bienvenue dans la communauté SwiftPark. Tu es maintenant ${street}.`
                : `Vous êtes bien arrivé à ${street}. Votre récompense est créditée.`)}
        </p>

        {/* Reward block — sharer only */}
        {!isFinder && (
          <div
            className="mt-8 w-full flex flex-col items-center rounded-[14px] px-5 py-5"
            style={{ background: "#f0faf6", maxWidth: 280 }}
          >
            <p style={{ ...label, color: T.accent, textAlign: "center" }}>
              {isFirst ? "Bienvenue bonus" : "Récompense"}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span style={{
                fontSize: 56, fontWeight: 300, color: T.ink,
                lineHeight: 1, letterSpacing: "-0.04em",
                fontVariantNumeric: "tabular-nums",
              }}>
                +{earnedSC}
              </span>
              <span style={{ fontSize: 16, fontWeight: 300, color: T.muted }}>SC</span>
            </div>
            {isFirst && (
              <p style={{ ...label, color: T.muted, marginTop: 8, textAlign: "center" }}>
                Partagez une place pour en gagner plus
              </p>
            )}
          </div>
        )}
      </div>

      <div className="px-5">
        <button
          type="button"
          onClick={onContinue}
          className="w-full transition active:scale-[0.995]"
          style={{
            height: 48, borderRadius: 14,
            background: T.accent, color: "#fff",
            fontSize: 14.5, fontWeight: 400, letterSpacing: "-0.005em",
            fontFamily: DM,
          }}
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
