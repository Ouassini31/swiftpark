"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const DM = "var(--font-dm-sans), system-ui, sans-serif";

const STATS = [
  { value: "30%",     label: "de la circulation urbaine", sub: "générée par la recherche de parking" },
  { value: "20 min",  label: "perdues par trajet",         sub: "à tourner en rond en moyenne" },
  { value: "1M t",    label: "de CO₂ inutiles / an",      sub: "rien qu'en France (source ADEME)" },
];

export default function OnboardingPage() {
  const router = useRouter();

  function handleStart() {
    localStorage.setItem("onboarding_done", "1");
    router.push("/auth/register");
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0a0a", fontFamily: DM }}
    >
      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center px-6 pt-16 pb-6">

        {/* Tag */}
        <div className="inline-flex items-center gap-2 self-start bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#22956b] animate-pulse" />
          <span className="text-white/70 text-xs font-semibold tracking-wide uppercase">La mission SwiftPark</span>
        </div>

        {/* Headline choc */}
        <h1
          className="text-white leading-tight mb-4"
          style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}
        >
          À Paris, 1 voiture sur 3 en circulation{" "}
          <span style={{ color: "#22956b" }}>cherche juste à se garer.</span>
        </h1>

        <p className="text-white/50 text-sm leading-relaxed mb-10" style={{ fontWeight: 300 }}>
          Du CO₂ inutile. Des bouchons évitables. Du stress quotidien. Et du temps perdu — chaque jour, par millions de conducteurs.
        </p>

        {/* Stats */}
        <div className="space-y-3 mb-10">
          {STATS.map(({ value, label, sub }) => (
            <div
              key={value}
              className="flex items-center gap-4 rounded-2xl px-4 py-3.5"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span
                className="shrink-0 font-black"
                style={{ fontSize: 26, color: "#22956b", letterSpacing: "-0.04em", minWidth: 72 }}
              >
                {value}
              </span>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">{label}</p>
                <p className="text-white/40 text-xs mt-0.5" style={{ fontWeight: 300 }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Solution */}
        <div
          className="rounded-2xl px-4 py-4 mb-8"
          style={{ background: "linear-gradient(135deg, rgba(34,149,107,0.15) 0%, rgba(8,80,65,0.15) 100%)", border: "1px solid rgba(34,149,107,0.3)" }}
        >
          <p className="text-[#22956b] text-xs font-black uppercase tracking-widest mb-2">Notre réponse</p>
          <p className="text-white text-sm leading-relaxed" style={{ fontWeight: 300 }}>
            SwiftPark connecte les conducteurs qui{" "}
            <span className="text-white font-semibold">signalent leur départ</span>{" "}
            avec ceux qui{" "}
            <span className="text-white font-semibold">cherchent une place</span>.
            Moins de tours inutiles. Moins de CO₂. Une information récompensée.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-14">
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-base active:scale-95 transition"
          style={{
            background: "linear-gradient(135deg, #22956b 0%, #085041 100%)",
            color: "#fff",
            fontSize: 16,
            boxShadow: "0 8px 32px rgba(34,149,107,0.4)",
          }}
        >
          Rejoindre le mouvement
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-center text-white/30 text-xs mt-3" style={{ fontWeight: 300 }}>
          Gratuit · Aucun abonnement
        </p>
      </div>
    </div>
  );
}
