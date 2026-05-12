import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Zap, ArrowRight, Star, Shield, Clock } from "lucide-react";

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

const STATS = [
  { value: "30%", label: "du trafic urbain", sub: "causé par la recherche de parking" },
  { value: "20 min", label: "perdues par trajet", sub: "à tourner en rond en moyenne" },
  { value: "1M t", label: "de CO₂ évitables", sub: "par an en France (ADEME)" },
];

const HOW_FINDER = [
  { icon: "🗺️", title: "Ouvre la carte", desc: "Vois en temps réel les conducteurs qui signalent leur départ près de toi." },
  { icon: "🧭", title: "Accède à l'info", desc: "Un conducteur part bientôt ? Accède à l'information et suis la navigation." },
  { icon: "✅", title: "Gare-toi", desc: "Plus besoin de tourner en rond. Tu arrives directement à l'emplacement." },
];

const HOW_SHARER = [
  { icon: "📍", title: "Tu pars bientôt", desc: "Appuie sur Signaler mon départ depuis la carte." },
  { icon: "⚡", title: "Ta place est visible", desc: "L'info apparaît sur la carte pour les conducteurs autour de toi." },
  { icon: "💰", title: "Tu es récompensé", desc: "Reçois des SwiftCoins crédités automatiquement à ton départ." },
];

