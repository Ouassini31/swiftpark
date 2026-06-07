import Link from "next/link";
import { SiteHeader } from "@/components/donalia/SiteHeader";
import { SiteFooter } from "@/components/donalia/SiteFooter";
import { NeedCard } from "@/components/donalia/NeedCard";
import { getPublishedNeeds } from "@/lib/donalia/data";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/donalia/constants";

export const dynamic = "force-dynamic";

export default async function BesoinsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category;
  const { needs, programs } = await getPublishedNeeds(category);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-12 sm:px-6">
        <div className="sec-head">
          <div>
            <h1 className="t-h2 text-3xl">Besoins concrets</h1>
            <p className="max-w-2xl">
              Chaque besoin est le <b>résiduel après activation des droits</b>. Le don soutient
              le programme — l'asso achète l'objet, le remet, et publie la preuve.
            </p>
          </div>
        </div>

        <div className="chips mb-8">
          <Link href="/besoins" className={`chip ${!category ? "chip--on" : ""}`}>Toutes</Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/besoins?category=${encodeURIComponent(c.key)}`}
              className={`chip ${category === c.key ? "chip--on" : ""}`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {needs.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-line bg-card/60 p-12 text-center text-[color:var(--muted)]">
            {category
              ? `Aucun besoin dans « ${CATEGORY_LABEL[category] ?? category} » pour l'instant.`
              : "Aucun besoin publié pour l'instant. Revenez bientôt."}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {needs.map((need) => (
              <NeedCard key={need.id} need={need} categoryKey={programs.get(need.program_id)?.category} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
