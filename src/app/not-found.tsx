import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "linear-gradient(160deg,#e8f5ef 0%,#f5f5f2 60%)" }}
    >
      {/* Icône */}
      <div className="w-24 h-24 bg-[#22956b] rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#22956b]/40">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>

      <p className="text-[#22956b] font-black text-lg mb-2">404</p>
      <h1 className="text-3xl font-black text-gray-900 mb-3">Page introuvable</h1>
      <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
        Cette page n'existe pas ou a été déplacée. Retourne sur la carte pour trouver une place !
      </p>

      <Link
        href="/map"
        className="px-8 py-3.5 bg-[#22956b] text-white font-black rounded-2xl text-sm shadow-lg shadow-[#22956b]/30 active:scale-95 transition"
      >
        Retour à la carte
      </Link>
    </div>
  );
}
