import Link from "next/link";
import { createDignityAdminClient } from "@/lib/dignity/supabase";
import { StatusBadge } from "@/components/dignity/StatusBadge";
import {
  DIGNITY_STATUSES,
  DIGNITY_STATUS_LABELS,
  type DignityStatus,
} from "@/lib/dignity/constants";
import { formatEUR, formatDate } from "@/lib/dignity/format";
import type { DignityNeed } from "@/lib/dignity/types";

export const dynamic = "force-dynamic";

const STATUS_KEYS = Object.keys(DIGNITY_STATUSES) as DignityStatus[];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = createDignityAdminClient();

  let query = supabase
    .from("dignity_needs")
    .select(
      "id, title, category, city, country, amount_requested, amount_collected, status, urgency_level, created_at"
    )
    .order("created_at", { ascending: false });

  if (status && STATUS_KEYS.includes(status as DignityStatus)) {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const needs = (data ?? []) as DignityNeed[];

  // Comptes par statut pour les filtres.
  const { data: allForCounts } = await supabase
    .from("dignity_needs")
    .select("status");
  const counts: Record<string, number> = {};
  for (const row of (allForCounts ?? []) as { status: string }[]) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  const total = (allForCounts ?? []).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-blue-950">Tableau de bord</h1>
        <p className="mt-1 text-sm text-stone-500">
          {total} besoin{total > 1 ? "s" : ""} déposé{total > 1 ? "s" : ""} au
          total.
        </p>
      </header>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label={`Tous (${total})`}
          href="/dignity/admin"
          active={!status}
        />
        {STATUS_KEYS.map((s) => (
          <FilterChip
            key={s}
            label={`${DIGNITY_STATUS_LABELS[s]} (${counts[s] ?? 0})`}
            href={`/dignity/admin?status=${s}`}
            active={status === s}
          />
        ))}
      </div>

      {/* Tableau */}
      {needs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center text-stone-500">
          Aucun besoin pour ce filtre.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-4 py-3 font-medium">Titre</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Catégorie
                </th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Lieu
                </th>
                <th className="px-4 py-3 font-medium">Montant</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">
                  Déposé
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {needs.map((need) => (
                <tr key={need.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-blue-950">
                    {need.title}
                  </td>
                  <td className="hidden px-4 py-3 text-stone-500 sm:table-cell">
                    {need.category}
                  </td>
                  <td className="hidden px-4 py-3 text-stone-500 md:table-cell">
                    {need.city}, {need.country}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {formatEUR(need.amount_requested)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={need.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-stone-400 lg:table-cell">
                    {formatDate(need.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dignity/admin/needs/${need.id}`}
                      className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-blue-900 px-3 py-1.5 text-xs font-medium text-white"
          : "rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-100"
      }
    >
      {label}
    </Link>
  );
}
