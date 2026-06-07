"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HeartHandshake, Loader2 } from "lucide-react";

// Intention de contribution (MVP) — aucun paiement réel.
export function ContributionForm({ needId }: { needId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      need_id: needId,
      donor_name: String(data.get("donor_name") || "").trim(),
      donor_email: String(data.get("donor_email") || "").trim(),
      amount: Number(data.get("amount")),
      message: String(data.get("message") || "").trim() || null,
    };

    try {
      const res = await fetch("/dignity/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }));
        throw new Error(error || "Une erreur est survenue.");
      }
      setDone(true);
      toast.success("Merci ! Votre intention de contribution est enregistrée.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl bg-emerald-50 px-4 py-5 text-center ring-1 ring-emerald-600/20">
        <HeartHandshake className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-2 font-semibold text-emerald-800">Merci pour votre geste</p>
        <p className="mt-1 text-sm text-emerald-700/80">
          Nous reviendrons vers vous pour finaliser votre contribution.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm font-semibold text-blue-950">
        Manifester une intention de contribution
      </p>

      <input
        name="donor_name"
        required
        placeholder="Votre nom"
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <input
        name="donor_email"
        type="email"
        required
        placeholder="Votre email"
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <div className="relative">
        <input
          name="amount"
          type="number"
          min={1}
          step="1"
          required
          placeholder="Montant"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
          €
        </span>
      </div>
      <textarea
        name="message"
        rows={2}
        placeholder="Un message (facultatif)"
        className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <HeartHandshake className="h-4 w-4" />
        )}
        Contribuer
      </button>
      <p className="text-center text-xs text-stone-400">
        Aucun paiement immédiat — vous manifestez simplement votre intention.
      </p>
    </form>
  );
}
