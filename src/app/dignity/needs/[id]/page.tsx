import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, CalendarCheck, ShieldCheck } from "lucide-react";
import { DignityHeader, DignityFooter } from "@/components/dignity/DignityHeader";
import { StatusBadge } from "@/components/dignity/StatusBadge";
import { ProgressBar } from "@/components/dignity/ProgressBar";
import { ContributionForm } from "@/components/dignity/ContributionForm";
import { createDignityPublicClient } from "@/lib/dignity/supabase";
import { formatDate, publicDisplayName } from "@/lib/dignity/format";
import type { DignityNeed, DignityImpactUpdate } from "@/lib/dignity/types";

export const dynamic = "force-dynamic";

export default async function NeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createDignityPublicClient();

  const { data: needData } = await supabase
    .from("dignity_needs")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();

  const need = needData as DignityNeed | null;
  if (!need) notFound();

  const { data: impactData } = await supabase
    .from("dignity_impact_updates")
    .select("*")
    .eq("need_id", id)
    .order("created_at", { ascending: false });

  const impactUpdates = (impactData ?? []) as DignityImpactUpdate[];
  const canContribute = need.status === "funding" || need.status === "verified";

  return (
    <>
      <DignityHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link
          href="/dignity/needs"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition hover:text-blue-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux besoins
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Colonne principale */}
          <article className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="relative h-56 w-full bg-gradient-to-br from-blue-50 to-emerald-50 sm:h-72">
                {need.main_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={need.main_image_url}
                    alt={need.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-blue-900/20">
                    D
                  </div>
                )}
              </div>

              <div className="space-y-4 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-blue-950">
                    {need.category}
                  </span>
                  <StatusBadge status={need.status} />
                </div>

                <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">
                  {need.title}
                </h1>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {need.city}, {need.country}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarCheck className="h-4 w-4" />
                    Déposé le {formatDate(need.created_at)}
                  </span>
                  <span>Bénéficiaire : {publicDisplayName(need)}</span>
                </div>

                <div className="prose prose-stone max-w-none whitespace-pre-line text-stone-700">
                  {need.description}
                </div>
              </div>
            </div>

            {/* Vérification */}
            {need.verified_at && (
              <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                <div>
                  <p className="font-semibold text-blue-900">Besoin vérifié</p>
                  <p className="text-sm text-blue-800/80">
                    Contrôlé et validé par notre équipe le{" "}
                    {formatDate(need.verified_at)}.
                  </p>
                </div>
              </div>
            )}

            {/* Preuves d'impact */}
            {impactUpdates.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-blue-950">
                  Preuves d&apos;impact
                </h2>
                {impactUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm"
                  >
                    {update.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={update.image_url}
                        alt={update.title}
                        className="h-48 w-full object-cover"
                      />
                    )}
                    <div className="space-y-2 p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-emerald-800">
                          {update.title}
                        </h3>
                        <span className="text-xs text-stone-400">
                          {formatDate(update.created_at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-sm text-stone-700">
                        {update.description}
                      </p>
                      {update.proof_file_url && (
                        <a
                          href={update.proof_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-sm font-medium text-emerald-600 underline"
                        >
                          Voir le justificatif
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </article>

          {/* Colonne latérale : financement + contribution */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <ProgressBar
                collected={need.amount_collected}
                requested={need.amount_requested}
              />
              <div className="mt-6">
                {canContribute ? (
                  <ContributionForm needId={need.id} />
                ) : (
                  <p className="rounded-xl bg-stone-100 px-4 py-3 text-center text-sm text-stone-600">
                    Ce besoin n&apos;accepte pas de contribution pour le moment.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <DignityFooter />
    </>
  );
}
