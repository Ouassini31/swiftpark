"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error();
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Mot de passe incorrect.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-ink">Mot de passe association</label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-paper/40 px-3">
          <Lock className="h-4 w-4 text-muted" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent py-2.5 text-sm outline-none"
            placeholder="••••••••"
            autoFocus
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-ink px-5 py-3 font-semibold text-paper transition hover:bg-ink-2 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
      </button>
    </form>
  );
}
