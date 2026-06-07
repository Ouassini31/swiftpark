import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Check, ArrowRight, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/donalia/SiteHeader";
import { SiteFooter } from "@/components/donalia/SiteFooter";
import { ProgressBar } from "@/components/donalia/ProgressBar";
import { GapBadge, EstimationBanner, ReceiptBanner, ObjectIcon, gapHelp } from "@/components/donalia/signature";
import { getNeed, getPublishedProof } from "@/lib/donalia/data";
import { programRightsCoverage } from "@/lib/donalia/aggregates";
import { PUBLIC_STATUSES, CATEGORY_LABEL } from "@/lib/donalia/constants";
import { euroCents } from "@/lib/donalia/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { need } = await getNeed(params.id);
  if (!need) return { title: "Besoin introuvable — Donalia" };
  return {
    title: `${need.title} — Donalia`,
    description: need.gap_explainer ?? undefined,
    openGraph: { title: need.title, description: need.gap_explainer ?? undefined, type: "article" },
  };
}

export default async function NeedDetailPage({ params }: { params: { id: string } }) {
  const { need, program, org } = await getNeed(params.id);
  if (!need || !PUBLIC_STATUSES.includes(need.status)) notFound();

  const proof = need.status === "cloture" ? await getPublishedProof(need.id) : null;
  const coverage = program ? await programRightsCoverage(program.id) : null;
  const stillOpen = need.status === "publie" || need.status === "finance";
  const catKey = program?.category;
  const donHref = `/don?program=${need.program_id}&need=${need.id}`;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-6">
        <nav className="crumb mb-5">
          <Link href="/besoins">Les besoins</Link>
          <ChevronRight size={15} />
          {program ? (
            <Link href={`/programme/${program.slug}`}>{CATEGORY_LABEL[program.category] ?? program.category}</Link>
          ) : null}
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Colonne récit */}
          <article>
            <div className="detail-media">
              <ObjectIcon category={catKey} />
              {catKey ? (
                <span className="need__cat">
                  <ObjectIcon category={catKey} /> {CATEGORY_LABEL[catKey] ?? catKey}
                </span>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <GapBadge reason={need.gap_reason} />
              {need.region ? (
                <span className="flex items-center gap-1.5 text-sm text-[color:var(--muted)]">
                  <MapPin size={16} /> {need.region}
                </span>
              ) : null}
            </div>

            <h1 className="t-display mt-3 text-[28px] sm:text-[36px]">{need.title}</h1>
            <p className="trou-line max-w-2xl text-[13.5px]">
              {need.gap_explainer || gapHelp(need.gap_reason)}
            </p>

            {/* Frise transparence — droits d'abord */}
            <div className="mt-8">
              <p className="t-eyebrow mb-3">Pourquoi ce besoin ?</p>
              <div className="frise">
                <div className="frise__step is-on">
                  <div className="frise__top">
                    <span className="frise__chk"><Check size={11} /></span> Droits activés en amont
                  </div>
                  <span className="frise__amt">aides mobilisées</span>
                </div>
                <div className="frise__step">
                  <div className="frise__top">Bilan des droits réalisé</div>
                  <span className="text-[12.5px] text-[color:var(--muted)]">par l'association</span>
                </div>
                <div className="frise__step is-res">
                  <div className="frise__top">Reste à financer</div>
                  <span className="frise__amt">{euroCents(need.amount_cents)}</span>
                </div>
              </div>
              {coverage ? (
                <p className="trou-line mt-3 text-[13px]">
                  Sur ce programme, les droits couvrent en moyenne{" "}
                  <b style={{ color: "var(--green-deep)" }}>{coverage.pct} %</b> du besoin
                  avant qu'on sollicite les donateurs.{" "}
                  <span className="text-[color:var(--muted)]">(moyenne sur {coverage.n} besoins, sans donnée individuelle)</span>
                </p>
              ) : null}
              <div className="mt-3">
                <EstimationBanner />
              </div>
            </div>

            {proof ? (
              <div className="mt-8 rounded-[16px] border border-line bg-[color:var(--green-soft)] p-5">
                <p className="t-h2 text-lg">✅ Impact réalisé</p>
                {proof.caption ? <p className="mt-1 text-sm text-[color:var(--ink)]">{proof.caption}</p> : null}
                <Link href={`/preuve/${need.id}`} className="link-arrow mt-3">
                  Voir la preuve d'impact <ArrowRight size={16} />
                </Link>
              </div>
            ) : null}
          </article>

          {/* Encart financement */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[18px] border border-line bg-card p-6" style={{ boxShadow: "var(--shadow)" }}>
              <div className="detail-amt mb-4 flex items-baseline gap-2">
                <b>{euroCents(need.collected_cents)}</b>
                <span>réunis sur {euroCents(need.amount_cents)}</span>
              </div>
              <ProgressBar collectedCents={need.collected_cents} targetCents={need.amount_cents} />

              <div className="mt-5">
                {stillOpen ? (
                  <Link href={donHref} className="btn btn--primary btn--block btn--lg">
                    Soutenir ce programme <ArrowRight size={18} />
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-line bg-[color:var(--field)] p-3 text-center text-sm text-[color:var(--ink)]">
                      Ce besoin est {need.status === "cloture" ? "clôturé" : "couvert"}. Merci !
                    </div>
                    {program ? (
                      <Link href={`/don?program=${program.id}`} className="btn btn--ghost btn--block">
                        Soutenir le programme
                      </Link>
                    ) : null}
                  </div>
                )}
              </div>

              <p className="give-note mt-4">
                Votre don va au <b>programme « {program?.title} »</b>, jamais à une personne
                nommée. L'association alloue, achète et remet l'objet.
              </p>

              <div className="mt-5">
                <ReceiptBanner compact />
              </div>
              {org ? (
                <p className="mt-3 text-center text-[11px] text-[color:var(--muted)]">
                  Reçu émis par {org.name}.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
