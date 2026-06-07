"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/dignity/api/admin/logout", { method: "POST" });
    router.replace("/dignity/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
    >
      <LogOut className="h-4 w-4" />
      Déconnexion
    </button>
  );
}
