import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/donalia/AdminLoginForm";
import { Logo } from "@/components/donalia/Logo";
import { isAdmin } from "@/lib/donalia/auth";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  if (isAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center">
          <Logo />
        </Link>
        <div className="rounded-xl2 border border-line bg-card p-7 shadow-soft">
          <h1 className="font-display text-xl font-semibold text-ink">Espace association</h1>
          <p className="mb-5 mt-1 text-sm text-muted">
            Back-office réservé. Gestion des programmes, besoins et preuves.
          </p>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
