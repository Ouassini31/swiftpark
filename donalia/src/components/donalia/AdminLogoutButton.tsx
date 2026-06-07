"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink/70 transition hover:bg-paper hover:text-ink"
    >
      <LogOut className="h-4 w-4" /> Déconnexion
    </button>
  );
}
