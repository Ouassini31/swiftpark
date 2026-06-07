import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/donalia/auth";
import { isAdminConfigured } from "@/lib/donalia/supabase";
import { AdminLogoutButton } from "@/components/donalia/AdminLogoutButton";
import { LogoMark } from "@/components/donalia/Logo";
import { BRAND } from "@/lib/donalia/constants";

export const dynamic = "force-dynamic";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!isAdmin()) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark size={30} />
            <span className="font-display font-semibold text-ink">
              {BRAND.name} <span className="text-muted">· asso</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/admin" className="rounded-lg px-3 py-1.5 text-sm text-ink/70 hover:bg-paper hover:text-ink">
              Tableau de bord
            </Link>
            <Link href="/admin/programmes" className="rounded-lg px-3 py-1.5 text-sm text-ink/70 hover:bg-paper hover:text-ink">
              Programmes
            </Link>
            <Link href="/" className="rounded-lg px-3 py-1.5 text-sm text-ink/70 hover:bg-paper hover:text-ink">
              Voir le site
            </Link>
            <AdminLogoutButton />
          </nav>
        </div>
      </header>

      {!isAdminConfigured ? (
        <div className="mx-auto max-w-content px-4 pt-4 sm:px-6">
          <div className="rounded-xl2 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            ⚠️ <strong>SUPABASE_SERVICE_ROLE_KEY manquante.</strong> Les écritures
            back-office (création, changements d'état, preuves) sont désactivées tant
            que cette clé n'est pas configurée.
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-content px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
