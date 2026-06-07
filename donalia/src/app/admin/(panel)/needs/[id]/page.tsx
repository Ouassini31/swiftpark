import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag, Image as ImageIcon, HandCoins, ShieldAlert, ScrollText } from "lucide-react";
import { StatusBadge } from "@/components/donalia/StatusBadge";
import {
  AdminNeedActions,
  AdminFulfillmentForm,
  AdminProofForm,
  DiagnosisForm,
  ActivationToggle,
} from "@/components/donalia/AdminNeedActions";
import { isAdminConfigured } from "@/lib/donalia/supabase";
import { adminGetNeed } from "@/lib/donalia/admin-data";
import { euroCents, dateFr } from "@/lib/donalia/format";
import { GAP_REASONS, CATEGORY_LABEL } from "@/lib/donalia/constants";

export const dynamic = "force-dynamic";

export default async function AdminNeedDetail({ params }: { params: { id: string } }) {
  if (!isAdminConfigured) {
    return <p className="text-muted">Configurez la clé service_role pour accéder aux besoins.</p>;
  }
  const { need, program, diagnoses, fulfillments, proofs, donations } = await adminGetNeed(params.id);
  if (!need) notFound();

  const gap = GAP_REASONS[need.gap_reason];
  const paid = donations.filter((d) => d.status === "paid");
  const totalPaid = paid.reduce((s, d) => s + Number(d.amount_cents), 0);
  const hasDiagnosis = diagnoses.length > 0;

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-muted hover:text-ink">← Tableau de bord</Link>

      {/* En-tête */}
      <div className="rounded-xl2 border border-line bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge status={need.status} />
              {program ? (
                <span className="text-sm text-muted">
                  {CATEGORY_LABEL[program.category] ?? program.category} · {program.title}
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{need.title}</h1>
            <p className="mt-1 text-sm text-ink-2">Trou : {gap?.label}{need.gap_explainer ? ` — ${need.gap_explainer}` : ""}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold text-ink">{euroCents(need.collected_cents)}</p>
            <p className="text-xs text-muted">objectif {euroCents(need.amount_cents)}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Meta label="Région" value={need.region} />
          <Meta label="Réf. bénéficiaire" value={need.beneficiary_ref} sensitive />
          <Meta label="Justificatif (privé)" value={need.justification_url ? "fourni" : null} sensitive />
        </div>
      </div>

      {/* Bilan des droits — garde-fou publication */}
      <Section icon={ScrollText} title="Bilan des droits (droits d'abord)">
        {!hasDiagnosis ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Aucun diagnostic enregistré. Il est <strong>obligatoire</strong> avant de passer en revue / publier.
          </div>
        ) : (
          <ul className="mb-4 space-y-2">
            {diagnoses.map((d) => (
              <li key={d.id} className="rounded-xl border border-line bg-paper/40 p-3 text-sm">
                <span className="font-medium text-ink">Résiduel : {d.residual_cents != null ? euroCents(d.residual_cents) : "—"}</span>
                <span className="ml-2 text-muted">· source {d.source} · {dateFr(d.performed_at)}</span>
                {d.estimated_aids && Object.keys(d.estimated_aids).length > 0 ? (
                  <div className="mt-1 text-xs text-muted">
                    Aides : {Object.entries(d.estimated_aids).map(([k, v]) => `${k} ${euroCents(Number(v))}`).join(" · ")}
                  </div>
                ) : null}
                {d.note ? <p className="mt-1 text-xs text-ink/70">{d.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
        <DiagnosisForm needId={need.id} />

        {need.gap_reason === "non_recours" ? (
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-sm font-medium text-ink">Non-recours — activation du droit requise avant publication</p>
            <ActivationToggle needId={need.id} traced={need.activation_traced} />
          </div>
        ) : null}
      </Section>

      {/* Machine à états */}
      <Section icon={ShieldAlert} title="Faire avancer le besoin">
        <AdminNeedActions needId={need.id} status={need.status} />
        <p className="mt-3 text-xs text-muted">
          draft → diagnostic → en revue → publié → financé → acheté → remis → clôturé.
        </p>
      </Section>

      {/* Achat-en-nature */}
      <Section icon={ShoppingBag} title="Achat-en-nature (fulfillment)">
        {fulfillments.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {fulfillments.map((f) => (
              <li key={f.id} className="rounded-xl border border-line bg-paper/40 p-3 text-sm">
                <span className="font-medium text-ink">{f.vendor ?? "Commerçant"}</span>
                {f.amount_cents ? ` · ${euroCents(f.amount_cents)}` : ""}
                {f.purchased_at ? ` · ${dateFr(f.purchased_at)}` : ""}
                {f.invoice_url ? (
                  <a href={f.invoice_url} target="_blank" rel="noreferrer" className="ml-2 text-green hover:underline">facture</a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-muted">Aucun achat enregistré.</p>
        )}
        <AdminFulfillmentForm needId={need.id} />
      </Section>

      {/* Preuves */}
      <Section icon={ImageIcon} title="Preuve d'impact">
        {proofs.length > 0 ? (
          <ul className="mb-4 space-y-2">
            {proofs.map((p) => (
              <li key={p.id} className="rounded-xl border border-line bg-paper/40 p-3 text-sm">
                <span className="font-medium text-ink">{p.caption ?? "Preuve"}</span>
                <span className="ml-2 rounded-full bg-paper px-2 py-0.5 text-xs text-muted">
                  {p.published ? "publiée" : "privée"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-muted">Aucune preuve ajoutée.</p>
        )}
        <AdminProofForm needId={need.id} />
      </Section>

      {/* Dons rattachés */}
      <Section icon={HandCoins} title={`Dons illustrant ce besoin · ${euroCents(totalPaid)} encaissés`}>
        {paid.length === 0 ? (
          <p className="text-sm text-muted">Aucun don payé rattaché pour l'instant.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {paid.map((d) => (
              <li key={d.id} className="flex justify-between border-b border-line/60 py-1.5">
                <span className="text-ink/80">{d.donor_name ?? "Donateur"} · {d.donor_email}</span>
                <span className="font-medium text-ink">{euroCents(d.amount_cents)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">
          Rappel : les dons sont juridiquement rattachés au programme. Ce besoin n'est qu'une illustration.
        </p>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl2 border border-line bg-card p-6 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink">
        <Icon className="h-5 w-5 text-ink-2" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Meta({ label, value, sensitive }: { label: string; value: string | null; sensitive?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-paper/40 p-3">
      <p className="text-xs text-muted">{label} {sensitive ? <span className="text-rose-500">· privé</span> : null}</p>
      <p className="text-sm text-ink">{value || "—"}</p>
    </div>
  );
}
