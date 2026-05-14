import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Instrument_Serif } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"], axes: ["opsz", "wdth"], variable: "--fg", display: "swap",
});
const instrument = Instrument_Serif({
  subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--fs", display: "swap",
});

export const metadata: Metadata = {
  title: "SwiftPark — Trouvez une place. Sans tourner en rond.",
  description: "SwiftPark connecte les conducteurs qui signalent leur départ avec ceux qui cherchent une place — en temps réel.",
};

const css = `
  :root {
    --green: #06302a;
    --brand: #22956b;
    --mint:  #a3e6c8;
    --coin:  #F4B400;
    --sans: var(--fg), system-ui, sans-serif;
    --serif: var(--fs), Georgia, serif;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }

  .sp {
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    min-height: 100dvh;
    display: flex; flex-direction: column;
    background: var(--green);
    color: #fff;
    position: relative; overflow: hidden;
  }

  /* Grain */
  .sp::after {
    content: "";
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.04 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    mix-blend-mode: overlay; opacity: .8;
  }

  /* Radial glow */
  .sp::before {
    content: "";
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 80% 60% at 100% 0%, rgba(163,230,200,0.15), transparent 55%),
      radial-gradient(ellipse 50% 70% at 0% 100%, rgba(34,149,107,0.4), transparent 55%);
  }

  /* NAV */
  .sp-nav {
    position: relative; z-index: 10;
    display: flex; align-items: center; justify-content: space-between;
    padding: 28px 48px 0;
  }
  .sp-logo {
    display: flex; align-items: center; gap: 14px;
    font-weight: 800; font-size: 28px; letter-spacing: -0.035em;
    font-variation-settings: "wdth" 96;
    color: #fff;
  }
  .sp-login {
    display: inline-flex; align-items: center;
    height: 42px; padding: 0 20px; border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.07);
    font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85);
    transition: background .15s, border-color .15s;
  }
  .sp-login:hover { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.45); }

  /* MAIN */
  .sp-main {
    position: relative; z-index: 10;
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    align-items: center;
    padding: 0 48px 48px;
    max-width: 1300px;
    width: 100%;
    margin: 0 auto;
  }

  /* LEFT */
  .sp-left { padding-right: 64px; }

  .sp-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 5px 12px; border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7); font-size: 12.5px;
    margin-bottom: 28px;
  }
  .sp-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--mint);
    animation: blink 2s infinite;
  }
  @keyframes blink {
    0%,100% { opacity: 1; } 50% { opacity: .4; }
  }

  .sp-h1 {
    font-size: clamp(40px, 4.5vw, 68px);
    font-weight: 800;
    font-variation-settings: "wdth" 92, "opsz" 96;
    line-height: 1.0; letter-spacing: -0.04em;
  }
  .sp-h1 em {
    font-family: var(--serif); font-style: italic; font-weight: 400;
    color: var(--mint);
  }

  .sp-tagline {
    margin-top: 20px;
    font-size: 17px; color: rgba(255,255,255,0.55);
    line-height: 1.5; max-width: 38ch;
  }

  /* 3 bullet points */
  .sp-pills {
    margin-top: 32px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .sp-pill {
    display: flex; align-items: center; gap: 12px;
    font-size: 15px; color: rgba(255,255,255,0.82);
  }
  .sp-pill-icon {
    width: 32px; height: 32px; border-radius: 10px;
    background: rgba(255,255,255,0.08);
    display: grid; place-items: center;
    font-size: 15px; flex-shrink: 0;
  }

  /* CTA */
  .sp-cta-row {
    margin-top: 40px;
    display: flex; align-items: center; gap: 16px;
  }
  .sp-btn {
    display: inline-flex; align-items: center; gap: 8px;
    height: 52px; padding: 0 28px; border-radius: 999px;
    background: #fff; color: var(--green);
    font-weight: 700; font-size: 16px; letter-spacing: -0.01em;
    transition: background .15s, transform .15s;
    white-space: nowrap;
  }
  .sp-btn:hover { background: var(--mint); transform: translateY(-1px); }
  .sp-note {
    font-size: 12.5px; color: rgba(255,255,255,0.35);
    line-height: 1.5;
  }

  /* RIGHT */
  .sp-right {
    display: flex; flex-direction: column; gap: 16px;
  }

  /* Stat cards */
  .sp-cards {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  .sp-card {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 20px;
    padding: 24px 20px;
    backdrop-filter: blur(8px);
  }
  .sp-card.wide { grid-column: span 2; }
  .sp-card-num {
    font-size: clamp(36px, 3.5vw, 52px);
    font-weight: 800;
    font-variation-settings: "wdth" 90, "opsz" 96;
    letter-spacing: -0.05em; line-height: 1;
  }
  .sp-card-num span { color: var(--mint); font-size: 0.5em; margin-left: 4px; }
  .sp-card-label {
    margin-top: 8px;
    font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.4;
  }

  /* Coin card */
  .sp-coin-card {
    background: rgba(244,180,0,0.12);
    border: 1px solid rgba(244,180,0,0.25);
    border-radius: 20px; padding: 20px;
    display: flex; align-items: center; gap: 16px;
    backdrop-filter: blur(8px);
  }
  .sp-coin-icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--coin);
    display: grid; place-items: center;
    font-size: 22px; flex-shrink: 0;
    box-shadow: 0 8px 24px rgba(244,180,0,0.35);
  }
  .sp-coin-text { font-size: 14.5px; color: rgba(255,255,255,0.75); line-height: 1.5; }
  .sp-coin-text strong { color: var(--coin); font-weight: 600; }

  /* Mobile */
  @media (max-width: 860px) {
    .sp-nav { padding: 22px 24px 0; }
    .sp-main {
      grid-template-columns: 1fr;
      padding: 32px 24px 40px;
      gap: 40px;
    }
    .sp-left { padding-right: 0; }
    .sp-h1 { font-size: clamp(36px, 8vw, 56px); }
  }
  @media (max-width: 480px) {
    .sp-cards { grid-template-columns: 1fr; }
    .sp-card.wide { grid-column: span 1; }
  }
`;

function PulseMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ flexShrink: 0 }}>
      <style>{`@keyframes sp1{to{transform:rotate(360deg)}} @keyframes sp2{to{transform:rotate(-360deg)}}`}</style>
      <circle cx="38" cy="50" r="10" fill="currentColor" />
      <circle cx="38" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="5"
        strokeDasharray="36 12" strokeLinecap="round"
        style={{ transformOrigin: "38px 50px", animation: "sp1 9s linear infinite" }} />
      <circle cx="38" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="3"
        strokeDasharray="20 14" strokeLinecap="round" opacity={0.4}
        style={{ transformOrigin: "38px 50px", animation: "sp2 14s linear infinite" }} />
      <circle cx="84" cy="50" r="6" fill="#F4B400" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className={`sp ${bricolage.variable} ${instrument.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* NAV */}
      <header className="sp-nav">
        <Link className="sp-logo" href="/">
          <PulseMark size={76} />
          SwiftPark
        </Link>
        <Link className="sp-login" href="/auth/login">Connexion</Link>
      </header>

      {/* MAIN — tout visible d'un seul coup */}
      <main className="sp-main">

        {/* LEFT — concept + CTA */}
        <div className="sp-left">
          <div className="sp-badge">
            <span className="sp-dot" />
            Paris &amp; Île-de-France
          </div>

          <h1 className="sp-h1">
            Trouvez une place.<br />
            <em>Sans tourner en rond.</em>
          </h1>

          <p className="sp-tagline">
            Entre conducteurs, en temps réel. Tu signales ton départ — tu gagnes des SwiftCoins.
          </p>

          <div className="sp-pills">
            <div className="sp-pill">
              <div className="sp-pill-icon">🗺️</div>
              Vois les départs en temps réel sur la carte
            </div>
            <div className="sp-pill">
              <div className="sp-pill-icon">🧭</div>
              Suis la navigation directement jusqu&apos;à la place
            </div>
            <div className="sp-pill">
              <div className="sp-pill-icon">⚡</div>
              Signale ton départ, gagne des SwiftCoins
            </div>
          </div>

          <div className="sp-cta-row">
            <Link className="sp-btn" href="/onboarding">
              Commencer gratuitement →
            </Link>
            <span className="sp-note">
              5 SC offerts<br />Sans carte bancaire
            </span>
          </div>
        </div>

        {/* RIGHT — stats + coin */}
        <div className="sp-right">
          <div className="sp-cards">
            <div className="sp-card wide">
              <div style={{fontSize:"clamp(34px,3.8vw,56px)",fontWeight:800,letterSpacing:"-0.04em",lineHeight:1.05,fontVariationSettings:'"wdth" 90,"opsz" 96'}}>
                1 000 000
              </div>
              <div style={{fontSize:"clamp(22px,2.4vw,36px)",fontWeight:700,letterSpacing:"-0.03em",color:"var(--mint)",lineHeight:1.1,marginTop:4}}>
                de tonnes de CO₂
              </div>
              <p className="sp-card-label" style={{marginTop:10}}>évitables chaque année en France — ADEME</p>
            </div>
            <div className="sp-card">
              <div className="sp-card-num">30<span>%</span></div>
              <p className="sp-card-label">du trafic urbain causé par la recherche de places de parking</p>
            </div>
            <div className="sp-card">
              <div className="sp-card-num">20<span>min</span></div>
              <p className="sp-card-label">perdues en moyenne par trajet à tourner en rond</p>
            </div>
          </div>

          <div className="sp-coin-card">
            <div className="sp-coin-icon">⚡</div>
            <p className="sp-coin-text">
              <strong>1 SwiftCoin = 1 €.</strong> Gagnes-en à chaque départ signalé.
              Retirables dès 20 SC par virement SEPA.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
