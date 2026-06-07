import Link from "next/link";
import { DignityHeader, DignityFooter } from "@/components/dignity/DignityHeader";
import { NeedCard } from "@/components/dignity/NeedCard";
import { createDignityPublicClient } from "@/lib/dignity/supabase";
import { DIGNITY_CATEGORIES } from "@/lib/dignity/constants";
import type { DignityNeed } from "@/lib/dignity/types";

export const dynamic = "force-dynamic";

export default async function NeedsListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = createDignityPublicClient();

  let query = supabase
    .from("dignity_needs")
    .select(
      "id, title, category, country, city, amount_requested, amount_collected, status, main_image_url"
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (category && DIGNITY_CATEGORIES.includes(category as never)) {
    query = query.eq("category", category);
  }

  const { data } = await query;
  const needs = (data ?? []) as Pick<
    DignityNeed,
    | "id"
    | "title"
    | "category"
    | "country"
    | "city"
    | "amount_requested"
    | "amount_collected"
    | "status"
    | "main_image_url"
  >[];

  return (
    <>
      <DignityHeader />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-950">Besoins vérifiés</h1>
          <p className="mt-2 text-stone-600">
            Des besoins réels, contrôlés et finançables. Choisissez celui que
            vous voulez transformer en action.
          </p>
        </header>

        {/* Filtres catégories */}
        <div className="mb-8 flex flex-wrap gap-2">
          <FilterChip label="Toutes" href="/dignity/needs" active={!category} />
          {DIGNITY_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              href={`/dignity/needs?category=${encodeURIComponent(cat)}`}
              active={category === cat}
            />
          ))}
        </div>

        {needs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-20 text-center">
            <p className="text-lg font-medium text-blue-950">
              Aucun besoin publié pour le moment
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Revenez bientôt, ou{" "}
              <Link
                href="/dignity/submit-need"
                className="font-medium text-emerald-600 underline"
              >
                déposez un besoin
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {needs.map((need) => (
              <NeedCard key={need.id} need={need} />
            ))}
          </div>
        )}
      </main>

      <DignityFooter />
    </>
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
          ? "rounded-full bg-blue-900 px-4 py-1.5 text-sm font-medium text-white"
          : "rounded-full bg-white px-4 py-1.5 text-sm font-medium text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-100"
      }
    >
      {label}
    </Link>
  );
}
