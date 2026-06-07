import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/donalia/SiteHeader";
import { SiteFooter } from "@/components/donalia/SiteFooter";
import { DonationForm } from "@/components/donalia/DonationForm";
import { ObjectIcon } from "@/components/donalia/signature";
import { getPublicPrograms } from "@/lib/donalia/data";
import { CATEGORY_LABEL } from "@/lib/donalia/constants";

export const dynamic = "force-dynamic";

export default async function DonPage({
  searchParams,
}: {
  searchParams: { program?: string; need?: string; error?: string };
}) {
  const programs = await getPublicPrograms();
  const options = programs.map((p) => ({ id: p.id, title: p.title, category: p.category }));
  const preset = programs.find((p) => p.id === searchParams.program);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <nav className="crumb mb-5">
          <Link href="/besoins">Les besoins</Link>
          <ChevronRight size={15} /> Faire un don
        </nav>
        <h1 className="t-display text-[30px]">Faire un don</h1>
        <p className="t-body mt-2 text-[color:var(--muted)]">
          100 % de votre don part à l'association ; Donalia ne prélève rien sur les dons.
        </p>

        {preset ? (
          <div className="recap mt-6">
            <div className="recap__ic"><ObjectIcon category={preset.category} /></div>
            <div>
              <h5>{preset.title}</h5>
              <p>Programme · {CATEGORY_LABEL[preset.category] ?? preset.category}</p>
            </div>
          </div>
        ) : null}

        {searchParams.error ? (
          <div className="mt-6 rounded-[14px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Le paiement a été annulé ou a échoué. Vous pouvez réessayer ci-dessous.
          </div>
        ) : null}

        <div className="mt-6 rounded-[18px] border border-line bg-card p-6 sm:p-8" style={{ boxShadow: "var(--shadow)" }}>
          <DonationForm
            programs={options}
            presetProgram={searchParams.program}
            presetNeed={searchParams.need}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
