import { redirect } from "next/navigation";
import Link from "next/link";
import { isDignityAdmin } from "@/lib/dignity/auth";
import { AdminLogoutButton } from "@/components/dignity/AdminLogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isDignityAdmin())) redirect("/dignity/admin/login");

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/dignity/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-amber-400">
              D
            </span>
            <span className="font-semibold text-blue-950">
              Admin · Dignity Layer
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dignity"
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-500 transition hover:bg-stone-100"
            >
              Voir le site
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
