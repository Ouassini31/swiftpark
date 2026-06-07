import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Building2 } from "lucide-react";
import { SiteHeader } from "@/components/donalia/SiteHeader";
import { SiteFooter } from "@/components/donalia/SiteFooter";
import { NeedCard } from "@/components/donalia/NeedCard";
import { getProgramBySlug } from "@/lib/donalia/data";
import { euroCents } from "@/lib/donalia/format";
import { PUBLIC_STATUSES, CATEGORY_LABEL } from "@/lib/donalia/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { program } = await getProgramBySlug(params.slug);
  if (!program) return { title: "Programme introuvable — Donalia" };
  return {
    title: `${program.title} — Donalia`,
    description: program.description?.slice(0, 160) ?? undefined,
    openGraph: { title: program.title, description: program.description?.slice(0, 160) ?? undefined },
  };
}

export default async function ProgramPage({ params }: { params: { slug: string } }) {
  const { program, org, needs } = await getProgramBySlug(params.slug);
  if (!program) notFound();

  const publicNeeds = needs.filter((n) => PUBLIC_STATUSES.includes(n.status));
  const closed = publicNeeds.filter((n) => n.status === "cloture").length;
  const collected = publicNeeds.reduce((s, n) => s + Number(n.collected_cents), 0);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-10 sm:px-6">
        <Link href="/besoins" className="text-sm text-muted hover:text-ink">
          ← Les besoins
        </Link>

        <header className="mt-4 rounded-xl2 border border-line bg-card p-7 shadow-soft">
          <span className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink/70">
            {CATEGORY_LABEL[program.category] ?? program.category}
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
            {program.title}
          </h1>
          {org ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
              <Building2 className="h-4 w-4" /> Porté par {org.name}
            </p>
          ) : null}
          {program.description ? (
            <p className="mt-4 max-w-2xl leading-relaxed text-ink/80">{program.description}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-6">
            <Stat value={String(publicNeeds.length)} label="besoins" />
            <Stat value={String(closed)} label="clôturés avec preuve" />
            <Stat value={euroCents(collected)} label="réunis" />
          </div>

          <Link
            href={`/don?program=${program.id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl2 bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-ink-2"
          >
            Donner à ce programme <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="mt-10">
          <h2 className="mb-5 font-display text-2xl font-semibold text-ink">Besoins du programme</h2>
          {publicNeeds.length === 0 ? (
            <div className="rounded-xl2 border border-dashed border-line bg-card/60 p-10 text-center text-muted">
              Aucun besoin publié pour ce programme pour l'instant.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publicNeeds.map((need) => (
                <NeedCard key={need.id} need={need} categoryKey={program.category} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
