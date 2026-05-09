"use client";

import { useState, useRef } from "react";

const SLIDES = [
  {
    emoji: "🅿️",
    bg: "bg-[#e8f5ef]",
    title: "Trouver une place\nen secondes",
    desc: "Vois en temps réel les conducteurs qui vont libérer une place près de ta destination.",
    pushSlide: false,
  },
  {
    emoji: "💰",
    bg: "bg-yellow-50",
    title: "Partage l'info,\nreçois une récompense",
    desc: "Tu quittes une place ? Partage l'information. Un conducteur te récompense en SwiftCoins.",
    pushSlide: false,
  },
  {
    emoji: "⚡",
    bg: "bg-purple-50",
    title: "Le cycle parfait",
    desc: "Tu trouves une place → tu la partages quand tu pars → tu reçois une récompense.",
    pushSlide: false,
  },
  {
    emoji: "🔔",
    bg: "bg-blue-50",
    title: "Sois alerté\nen temps réel",
    desc: "Active les notifications pour être prévenu immédiatement dès qu'une place est disponible près de toi.",
    pushSlide: true,
  },
];

interface OnboardingProps {
  onDone: () => void;
}

export default function Onboarding({ onDone }: OnboardingProps) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);

  function next() {
    if (current < SLIDES.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      handleDone();
    }
  }

  function handleDone() {
    if (typeof window !== "undefined") {
      localStorage.setItem("sp_ob", "1");
    }
    onDone();
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50 && current < SLIDES.length - 1) setCurrent((c) => c + 1);
    if (diff < -50 && current > 0) setCurrent((c) => c - 1);
    touchStart.current = null;
  }

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;
  const isPushSlide = slide.pushSlide;

  async function handleEnableNotifs() {
    try {
      if ("Notification" in window && "serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js").catch(() => {});
        await Notification.requestPermission();
      }
    } catch { /* silently fail */ }
    handleDone();
  }

  return (
    <div
      className="absolute inset-0 z-[950] bg-[var(--bg,#f5f5f2)] flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex h-full transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
          style={{ transform: `translateX(-${current * 100}%)`, width: `${SLIDES.length * 100}%` }}
        >
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center px-8 text-center gap-5"
              style={{ width: `${100 / SLIDES.length}%` }}
            >
              <div className={`w-24 h-24 ${s.bg} rounded-[26px] flex items-center justify-center text-[46px]`}>
                {s.emoji}
              </div>
              <h2 className="text-[24px] font-black text-[var(--t,#111)] leading-tight whitespace-pre-line">
                {s.title}
              </h2>
              <p className="text-[14px] text-[var(--t2,#555)] leading-relaxed max-w-[270px]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 py-3">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            className="h-2 rounded-full cursor-pointer transition-all duration-300"
            style={{
              width: i === current ? "22px" : "8px",
              background: i === current ? "#22956b" : "var(--b,#e8e8e2)",
            }}
          />
        ))}
      </div>

      {/* Boutons */}
      <div className="px-5 pb-8 flex gap-2.5">
        {isPushSlide ? (
          <>
            <button
              onClick={handleDone}
              className="flex-1 py-3.5 rounded-[14px] font-bold text-sm bg-[var(--s2,#f8f8f5)] text-[var(--t2,#555)] border border-[var(--b,#e8e8e2)]"
            >
              Plus tard
            </button>
            <button
              onClick={handleEnableNotifs}
              className="flex-[2] py-3.5 rounded-[14px] font-bold text-sm bg-[#22956b] text-white shadow-[0_3px_12px_rgba(34,149,107,.3)]"
            >
              Activer 🔔
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleDone}
              className="flex-1 py-3.5 rounded-[14px] font-bold text-sm bg-[var(--s2,#f8f8f5)] text-[var(--t2,#555)] border border-[var(--b,#e8e8e2)]"
            >
              Passer
            </button>
            <button
              onClick={next}
              className="flex-[2] py-3.5 rounded-[14px] font-bold text-sm bg-[#22956b] text-white shadow-[0_3px_12px_rgba(34,149,107,.3)]"
            >
              {isLast ? "C'est parti !" : "Suivant →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
