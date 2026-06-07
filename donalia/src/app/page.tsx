import Link from "next/link";
import { ScrollText, PackageCheck, ReceiptText, ArrowRight, ShieldCheck, HandHeart } from "lucide-react";
import { SiteHeader } from "@/components/donalia/SiteHeader";
import { SiteFooter } from "@/components/donalia/SiteFooter";
import { NeedCard } from "@/components/donalia/NeedCard";
import { ReceiptBanner } from "@/components/donalia/signature";
import { getFeaturedNeeds, getPublicPrograms } from "@/lib/donalia/data";
import { CATEGORY_LABEL } from "@/lib/donalia/constants";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "1", cls: "", t: "On active les droits", d: "Avant tout, l'association fait le bilan des aides existantes (CAF, CPAM, chèque énergie…). On n'ouvre jamais un don pour ce qu'un droit couvre déjà." },
  { n: "2", cls: "is-green", t: "Le don finance le reste", d: "Votre don soutient un programme et ne couvre que le résiduel : l'objet concret qui débloque la situation." },
  { n: "3", cls: "is-accent", t: "La preuve est publiée", d: "L'asso achète, remet l'objet en main propre, puis publie la preuve d'impact. Reçu fiscal à la clé." },
];

export default async function HomePage() {
  const [{ needs, programs }, allPrograms] = await Promise.all([
    getFeaturedNeeds(3),
    getPublicPrograms(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="hero">
          <div className="mx-auto max-w-content px-4 py-16 sm:px-6 sm:py-24">
            <p className="t-eyebrow mb-4">Droits d'abord, don pour le reste</p>
            <h1 className="t-display max-w-3xl text-[34px] sm:text-[56px]">
              Le don qui va droit au besoin —{" "}
              <span style={{ color: "var(--green-deep)" }}>concret, vérifié, prouvé.</span>
            </h1>
            <p className="t-body mt-5 max-w-xl text-lg" style={{ color: "var(--ink)" }}>
              On aide d'abord chacun à obtenir les aides auxquelles il a droit. La
              solidarité ne finance que le <strong>trou résiduel</strong> : un objet utile,
              acheté et remis par l'association.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/besoins" className="btn btn--primary btn--lg">
                Voir les besoins <ArrowRight size={18} />
              </Link>
              <Link href="/don" className="btn btn--ghost btn--lg">
                Faire un don
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-2.5">
              <span className="pill"><ShieldCheck /> 100 % au besoin</span>
              <span className="pill pill--accent"><ReceiptText /> Reçu fiscal −66 %</span>
              <span className="pill"><HandHeart /> Remise en main propre</span>
            </div>
          </div>
        </section>

        {/* FUNNEL — comment ça marche */}
        <section id="comment" className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <div className="sec-head">
            <div>
              <h2 className="t-h2 text-2xl">Comment ça marche</h2>
              <p>Le funnel, c'est l'identité : les droits d'abord, le don pour le reste.</p>
            </div>
          </div>
          <div className="funnel sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="fstep">
                <div className={`fstep__n ${s.cls}`}>{s.n}</div>
                <h4>{s.t}</h4>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-7">
            <div className="reassure">
              <div className="reassure__item"><span className="reassure__ic"><ScrollText size={20} /></span> Bilan des droits systématique</div>
              <div className="reassure__item"><span className="reassure__ic"><PackageCheck size={20} /></span> Achat-en-nature par l'asso</div>
              <div className="reassure__item"><span className="reassure__ic"><ReceiptText size={20} /></span> Reçu fiscal automatique</div>
            </div>
          </div>
        </section>

        {/* BESOINS EN AVANT */}
        <section className="mx-auto max-w-content px-4 pb-8 sm:px-6">
          <div className="sec-head">
            <div>
              <h2 className="t-h2 text-2xl">Besoins en avant</h2>
              <p>Des objets concrets, après activation des droits.</p>
            </div>
            <Link href="/besoins" className="link-arrow">Tout voir <ArrowRight size={17} /></Link>
          </div>
          {needs.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-line bg-card/60 p-12 text-center text-[color:var(--muted)]">
              Les premiers besoins arrivent très bientôt.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {needs.map((need) => (
                <NeedCard key={need.id} need={need} categoryKey={programs.get(need.program_id)?.category} />
              ))}
            </div>
          )}
        </section>

        {/* PROGRAMMES + REÇU */}
        <section className="mx-auto max-w-content px-4 py-10 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              <h2 className="t-h2 mb-4 text-xl">Nos programmes</h2>
              <div className="chips">
                {allPrograms.length === 0 ? (
                  <span className="text-sm text-[color:var(--muted)]">Bientôt.</span>
                ) : (
                  allPrograms.map((p) => (
                    <Link key={p.id} href={`/programme/${p.slug}`} className="chip">
                      {p.title} · {CATEGORY_LABEL[p.category] ?? p.category}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <ReceiptBanner />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
