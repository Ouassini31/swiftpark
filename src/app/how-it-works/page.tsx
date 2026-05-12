import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Comment ça marche – SwiftPark",
};

const STEPS_SHARER = [
  {
    num: "1",
    title: "Tu quittes ta place",
    desc: "Tu es garé et tu t'apprêtes à partir ? Appuie sur \"Je me gare\" sur la carte.",
    icon: "🚗",
  },
  {
    num: "2",
    title: "Tu partages l'info",
    desc: "Indique dans combien de temps tu pars. Ta place apparaît sur la carte pour les conducteurs autour de toi.",
    icon: "📍",
  },
  {
    num: "3",
    title: "Tu es récompensé",
    desc: "Dès qu'un conducteur accède à ton info, tu reçois des SwiftCoins directement sur ton compte.",
    icon: "⚡",
  },
];

const STEPS_FINDER = [
  {
    num: "1",
    title: "Tu cherches une place",
    desc: "Ouvre SwiftPark, la carte affiche en temps réel les infos de départ signalées autour de toi.",
    icon: "🗺️",
  },
  {
    num: "2",
    title: "Tu accèdes à l'info",
    desc: "Tu vois une place qui t'intéresse ? Appuie sur \"Obtenir l'info\" et la navigation démarre automatiquement.",
    icon: "🧭",
  },
  {
    num: "3",
    title: "Tu te gares",
    desc: "L'app te guide directement vers la place. Plus besoin de tourner en rond !",
    icon: "✅",
  },
];

const FAQS = [
  {
    q: "C'est quoi les SwiftCoins ?",
    a: "Les SwiftCoins sont la monnaie de SwiftPark. 1 SwiftCoin = 1€. Tu en gagnes en signalant tes départs et tu les utilises pour accéder aux infos des autres conducteurs.",
  },
  {
    q: "Est-ce que je garantis une place ?",
    a: "Non. SwiftPark vend une information partagée par un conducteur, pas une place garantie. La place peut être prise entre le moment où l'info est partagée et ton arrivée.",
  },
  {
    q: "Que se passe-t-il si la place est déjà prise ?",
    a: "Si tu valides ta position GPS et que la place n'est plus disponible, tu peux signaler le problème depuis tes échanges. Notre équipe examine chaque cas.",
  },
  {
    q: "Comment retirer mes SwiftCoins ?",
    a: "Dès que ton solde atteint 20 SC (20€), tu peux demander un virement depuis ton Wallet. Le virement est traité sous 3-5 jours ouvrés.",
  },
  {
    q: "Est-ce légal ?",
    a: "Oui. SwiftPark est un service d'échange d'informations entre conducteurs, similaire à un réseau social de partage. Nous ne vendons pas de places de parking.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f2] pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#22956b] to-[#1a7a58] pt-12 pb-8 px-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/profile" className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-white text-xl">Comment ça marche</h1>
        </div>
        <p className="text-white/70 text-sm">SwiftPark connecte les conducteurs qui partent avec ceux qui cherchent.</p>
      </div>

      <div className="px-4 mt-6 space-y-8">

        {/* Sharer */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#22956b] rounded-xl flex items-center justify-center text-white text-sm font-black">S</div>
            <h2 className="font-black text-gray-900">Tu pars — Sois récompensé</h2>
          </div>
          <div className="space-y-3">
            {STEPS_SHARER.map((s) => (
              <div key={s.num} className="bg-white rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                <div className="text-2xl shrink-0">{s.icon}</div>
                <div>
                  <p className="font-black text-gray-900 text-sm">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Finder */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center text-white text-sm font-black">F</div>
            <h2 className="font-black text-gray-900">Tu cherches — Trouve en 1 clic</h2>
          </div>
          <div className="space-y-3">
            {STEPS_FINDER.map((s) => (
              <div key={s.num} className="bg-white rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                <div className="text-2xl shrink-0">{s.icon}</div>
                <div>
                  <p className="font-black text-gray-900 text-sm">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SwiftCoins */}
        <section className="bg-gradient-to-br from-[#22956b] to-[#085041] rounded-2xl p-5 text-white">
          <div className="text-3xl mb-2">⚡</div>
          <h2 className="font-black text-lg mb-1">Les SwiftCoins</h2>
          <p className="text-white/80 text-sm leading-relaxed">
            1 SwiftCoin = 1€. Gagne des coins en partageant, utilise-les pour accéder aux infos. 
            Dès 20 SC tu peux les retirer sur ton compte bancaire.
          </p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[["5 SC", "offerts à l'inscription"], ["5 SC", "par parrainage"], ["20 SC", "pour retirer"]].map(([val, label]) => (
              <div key={val} className="bg-white/15 rounded-xl p-2.5 text-center">
                <p className="font-black text-base">{val}</p>
                <p className="text-[10px] text-white/70 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="font-black text-gray-900 mb-4">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="font-bold text-gray-900 text-sm">{faq.q}</p>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <Link
          href="/map"
          className="block w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black text-center rounded-2xl shadow-lg shadow-[#22956b]/30"
        >
          C'est parti ! 🚀
        </Link>
      </div>
    </div>
  );
}
