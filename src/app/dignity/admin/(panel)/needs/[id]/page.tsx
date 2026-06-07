import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createDignityAdminClient } from "@/lib/dignity/supabase";
import { StatusBadge } from "@/components/dignity/StatusBadge";
import { ProgressBar } from "@/components/dignity/ProgressBar";
import { AdminNeedActions } from "@/components/dignity/AdminNeedActions";
import { AdminImpactForm } from "@/components/dignity/AdminImpactForm";
import { formatEUR, formatDate } from "@/lib/dignity/format";
import type {
  DignityNeed,
  DignityContribution,
  DignityVerificationLog,
  DignityImpactUpdate,
  DignityDocument,
} from "@/lib/dignity/types";

export const dynamic = "force-dynamic";

export default async function AdminNeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createDignityAdminClient();

  const { data: needData } = await supabase
    .from("dignity_needs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const need = needData as DignityNeed | null;
  if (!need) notFound();

  const [{ data: docs }, { data: contribs }, { data: logs }, { data: impacts }] =
    await Promise.all([
      supabase.from("dignity_documents").select("*").eq("need_id", id),
      supabase
        .from("dignity_contributions")
        .select("*")
        .eq("need_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("dignity_verification_logs")
        .select("*")
        .eq("need_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("dignity_impact_updates")
        .select("*")
        .eq("need_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const documents = (docs ?? []) as DignityDocument[];
  const contributions = (contribs ?? []) as DignityContribution[];
  const verificationLogs = (logs ?? []) as DignityVerificationLog[];
  const impactUpdates = (impacts ?? []) as DignityImpactUpdate[];

  return (
    <div className="space-y-6">
      <Link
        href="/dignity/admin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition hover:text-blue-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au tableau de bord
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Colonne gauche : infos */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-blue-950">
                {need.category}
              </span>
              <StatusBadge status={need.status} />
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium capitalize text-amber-700">
                Urgence : {need.urgency_level}
              </span>
              {need.is_public ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Public
                </span>
              ) : (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">
                  Masqué
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-blue-950">
              {need.title}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {need.city}, {need.country} · Déposé le{" "}
              {formatDate(need.created_at)}
            </p>

            <p className="mt-4 whitespace-pre-line text-stone-700">
              {need.description}
            </p>

            <div className="mt-6">
              <ProgressBar
                collected={need.amount_collected}
                requested={need.amount_requested}
              />
            </div>
          </div>

          {/* Coordonnées bénéficiaire (admin only) */}
          <Section title="Coordonnées du bénéficiaire (confidentiel)">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Prénom" value={need.first_name} />
              <Field label="Nom" value={need.last_name} />
              <Field label="Email" value={need.email} />
              <Field label="Téléphone" value={need.phone || "—"} />
              <Field
                label="Publication"
                value={
                  need.anonymized_publication ? "Anonymisée" : "Nom complet"
                }
              />
              <Field label="Vérifié le" value={formatDate(need.verified_at)} />
            </dl>
          </Section>

          {/* Documents */}
          <Section title={`Documents (${documents.length})`}>
            {documents.length === 0 ? (
              <p className="text-sm text-stone-400">Aucun document fourni.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2"
                  >
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-700 underline"
                    >
                      {doc.file_type || "Document"}
                    </a>
                    <span className="text-xs text-stone-400">
                      {doc.visibility === "public" ? "Public" : "Admin"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Contributions */}
          <Section title={`Intentions de contribution (${contributions.length})`}>
            {contributions.length === 0 ? (
              <p className="text-sm text-stone-400">
                Aucune intention pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-stone-100 text-sm">
                {contributions.map((c) => (
                  <li key={c.id} className="flex items-start justify-between py-2">
                    <div>
                      <p className="font-medium text-blue-950">{c.donor_name}</p>
                      <p className="text-xs text-stone-400">{c.donor_email}</p>
                      {c.message && (
                        <p className="mt-1 text-stone-600">“{c.message}”</p>
                      )}
                    </div>
                    <span className="font-semibold text-emerald-700">
                      {formatEUR(c.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Journal de vérification */}
          <Section title={`Journal de vérification (${verificationLogs.length})`}>
            {verificationLogs.length === 0 ? (
              <p className="text-sm text-stone-400">Aucune action enregistrée.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {verificationLogs.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-lg border border-stone-100 bg-stone-50 p-3"
                  >
                    <p className="text-xs text-stone-400">
                      {formatDate(log.created_at)} · {log.admin_label}
                    </p>
                    <p className="mt-1 text-stone-700">
                      {log.status_before} → <strong>{log.status_after}</strong>
                      {log.verification_method &&
                        ` · ${log.verification_method}`}
                    </p>
                    {log.internal_note && (
                      <p className="mt-1 text-stone-600">
                        Note interne : {log.internal_note}
                      </p>
                    )}
                    {log.public_note && (
                      <p className="mt-1 text-emerald-700">
                        Note publique : {log.public_note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Preuves d'impact existantes */}
          {impactUpdates.length > 0 && (
            <Section title={`Preuves d'impact (${impactUpdates.length})`}>
              <ul className="space-y-3 text-sm">
                {impactUpdates.map((u) => (
                  <li
                    key={u.id}
                    className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3"
                  >
                    <p className="font-semibold text-emerald-800">{u.title}</p>
                    <p className="mt-1 whitespace-pre-line text-stone-700">
                      {u.description}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* Colonne droite : actions */}
        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <AdminNeedActions
            needId={need.id}
            currentStatus={need.status}
            isPublic={need.is_public}
          />
          <AdminImpactForm needId={need.id} />
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className="font-medium text-blue-950">{value}</dd>
    </div>
  );
}
