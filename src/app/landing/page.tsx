import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Star, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "SwiftPark — Trouvez une place de parking en temps réel",
  description:
    "SwiftPark connecte les conducteurs qui signalent leur départ avec ceux qui cherchent une place. Gratuit, instantané, récompensé.",
  openGraph: {
    title: "SwiftPark — Trouvez une place en temps réel",
    description: "L'info de stationnement entre conducteurs. Signalez votre départ, gagnez des SwiftCoins.",
    type: "website",
    locale: "fr_FR",
  },
};

/* ── Logo SVG cohérent avec l'app ─────────────────────────────── */
function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="#22956b"/>
      <text x="14" y="20" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="system-ui,sans-serif">P</text>
    </svg>
  );
}

const STATS = [
  { value: "30%",    label: "du trafic urbain",     sub: "causé par la recherche de parking" },
  { value: "20 min", label: "perdues par trajet",    sub: "à tourner en rond en moyenne" },
  { value: "1M t",   label: "de CO₂ évitables/an",  sub: "rien qu'en France (ADEME)" },
];

const HOW_FINDER = [
  { icon: "🗺️", title: "Ouvre la carte",   desc: "Vois en temps réel les conducteurs qui signalent leur départ près de toi." },
  { icon: "🧭", title: "Accède à l'info",  desc: "Un conducteur part bientôt ? Accède à l'information et suis la navigation." },
  { icon: "✅", title: "Gare-toi",          desc: "Plus besoin de tourner en rond. Tu arrives directement à l'emplacement." },
];

const HOW_SHARER = [
  { icon: "📍", title: "Tu pars bientôt",      desc: "Appuie sur \"Signaler mon départ\" depuis la carte." },
  { icon: "⚡", title: "Ta place est visible",  desc: "L'info apparaît instantanément sur la carte pour les conducteurs autour." },
  { icon: "💰", title: "Tu es récompensé",     desc: "Reçois des SwiftCoins crédités automatiquement à ton départ." },
];

