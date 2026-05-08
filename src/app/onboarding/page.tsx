"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Navigation, Zap } from "lucide-react";

const SLIDES = [
  {
    icon: (
      <div className="w-24 h-24 bg-gradient-to-br from-[#22956b] to-[#085041] rounded-[28px] flex items-center justify-center shadow-2xl shadow-[#22956b]/40 mx-auto">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    ),
    tag: "Bienvenue 👋",
    title: "Fini de tourner\nen rond",
    sub: "SwiftPark connecte les conducteurs qui partent avec ceux qui cherchent une place — en temps réel.",
    bg: "from-[#e8f5ef] to-[#f5f5f2]",
  },
  {
    icon: (
      <div className="w-24 h-24 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-[28px] flex items-center justify-center shadow-2xl shadow-amber-500/40 mx-auto">
        <MapPin className="w-11 h-11 text-white" strokeWidth={2.2} />
      </div>
    ),
    tag: "Tu pars 🚗",
    title: "Partage ta place,\ngagne des coins",
    sub: "Tu quittes ta place de parking ? Partage l'info en 1 tap et reçois des SwiftCoins dès qu'un conducteur l'achète.",
    bg: "from-amber-50 to-[#f5f5f2]",
  },
  {
    icon: (
      <div className="w-24 h-24 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-[28px] flex items-center justify-center shadow-2xl shadow-blue-500/40 mx-auto">
        <Navigation className="w-11 h-11 text-white" strokeWidth={2.2} />
      </div>
    ),
    tag: "Tu cherches 🔍",
    title: "Achète l'info,\nnavigue direct",
    sub: "Vois les places disponibles autour de toi. Achète l'info et l'app te guide automatiquement vers la place.",
    bg: "from-blue-50 to-[#f5f5f2]",
  },
  {
    icon: (
      <div className="w-24 h-24 bg-gradient-to-br from-[#f5a623] to-[#e08e00] rounded-[28px] flex items-center justify-center shadow-2xl shadow-yellow-500/40 mx-auto">
        <Zap className="w-11 h-11 text-white fill-white" strokeWidth={2.2} />
      </div>
    ),
    tag: "SwiftCoins ⚡",
    title: "5 coins offerts\npour démarrer",
    sub: "Les SwiftCoins sont la monnaie de l'app. Gagne-en en partageant, dépense-les pour trouver une place.",
    bg: "from-yellow-50 to-[#f5f5f2]",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  function next() {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1);
    } else {
      localStorage.setItem("onboarding_done", "1");
      router.push("/auth/login");
    }
  }

  function skip() {
    localStorage.setItem("onboarding_done", "1");
    router.push("/auth/login");
  }

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${slide.bg} flex flex-col transition-all duration-500`}>

      {/* Skip */}
      <div className="flex justify-end px-6 pt-14">
        {!isLast && (
          <button onClick={skip} className="text-sm font-semibold text-gray-400">
            Passer
          </button>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500" key={current}>
          {slide.icon}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" key={`text-${current}`}>
          <span className="inline-block bg-white/80 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-gray-100">
            {slide.tag}
          </span>

          <h1 className="text-[32px] font-black text-gray-900 leading-tight mb-4 whitespace-pre-line">
            {slide.title}
          </h1>

          <p className="text-[15px] text-gray-500 leading-relaxed max-w-xs mx-auto">
            {slide.sub}
          </p>
        </div>
      </div>

      {/* Bas */}
      <div className="px-6 pb-14 space-y-5">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2 bg-[#22956b]"
                  : "w-2 h-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Bouton */}
        <button
          onClick={next}
          className="w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black text-base rounded-2xl shadow-xl shadow-[#22956b]/30 flex items-center justify-center gap-2 active:scale-95 transition"
        >
          {isLast ? "C'est parti ! 🚀" : "Suivant"}
          {!isLast && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
