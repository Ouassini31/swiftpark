import { redirect } from "next/navigation";
import Link from "next/link";
import { isDignityAdmin } from "@/lib/dignity/auth";
import { AdminLoginForm } from "@/components/dignity/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isDignityAdmin()) redirect("/dignity/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/dignity"
          className="mb-8 flex items-center justify-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-amber-400">
            D
          </span>
          <span className="text-xl font-semibold text-blue-950">
            Dignity<span className="text-emerald-600">Layer</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-blue-950">Espace admin</h1>
          <p className="mt-1 text-sm text-stone-500">
            Accès réservé à l&apos;équipe de vérification.
          </p>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
