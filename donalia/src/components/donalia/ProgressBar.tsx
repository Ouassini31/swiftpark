import { euroCents, pctCents } from "@/lib/donalia/format";

/** Jauge-signature (barre) : la panse du D qui se remplit, même vert que l'arc du logo. */
export function ProgressBar({
  collectedCents,
  targetCents,
}: {
  collectedCents: number;
  targetCents: number;
}) {
  const p = pctCents(collectedCents, targetCents);
  const full = p >= 100;
  return (
    <div>
      <div className="gauge-row">
        <b>{euroCents(collectedCents)} réunis</b>
        <span>sur {euroCents(targetCents)}</span>
      </div>
      <div className="gauge" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
        <div className={`gauge__fill ${full ? "gauge__fill--full" : ""}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

/** Jauge-signature en ARC (écho direct de la panse du D) — pour les encarts. */
export function ArcGauge({
  collectedCents,
  targetCents,
  size = 96,
}: {
  collectedCents: number;
  targetCents: number;
  size?: number;
}) {
  const p = pctCents(collectedCents, targetCents);
  const r = 42;
  const circ = Math.PI * r; // demi-cercle
  const dash = (p / 100) * circ;
  return (
    <div className="arc" style={{ width: size, height: size * 0.62 }}>
      <svg viewBox="0 0 100 60" width={size} height={size * 0.62}>
        <path d="M6 54 A44 44 0 0 1 94 54" fill="none" stroke="var(--bg2)" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M6 54 A44 44 0 0 1 94 54"
          fill="none"
          stroke="var(--green-deep)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div className="arc__lbl" style={{ justifyContent: "flex-end", paddingBottom: 2 }}>
        <span className="arc__pct" style={{ fontSize: size * 0.26 }}>{p}%</span>
        <span className="arc__cap">financé</span>
      </div>
    </div>
  );
}
