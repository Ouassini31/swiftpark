"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  DIGNITY_CATEGORIES,
  DIGNITY_URGENCY_LEVELS,
} from "@/lib/dignity/constants";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const labelClass = "mb-1 block text-sm font-medium text-blue-950";

export function SubmitNeedForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const data = new FormData(e.currentTarget);
    const payload = {
      first_name: data.get("first_name"),
      last_name: data.get("last_name"),
      email: data.get("email"),
      phone: data.get("phone"),
      country: data.get("country"),
      city: data.get("city"),
      category: data.get("category"),
      title: data.get("title"),
      description: data.get("description"),
      amount_requested: Number(data.get("amount_requested")),
      urgency_level: data.get("urgency_level"),
      main_image_url: data.get("main_image_url"),
      anonymized_publication: data.get("anonymized_publication") === "on",
    };

    try {
      const res = await fetch("/dignity/api/submit-need", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }));
        throw new Error(error || "Une erreur est survenue.");
      }
      setSuccess(true);
      toast.success("Besoin déposé. Il sera vérifié par notre équipe.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h2 className="mt-4 text-xl font-semibold text-emerald-800">
          Votre besoin a bien été déposé
        </h2>
        <p className="mt-2 text-sm text-emerald-700/80">
          Notre équipe va le vérifier. Une fois validé, il sera publié et
          finançable. Vous serez recontacté(e) à l&apos;adresse fournie.
        </p>
        <button
          onClick={() => router.push("/dignity/needs")}
          className="mt-6 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Voir les besoins publiés
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      {/* Coordonnées */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-stone-400">
          Vos coordonnées (confidentielles)
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Prénom *</label>
            <input name="first_name" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nom *</label>
            <input name="last_name" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email *</label>
            <input name="email" type="email" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input name="phone" className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Localisation */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-stone-400">
          Localisation
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Pays *</label>
            <input name="country" required className={inputClass} defaultValue="France" />
          </div>
          <div>
            <label className={labelClass}>Ville *</label>
            <input name="city" required className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Le besoin */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-stone-400">
          Le besoin
        </legend>
        <div>
          <label className={labelClass}>Titre *</label>
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Ex : Aide pour une facture de chauffage"
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Catégorie *</label>
            <select name="category" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Choisir…
              </option>
              {DIGNITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Niveau d&apos;urgence *</label>
            <select
              name="urgency_level"
              required
              defaultValue="moyenne"
              className={inputClass}
            >
              {DIGNITY_URGENCY_LEVELS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Description *</label>
          <textarea
            name="description"
            required
            rows={5}
            placeholder="Décrivez précisément le besoin, son contexte et l'usage des fonds."
            className={`${inputClass} resize-none`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Montant demandé (€) *</label>
            <input
              name="amount_requested"
              type="number"
              min={1}
              step="1"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Photo (URL, facultatif)</label>
            <input
              name="main_image_url"
              type="url"
              placeholder="https://…"
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <label className="flex items-start gap-2 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
        <input
          name="anonymized_publication"
          type="checkbox"
          defaultChecked
          className="mt-0.5 h-4 w-4 rounded border-stone-300"
        />
        <span>
          Publier de façon anonymisée (seul votre prénom et l&apos;initiale de
          votre nom seront visibles).
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Déposer mon besoin
      </button>
      <p className="text-center text-xs text-stone-400">
        En soumettant ce formulaire, vous acceptez que notre équipe vérifie les
        informations fournies.
      </p>
    </form>
  );
}
