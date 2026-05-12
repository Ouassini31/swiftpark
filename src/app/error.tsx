"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SwiftPark error]", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(160deg,#e8f5ef 0%,#f5f5f2 60%)" }}
    >
      <div className="w-24 h-24 bg-[#22956b] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#22956b]/40">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      <p className="text-[#22956b] font-black text-lg mb-2">Oups</p>
      <h1 className="text-3xl font-black text-gray-900 mb-3">Une erreur est survenue</h1>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
        Quelque chose s'est mal passé. Essaie de recharger, ou retourne sur la carte.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={reset}
          className="w-full py-3.5 bg-[#22956b] text-white font-black rounded-2xl text-sm shadow-lg shadow-[#22956b]/30 active:scale-95 transition"
        >
          Réessayer
        </button>
        <Link
          href="/map"
          className="w-full py-3.5 bg-white text-gray-700 font-bold rounded-2xl text-sm border border-gray-200 active:scale-95 transition"
        >
          Retour à la carte
        </Link>
      </div>
    </div>
  );
}
