"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const labelClass = "mb-1 block text-xs font-medium text-stone-500";

export function AdminImpactForm({ needId }: { needId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      need_id: needId,
      title: data.get("title"),
      description: data.get("description"),
      image_url: data.get("image_url") || null,
      proof_file_url: data.get("proof_file_url") || null,
    };

    try {
      const res = await fetch("/dignity/api/admin/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }));
        throw new Error(error || "Action impossible.");
      }
      toast.success("Preuve d'impact ajoutée.");
      form.reset();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
        Ajouter une preuve d&apos;impact
      </h2>

      <div>
        <label className={labelClass}>Titre *</label>
        <input name="title" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Description *</label>
        <textarea
          name="description"
          required
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
      <div>
        <label className={labelClass}>Image (URL)</label>
        <input name="image_url" type="url" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Justificatif (URL)</label>
        <input name="proof_file_url" type="url" className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Publier la preuve
      </button>
    </form>
  );
}