const FAQS = [
  {
    q: "C'est gratuit ?",
    a: "L'inscription est gratuite. Tu reçois 5 SwiftCoins à l'inscription. Tu en gagnes à chaque signalement et les utilises pour accéder aux infos des autres.",
  },
  {
    q: "Est-ce qu'on garantit une place ?",
    a: "Non. SwiftPark est un service d'échange d'informations entre conducteurs, pas une réservation garantie. La place peut être prise entre le signalement et ton arrivée.",
  },
  {
    q: "C'est légal ?",
    a: "Oui. SwiftPark est un service d'échange d'informations, similaire à un réseau social de conducteurs. Nous ne vendons pas de places de parking.",
  },
  {
    q: "Puis-je retirer mes SwiftCoins ?",
    a: "Oui. Les SwiftCoins gagnés en signalant sont retirables dès 20 SC (= 20€) par virement SEPA.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f2] font-sans">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#22956b] rounded-lg flex items-center justify-center text-white text-xs font-black">🅿</div>
            <span className="font-black text-gray-900">Swift<span className="text-[#22956b]">Park</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-gray-600 font-medium px-3 py-1.5 rounded-xl hover:bg-gray-100 transition">
              Connexion
            </Link>
            <Link href="/auth/register" className="text-sm font-black text-white bg-[#22956b] px-4 py-2 rounded-xl shadow-sm shadow-[#22956b]/30 transition active:scale-95">
              Commencer →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#085041] via-[#0d6b4f] to-[#22956b] pt-20 pb-16 px-5 text-white text-center">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1.5 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            Disponible maintenant · Paris & Île-de-France
          </div>

          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4 tracking-tight">
            Trouvez une place.<br />
            <span className="text-[#a3e6c8]">Sans tourner en rond.</span>
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-8 max-w-sm mx-auto">
            SwiftPark connecte les conducteurs qui signalent leur départ avec ceux qui cherchent une place — en temps réel.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-[#22956b] font-black rounded-2xl text-sm shadow-2xl shadow-black/20 transition active:scale-95"
            >
              <Zap className="w-4 h-4 fill-[#22956b]" />
              Commencer gratuitement
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/15 text-white font-bold rounded-2xl text-sm border border-white/20 transition active:scale-95"
            >
              Comment ça marche
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="mt-5 text-white/40 text-xs">5 SwiftCoins offerts à l'inscription · Sans carte bancaire</p>
        </div>
      </section>

      {/* ── Stats CO2 ─────────────────────────────────────────── */}
      <section className="py-12 px-5 bg-[#0a0a0a]">
        <div className="max-w-xl mx-auto text-center mb-8">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Le problème que l'on résout</p>
          <h2 className="text-2xl font-black text-white">La recherche de parking,<br />un fléau silencieux</h2>
        </div>
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-3">
          {STATS.map((s) => (
            <div key={s.value} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-[#22956b]">{s.value}</p>
              <p className="text-white text-xs font-bold mt-1">{s.label}</p>
              <p className="text-gray-500 text-[10px] mt-0.5 leading-tight">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comment ça marche ─────────────────────────────────── */}
      <section className="py-14 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs text-gray-400 uppercase tracking-widest text-center mb-2">Comment ça marche</p>
          <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Deux rôles, un écosystème</h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Finder */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-sm font-black">F</div>
                <h3 className="font-black text-gray-900">Tu cherches une place</h3>
              </div>
              <div className="space-y-3">
                {HOW_FINDER.map((s) => (
                  <div key={s.title} className="bg-white rounded-2xl p-4 flex gap-3 shadow-sm">
                    <span className="text-xl shrink-0">{s.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sharer */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#22956b] rounded-xl flex items-center justify-center text-white text-sm font-black">S</div>
                <h3 className="font-black text-gray-900">Tu pars — Sois récompensé</h3>
              </div>
              <div className="space-y-3">
                {HOW_SHARER.map((s) => (
                  <div key={s.title} className="bg-white rounded-2xl p-4 flex gap-3 shadow-sm">
                    <span className="text-xl shrink-0">{s.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SwiftCoins ────────────────────────────────────────── */}
      <section className="px-5 pb-14">
        <div className="max-w-xl mx-auto bg-gradient-to-br from-[#22956b] to-[#085041] rounded-3xl p-7 text-white">
          <div className="text-3xl mb-3">⚡</div>
          <h2 className="font-black text-xl mb-2">Les SwiftCoins</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            1 SwiftCoin = 1€. Gagne des coins en signalant ton départ, utilise-les pour accéder aux infos des autres conducteurs. Retirables dès 20 SC.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[["5 SC", "à l'inscription"], ["5 SC", "par parrainage"], ["20 SC", "pour retirer"]].map(([v, l]) => (
              <div key={v} className="bg-white/15 rounded-2xl p-3 text-center">
                <p className="font-black text-base">{v}</p>
                <p className="text-[10px] text-white/60 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Confiance ─────────────────────────────────────────── */}
      <section className="px-5 pb-14">
        <div className="max-w-xl mx-auto">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Shield className="w-5 h-5 text-[#22956b]" />, title: "100% légal", desc: "Échange d'informations entre conducteurs" },
              { icon: <Star className="w-5 h-5 text-amber-500" />,   title: "Noté ★ 4.8", desc: "Par nos premiers utilisateurs" },
              { icon: <Clock className="w-5 h-5 text-blue-500" />,   title: "Temps réel", desc: "Infos actualisées à la seconde" },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <div className="flex justify-center mb-2">{item.icon}</div>
                <p className="font-black text-gray-900 text-xs">{item.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="px-5 pb-14">
        <div className="max-w-xl mx-auto">
          <h2 className="font-black text-gray-900 text-xl mb-5 text-center">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="font-bold text-gray-900 text-sm">{faq.q}</p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────── */}
      <section className="px-5 pb-16">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">Prêt à arrêter de tourner en rond ?</h2>
          <p className="text-gray-500 text-sm mb-6">Rejoins la communauté SwiftPark — gratuit, sans engagement.</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#22956b] text-white font-black rounded-2xl text-sm shadow-lg shadow-[#22956b]/30 transition active:scale-95"
          >
            <Zap className="w-4 h-4 fill-white" />
            Créer mon compte gratuitement
          </Link>
          <p className="mt-3 text-xs text-gray-400">5 SwiftCoins offerts · Aucune carte bancaire requise</p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-8 px-5">
        <div className="max-w-xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#22956b] rounded-lg flex items-center justify-center text-white text-[10px] font-black">🅿</div>
            <span className="font-black text-gray-900 text-sm">SwiftPark</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <Link href="/legal" className="hover:text-gray-600 transition">Mentions légales</Link>
            <Link href="/how-it-works" className="hover:text-gray-600 transition">Comment ça marche</Link>
            <Link href="/auth/register" className="hover:text-gray-600 transition">S'inscrire</Link>
          </div>
          <p className="text-[11px] text-gray-400 w-full sm:w-auto">© {new Date().getFullYear()} SwiftPark · swiftpark.fr</p>
        </div>
      </footer>

    </div>
  );
}
