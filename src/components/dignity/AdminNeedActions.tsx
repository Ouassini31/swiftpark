"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  DIGNITY_STATUSES,
  DIGNITY_STATUS_LABELS,
  DIGNITY_VERIFICATION_METHODS,
  type DignityStatus,
} from "@/lib/dignity/constants";

const STATUS_KEYS = Object.keys(DIGNITY_STATUSES) as DignityStatus[];

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const labelClass = "mb-1 block text-xs font-medium text-stone-500";

export function AdminNeedActions({
  needId,
  currentStatus,
  isPublic,
}: {
  needId: string;
  currentStatus: DignityStatus;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<DignityStatus>(currentStatus);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const payload = {
      need_id: needId,
      status,
      is_public: data.get("is_public") === "on",
      verification_method: data.get("verification_method") || null,
      internal_note: data.get("internal_note") || null,
      public_note: data.get("public_note") || null,
    };

    try {
      const res = await fetch("/dignity/api/admin/update-need", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }));
        throw new Error(error || "Action impossible.");
      }
      toast.success("Besoin mis à jour.");
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
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
        Vérifier & publier
      </h2>

      <div>
        <label className={labelClass}>Statut</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as DignityStatus)}
          className={inputClass}
        >
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s}>
              {DIGNITY_STATUS_LABELS[s]} — {DIGNITY_STATUSES[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Méthode de vérification</label>
        <select
          name="verification_method"
          defaultValue=""
          className={inputClass}
        >
          <option value="">—</option>
          {DIGNITY_VERIFICATION_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Note interne</label>
        <textarea
          name="internal_note"
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder="Visible uniquement par l'équipe."
        />
      </div>

      <div>
        <label className={labelClass}>Note publique</label>
        <textarea
          name="public_note"
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder="Affichée sur la fiche publique."
        />
      </div>

      <label className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
        <input
          name="is_public"
          type="checkbox"
          defaultChecked={isPublic}
          className="h-4 w-4 rounded border-stone-300"
        />
        Rendre ce besoin public
      </label>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Enregistrer
      </button>
    </form>
  );
}
