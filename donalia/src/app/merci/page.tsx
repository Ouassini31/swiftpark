import Link from "next/link";
import { CheckCircle2, Bell, ReceiptText } from "lucide-react";
import { SiteHeader } from "@/components/donalia/SiteHeader";
import { SiteFooter } from "@/components/donalia/SiteFooter";
import { markDonationPaid } from "@/lib/donalia/donations-server";
import { euroCents } from "@/lib/donalia/format";

export const dynamic = "force-dynamic";

export default async function MerciPage({
  searchParams,
}: {
  searchParams: { ref?: string; demo?: string; amount?: string };
}) {
  // Mode démo : on finalise ici (en réel, c'est le webhook HelloAsso).
  if (searchParams.demo === "1" && searchParams.ref) {
    await markDonationPaid(searchParams.ref);
  }
  const amountCents = searchParams.amount ? Number(searchParams.amount) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8efe9]">
          <CheckCircle2 className="h-9 w-9 text-green" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold text-ink">
          Merci pour votre don{amountCents ? ` de ${euroCents(amountCents)}` : ""} !
        </h1>
        <p className="mt-3 text-ink/75">
          Votre soutien rejoint un programme concret. L'association l'alloue, achète l'objet et le remet.
        </p>

        <div className="mt-8 space-y-3 text-left">
          <Card icon={Bell} title="Vous serez notifié de l'impact">
            Dès que le besoin est clôturé, vous recevrez la preuve d'impact (achat + remise).
          </Card>
          <Card icon={ReceiptText} title="Votre reçu arrive par email">
            L'association vous adresse votre reçu (et l'attestation fiscale le cas échéant).
          </Card>
        </div>

        {searchParams.demo === "1" ? (
          <p className="mt-6 rounded-xl2 border border-line bg-paper/60 p-3 text-xs text-muted">
            Mode démonstration : aucun paiement réel. En production, le don passe par HelloAsso.
          </p>
        ) : null}

        <div className="mt-8 flex justify-center gap-3">
          <Link href="/besoins" className="rounded-xl2 bg-ink px-6 py-3 font-semibold text-paper transition hover:bg-ink-2">
            Découvrir d'autres besoins
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl2 border border-line bg-card p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink-2" />
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-muted">{children}</p>
      </div>
    </div>
  );
}
