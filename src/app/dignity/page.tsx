import Link from "next/link";
import {
  ShieldCheck,
  Eye,
  HeartHandshake,
  FileSearch,
  Send,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { DignityHeader, DignityFooter } from "@/components/dignity/DignityHeader";

export default function DignityLandingPage() {
  return (
    <>
      <DignityHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-stone-50 to-emerald-50/40" />
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-600/20">
              <Sparkles className="h-4 w-4" />
              Plateforme solidaire vérifiée
            </span>

            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-blue-950 sm:text-6xl">
              Ce n&apos;est plus un don.
              <br />
              <span className="text-emerald-600">C&apos;est une action.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600">
              Connectons directement les personnes qui ont des ressources avec
              celles qui ont des besoins réels, vérifiés et traçables. Une action
              concrète, visible et vérifiée.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dignity/needs"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Voir les besoins
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dignity/submit-need"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-blue-950 ring-1 ring-stone-300 transition hover:bg-stone-100"
              >
                Déposer un besoin
              </Link>
            </div>
          </div>
        </section>

        {/* Problème / Solution */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-blue-950">Le problème</h2>
              <p className="mt-3 text-stone-600">
                Trop de dons disparaissent dans des circuits opaques. Les
                donateurs ne savent pas où va leur argent, et les personnes dans
                le besoin restent invisibles. La confiance est rompue.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-emerald-800">
                Notre solution
              </h2>
              <p className="mt-3 text-stone-700">
                Chaque besoin est déposé, contrôlé par un humain, puis publié de
                façon transparente. Le donateur voit le besoin réel, contribue,
                et reçoit une preuve d&apos;impact concrète.
              </p>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-3xl font-bold text-blue-950">
              Comment ça marche
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Send,
                  title: "1. Un besoin est déposé",
                  text: "Une personne décrit un besoin concret : santé, logement, alimentation, éducation…",
                },
                {
                  icon: FileSearch,
                  title: "2. Il est vérifié",
                  text: "Un administrateur contrôle les justificatifs et valide ou refuse le besoin.",
                },
                {
                  icon: HeartHandshake,
                  title: "3. Il est financé",
                  text: "Les donateurs contribuent, puis une preuve d'impact est publiée.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-900">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-blue-950">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-stone-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Valeurs */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Vérifié",
                text: "Chaque besoin est contrôlé par un humain avant publication.",
              },
              {
                icon: Eye,
                title: "Transparent",
                text: "Montants demandés, collectés et statut visibles en temps réel.",
              },
              {
                icon: HeartHandshake,
                title: "Traçable",
                text: "Une preuve d'impact est publiée après le financement.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <Icon className="h-8 w-8 text-emerald-600" />
                <h3 className="mt-3 font-semibold text-blue-950">{title}</h3>
                <p className="mt-1 text-sm text-stone-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-blue-950">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-3xl font-bold text-white">
              Prêt à transformer un don en action ?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-blue-200">
              Découvrez des besoins réels et vérifiés, ou déposez le vôtre en
              quelques minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dignity/needs"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-base font-semibold text-blue-950 transition hover:bg-amber-300"
              >
                Contribuer maintenant
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dignity/submit-need"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                Déposer un besoin
              </Link>
            </div>
          </div>
        </section>
      </main>

      <DignityFooter />
    </>
  );
}
