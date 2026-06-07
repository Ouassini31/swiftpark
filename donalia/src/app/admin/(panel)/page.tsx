import Link from "next/link";
import { AlertTriangle, FolderPlus } from "lucide-react";
import { StatusBadge } from "@/components/donalia/StatusBadge";
import { isAdminConfigured } from "@/lib/donalia/supabase";
import { adminListNeeds, adminListPrograms, adminReportsCount } from "@/lib/donalia/admin-data";
import { euroCents } from "@/lib/donalia/format";
import { CATEGORY_LABEL, type NeedStatus } from "@/lib/donalia/constants";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  if (!isAdminConfigured) {
    return (
      <p className="text-muted">
        Configurez <code>SUPABASE_SERVICE_ROLE_KEY</code> pour accéder aux données.
      </p>
    );
  }

  const [needs, programs, reports] = await Promise.all([
    adminListNeeds(),
    adminListPrograms(),
    adminReportsCount(),
  ]);

  const count = (s: NeedStatus) => needs.filter((n) => n.status === s).length;
  const programTitle = (id: string) => programs.find((p) => p.id === id)?.title ?? "—";

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Tableau de bord</h1>
          <p className="text-sm text-muted">Droits d'abord → besoin → financement → preuve.</p>
        </div>
        <Link href="/admin/programmes" className="inline-flex items-center gap-2 rounded-xl2 bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-2">
          <FolderPlus className="h-4 w-4" /> Programmes & besoins
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="En diagnostic droits" value={count("diagnostic")} accent={count("diagnostic") > 0} />
        <Kpi label="À modérer" value={count("en_revue")} accent={count("en_revue") > 0} />
        <Kpi label="Publiés / financés" value={count("publie") + count("finance")} />
        <Kpi label="Clôturés" value={count("cloture")} />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Besoins</h2>
        {needs.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-line bg-card/60 p-8 text-center text-muted">
            Aucun besoin. Créez un programme, puis ajoutez-y un besoin.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl2 border border-line bg-card">
            <table className="w-full text-sm">
              <thead className="bg-paper/60 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Objet</th>
                  <th className="px-4 py-3 font-medium">Programme</th>
                  <th className="px-4 py-3 font-medium">Réuni</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {needs.map((n) => (
                  <tr key={n.id} className="border-t border-line/70 hover:bg-paper/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/needs/${n.id}`} className="font-medium text-ink hover:underline">
                        {n.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{programTitle(n.program_id)}</td>
                    <td className="px-4 py-3 text-ink/80">
                      {euroCents(n.collected_cents)} / {euroCents(n.amount_cents)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {reports > 0 ? (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4" /> {reports} signalement(s) reçu(s).
          </p>
        ) : null}
      </section>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-xl2 border p-5 ${accent ? "border-amber-200 bg-amber-50" : "border-line bg-card"}`}>
      <p className="font-display text-3xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