const FAQS = [
  { q: "C'est gratuit ?",               a: "L'inscription est gratuite et tu reçois 5 SwiftCoins à l'arrivée. Tu en gagnes à chaque signalement." },
  { q: "On garantit une place ?",       a: "Non. SwiftPark vend une information, pas une réservation. La place peut être prise entre le signalement et ton arrivée." },
  { q: "C'est légal ?",                 a: "Oui. SwiftPark est un service d'échange d'informations entre conducteurs — comme un réseau social de conducteurs." },
  { q: "Puis-je retirer mes coins ?",   a: "Oui. Les SwiftCoins gagnés en signalant sont retirables dès 20 SC (= 20 €) par virement SEPA." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f2]" style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-black text-gray-900 text-[15px] tracking-tight">Swift<span className="text-[#22956b]">Park</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="text-sm text-gray-500 font-semibold px-3 py-2 rounded-xl hover:bg-gray-100 transition">
              Connexion
            </Link>
            <Link href="/auth/register" className="text-sm font-black text-white bg-[#22956b] px-4 py-2 rounded-xl shadow-sm active:scale-95 transition">
              Commencer →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#085041] via-[#0f7a5a] to-[#22956b] pt-20 pb-16 px-5 text-center text-white">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5 text-xs font-semibold mb-6 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-[#a3e6c8] animate-pulse" />
            Disponible maintenant · Paris & Île-de-France
          </div>

          <h1 className="text-[40px] sm:text-5xl font-black leading-[1.1] tracking-tight mb-5">
            Trouvez une place.<br />
            <span className="text-[#a3e6c8]">Sans tourner en rond.</span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-8 max-w-sm mx-auto">
            SwiftPark connecte les conducteurs qui signalent leur départ avec ceux qui cherchent — en temps réel.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/onboarding"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-[#22956b] font-black rounded-2xl text-sm shadow-xl active:scale-95 transition">
              <Zap className="w-4 h-4 fill-[#22956b] text-[#22956b]" />
              Commencer gratuitement
            </Link>
            <Link href="/how-it-works"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/15 text-white font-bold rounded-2xl text-sm border border-white/20 active:scale-95 transition">
              Comment ça marche <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="mt-4 text-white/40 text-xs">5 SwiftCoins offerts à l'inscription · Sans carte bancaire</p>
        </div>
      </section>

      {/* ── Impact CO₂ ──────────────────────────────────────────── */}
      <section className="px-5 py-16 bg-[#0a0a0a]">
        <div className="max-w-xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 mb-7">
            <span className="w-2 h-2 rounded-full bg-[#22956b]" />
            <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">La mission SwiftPark</span>
          </div>

          {/* Headline choc */}
          <h2 className="text-white font-black leading-tight mb-4" style={{ fontSize: "clamp(28px,5vw,40px)", letterSpacing: "-0.03em" }}>
            À Paris, 1 voiture sur 3<br />
            en circulation{" "}
            <span style={{ color: "#22956b" }}>cherche juste à se garer.</span>
          </h2>

          <p className="text-white/40 text-sm leading-relaxed mb-10" style={{ fontWeight: 300 }}>
            Du CO₂ inutile. Des bouchons évitables. Du stress quotidien.<br />Et du temps perdu — chaque jour, par millions de conducteurs.
          </p>

          {/* Stats */}
          <div className="space-y-3 mb-10">
            {[
              { value: "30%",    label: "de la circulation urbaine",  sub: "générée par la recherche de parking" },
              { value: "20 min", label: "perdues par trajet",          sub: "à tourner en rond en moyenne" },
              { value: "1M t",   label: "de CO₂ inutiles / an",       sub: "rien qu'en France — source ADEME" },
            ].map(({ value, label, sub }) => (
              <div key={value} className="flex items-center gap-5 rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="font-black shrink-0" style={{ fontSize: 28, color: "#22956b", letterSpacing: "-0.04em", minWidth: 80 }}>
                  {value}
                </span>
                <div>
                  <p className="text-white text-sm font-semibold">{label}</p>
                  <p className="text-white/40 text-xs mt-0.5" style={{ fontWeight: 300 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Notre réponse */}
          <div className="rounded-2xl px-5 py-4"
            style={{ background: "linear-gradient(135deg,rgba(34,149,107,.15),rgba(8,80,65,.15))", border: "1px solid rgba(34,149,107,.3)" }}>
            <p className="text-[#22956b] text-xs font-black uppercase tracking-widest mb-2">Notre réponse</p>
            <p className="text-white text-sm leading-relaxed" style={{ fontWeight: 300 }}>
              SwiftPark connecte les conducteurs qui{" "}
              <span className="text-white font-semibold">signalent leur départ</span>{" "}
              avec ceux qui{" "}
              <span className="text-white font-semibold">cherchent une place</span>.{" "}
              Moins de tours inutiles. Moins de CO₂. Une information récompensée.
            </p>
          </div>

        </div>
      </section>

      {/* ── Comment ça marche ───────────────────────────────────── */}
      <section className="py-14 px-5 bg-[#f5f5f2]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest text-center mb-2">Comment ça marche</p>
          <h2 className="text-2xl font-black text-gray-900 text-center mb-10">Deux rôles, un écosystème</h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Finder */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xs font-black">F</div>
                <h3 className="font-black text-gray-900">Tu cherches une place</h3>
              </div>
              <div className="space-y-2.5">
                {HOW_FINDER.map((s) => (
                  <div key={s.title} className="bg-white rounded-2xl p-4 flex gap-3 shadow-sm border border-gray-100">
                    <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sharer */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-[#22956b] rounded-xl flex items-center justify-center text-white text-xs font-black">S</div>
                <h3 className="font-black text-gray-900">Tu pars — Sois récompensé</h3>
              </div>
              <div className="space-y-2.5">
                {HOW_SHARER.map((s) => (
                  <div key={s.title} className="bg-white rounded-2xl p-4 flex gap-3 shadow-sm border border-gray-100">
                    <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SwiftCoins ──────────────────────────────────────────── */}
      <section className="px-5 pb-14 bg-[#f5f5f2]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#22956b] to-[#085041] rounded-3xl p-7 text-white">
            <div className="w-10 h-10 bg-[#f5a623] rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <h2 className="font-black text-xl mb-2">Les SwiftCoins</h2>
            <p className="text-white/70 text-sm leading-relaxed max-w-md">
              1 SwiftCoin = 1 €. Gagne des coins en signalant ton départ, utilise-les pour accéder aux infos des autres conducteurs. Retirables dès 20 SC par virement SEPA.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-6 max-w-sm">
              {[["5 SC", "à l'inscription"], ["5 SC", "par parrainage"], ["20 SC", "pour retirer"]].map(([v, l]) => (
                <div key={v} className="bg-white/15 rounded-2xl p-3 text-center">
                  <p className="font-black text-base">{v}</p>
                  <p className="text-[10px] text-white/60 mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Confiance ───────────────────────────────────────────── */}
      <section className="px-5 pb-14">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-3">
          {[
            { icon: <Shield className="w-5 h-5 text-[#22956b]" />, bg: "bg-[#22956b]/10", title: "100% légal",  desc: "Échange d'informations entre conducteurs" },
            { icon: <Star   className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50",      title: "Noté ★ 4.8", desc: "Par nos premiers utilisateurs" },
            { icon: <Clock  className="w-5 h-5 text-blue-500"  />, bg: "bg-blue-50",       title: "Temps réel", desc: "Infos actualisées à la seconde" },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>{item.icon}</div>
              <p className="font-black text-gray-900 text-xs">{item.title}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="px-5 pb-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-black text-gray-900 text-xl mb-5 text-center">Questions fréquentes</h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="font-black text-gray-900 text-sm">{faq.q}</p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────────────── */}
      <section className="px-5 pb-16">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">Prêt à arrêter de tourner en rond ?</h2>
          <p className="text-gray-500 text-sm mb-6">Rejoins la communauté SwiftPark — gratuit, sans engagement.</p>
          <Link href="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#22956b] text-white font-black rounded-2xl text-sm shadow-lg shadow-[#22956b]/30 active:scale-95 transition">
            <Zap className="w-4 h-4 fill-white" />
            Rejoindre le mouvement
          </Link>
          <p className="mt-3 text-xs text-gray-400">5 SwiftCoins offerts · Aucune carte bancaire requise</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-8 px-5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={22} />
            <span className="font-black text-gray-900 text-sm tracking-tight">Swift<span className="text-[#22956b]">Park</span></span>
          </div>
          <div className="flex gap-5 text-xs text-gray-400">
            <Link href="/legal"        className="hover:text-gray-700 transition">Mentions légales</Link>
            <Link href="/how-it-works" className="hover:text-gray-700 transition">Comment ça marche</Link>
            <Link href="/onboarding" className="hover:text-gray-700 transition">S'inscrire</Link>
          </div>
          <p className="text-[11px] text-gray-400">© {new Date().getFullYear()} SwiftPark</p>
        </div>
      </footer>

    </div>
  );
}
