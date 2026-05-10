"use client";

const DM = "var(--font-dm-sans), system-ui, sans-serif";

interface PulseMarkProps {
  size?: number;
  color?: string;
  accent?: string;
  animated?: boolean;
}

function PulseMark({
  size = 40,
  color = "#085041",
  accent = "#22956b",
  animated = false,
}: PulseMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* Centre — dot plein */}
      <circle cx="38" cy="50" r="10" fill={color} />
      {/* Ring 1 — tirets proches */}
      <circle
        cx="38" cy="50" r="22"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray="36 12"
        strokeLinecap="round"
      >
        {animated && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 38 50"
            to="360 38 50"
            dur="6s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      {/* Ring 2 — tirets espacés */}
      <circle
        cx="38" cy="50" r="36"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray="20 14"
        strokeLinecap="round"
        opacity="0.45"
      >
        {animated && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 38 50"
            to="0 38 50"
            dur="9s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      {/* Accent dot — le "pulse" */}
      <circle cx="84" cy="50" r="6" fill={accent} />
    </svg>
  );
}

interface SwiftParkLogoProps {
  /** Taille du PulseMark en px */
  markSize?: number;
  /** Taille de la police du wordmark */
  fontSize?: number;
  /** Couleur principale (mark + texte) */
  color?: string;
  /** Couleur accent (dot pulse) */
  accent?: string;
  /** Affiche un fond pill */
  pill?: boolean;
  /** Anime les rings du mark */
  animated?: boolean;
  className?: string;
}

export default function SwiftParkLogo({
  markSize = 36,
  fontSize = 18,
  color = "#085041",
  accent = "#22956b",
  pill = false,
  animated = false,
  className = "",
}: SwiftParkLogoProps) {
  const inner = (
    <div
      className={`flex items-center gap-2 ${className}`}
      style={{ fontFamily: DM }}
    >
      <PulseMark size={markSize} color={color} accent={accent} animated={animated} />
      <span
        style={{
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1,
          color,
        }}
      >
        Swift<span style={{ color: accent }}>Park</span>
      </span>
    </div>
  );

  if (!pill) return inner;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-2xl shadow-sm"
      style={{
        background: "#fff",
        border: "1px solid #eeeee6",
        fontFamily: DM,
      }}
    >
      <PulseMark size={markSize} color={color} accent={accent} animated={animated} />
      <span
        style={{
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1,
          color,
        }}
      >
        Swift<span style={{ color: accent }}>Park</span>
      </span>
    </div>
  );
}
