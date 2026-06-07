import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { isAdminConfigured } from "@/lib/donalia/supabase";
import { adminListPrograms, adminListNeeds } from "@/lib/donalia/admin-data";
import { ProgramCreateForm, NeedCreateForm } from "@/components/donalia/AdminCreateForms";
import { CATEGORY_LABEL } from "@/lib/donalia/constants";

export const dynamic = "force-dynamic";

export default async function ProgrammesAdminPage() {
  if (!isAdminConfigured) {
    return (
      <p className="text-muted">
        Configurez <code>SUPABASE_SERVICE_ROLE_KEY</code> pour gérer les programmes.
      </p>
    );
  }

  const [programs, needs] = await Promise.all([adminListPrograms(), adminListNeeds()]);
  const options = programs.map((p) => ({ id: p.id, title: p.title, category: p.category }));
  const needCount = (pid: string) => needs.filter((n) => n.program_id === pid).length;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Programmes & besoins</h1>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Programmes existants</h2>
        {programs.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-line bg-card/60 p-8 text-center text-muted">
            Aucun programme. Créez-en un ci-dessous.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {programs.map((p) => (
              <div key={p.id} className="rounded-xl2 border border-line bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-medium text-ink/70">
                    {CATEGORY_LABEL[p.category] ?? p.category}
                  </span>
                  <span className={`text-xs font-medium ${p.is_public ? "text-green" : "text-muted"}`}>
                    {p.is_public ? "● Public" : "○ Masqué"}
                  </span>
                </div>
                <p className="mt-2 font-display font-semibold text-ink">{p.title}</p>
                <p className="mt-1 text-xs text-muted">{needCount(p.id)} besoin(s)</p>
                {p.is_public ? (
                  <Link href={`/programme/${p.slug}`} className="mt-2 inline-flex items-center gap-1 text-xs text-green hover:underline">
                    Voir la page publique <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl2 border border-line bg-card p-6 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Nouveau programme</h2>
        <ProgramCreateForm />
      </section>

      <section className="rounded-xl2 border border-line bg-card p-6 shadow-soft">
        <h2 className="mb-1 font-display text-lg font-semibold text-ink">Nouveau besoin</h2>
        <p className="mb-4 text-sm text-muted">
          Créé en brouillon. Étapes ensuite : <strong>diagnostic des droits</strong> → en revue → publié.
        </p>
        <NeedCreateForm programs={options} />
      </section>
    </div>
  );
}
