import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileCheck2, ReceiptText } from "lucide-react";
import { SiteHeader } from "@/components/donalia/SiteHeader";
import { SiteFooter } from "@/components/donalia/SiteFooter";
import { getNeed, getPublishedProof } from "@/lib/donalia/data";
import { dateFr } from "@/lib/donalia/format";
import { PUBLIC_STATUSES, CATEGORY_LABEL } from "@/lib/donalia/constants";

export const dynamic = "force-dynamic";

export default async function PreuvePage({ params }: { params: { id: string } }) {
  const { need, program } = await getNeed(params.id);
  if (!need || !PUBLIC_STATUSES.includes(need.status)) notFound();

  const proof = await getPublishedProof(need.id);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <Link href={`/besoin/${need.id}`} className="text-sm text-muted hover:text-ink">
          ← Retour au besoin
        </Link>

        <div className="mt-4 flex items-center gap-2 text-green">
          <CheckCircle2 className="h-6 w-6" />
          <span className="font-display text-sm font-semibold uppercase tracking-wide">Preuve d'impact</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{need.title}</h1>
        {program ? (
          <p className="mt-1 text-sm text-muted">
            Programme : {CATEGORY_LABEL[program.category] ?? program.category} · {program.title}
          </p>
        ) : null}

        {proof ? (
          <article className="mt-6 rounded-xl2 border border-line bg-card p-6 shadow-soft">
            {proof.media_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proof.media_url}
                alt={proof.caption ?? "Objet remis"}
                className="mb-5 h-64 w-full rounded-xl2 object-cover"
              />
            ) : null}
            <h2 className="font-display text-xl font-semibold text-ink">Remise effectuée</h2>
            {proof.caption ? (
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink/85">{proof.caption}</p>
            ) : null}
            <p className="mt-3 text-xs text-muted">Publié le {dateFr(proof.created_at)}</p>
          </article>
        ) : (
          <div className="mt-6 rounded-xl2 border border-dashed border-line bg-card/60 p-10 text-center text-muted">
            La preuve d'impact n'est pas encore publiée pour ce besoin.
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl2 border border-line bg-paper/50 p-4 text-sm">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-ink-2" />
            <span className="text-ink/80">
              <strong>Facture archivée</strong> par l'association (achat-en-nature). Pièce conservée
              pour contrôle, non publiée (confidentialité).
            </span>
          </div>
          <div className="flex items-start gap-3 rounded-xl2 border border-line bg-paper/50 p-4 text-sm">
            <ReceiptText className="mt-0.5 h-5 w-5 shrink-0 text-ink-2" />
            <span className="text-ink/80">
              <strong>Reçu</strong> adressé à chaque donateur par l'association après paiement.
            </span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Conformément à notre charte, la preuve montre l'objet remis, jamais l'identité du bénéficiaire.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
