"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CATEGORIES, GAP_REASONS, NEED_MIN_CENTS, NEED_MAX_CENTS, type GapReason } from "@/lib/donalia/constants";

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Erreur");
  return json;
}

export function ProgramCreateForm() {
  const router = useRouter();
  const [p, setP] = useState({ title: "", category: CATEGORIES[0].key, description: "", isPublic: true });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await post("/api/admin/programme", p);
      toast.success("Programme créé.");
      setP({ title: "", category: CATEGORIES[0].key, description: "", isPublic: true });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Titre du programme</span>
          <input value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} className="input" placeholder="Mobilité vers l'emploi" required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Catégorie</span>
          <select value={p.category} onChange={(e) => setP({ ...p, category: e.target.value })} className="input">
            <optgroup label="Prioritaires">
              {CATEGORIES.filter((c) => c.tier === "prioritaire").map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </optgroup>
            <optgroup label="À cadrer">
              {CATEGORIES.filter((c) => c.tier === "a_cadrer").map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </optgroup>
            <optgroup label="Filtrée">
              {CATEGORIES.filter((c) => c.tier === "filtree").map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </optgroup>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Mission / description</span>
        <textarea value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} rows={2} className="input" />
      </label>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={p.isPublic} onChange={(e) => setP({ ...p, isPublic: e.target.checked })} />
        Publier le programme (visible sur le site)
      </label>
      <div>
        <button disabled={busy} className="btn-primary">{busy ? "Création…" : "Créer le programme"}</button>
      </div>
    </form>
  );
}

export function NeedCreateForm({
  programs,
}: {
  programs: { id: string; title: string; category: string }[];
}) {
  const router = useRouter();
  const [n, setN] = useState({
    programId: programs[0]?.id ?? "",
    title: "",
    amountEur: "",
    gapReason: "reste_a_charge" as GapReason,
    gapExplainer: "",
    region: "",
    beneficiaryRef: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await post("/api/admin/need", {
        programId: n.programId,
        title: n.title,
        amountCents: Math.round(Number(n.amountEur) * 100),
        gapReason: n.gapReason,
        gapExplainer: n.gapExplainer || null,
        region: n.region || null,
        beneficiaryRef: n.beneficiaryRef || null,
      });
      toast.success("Besoin créé (brouillon). Lancez le diagnostic des droits avant publication.");
      setN({ ...n, title: "", amountEur: "", gapExplainer: "", region: "", beneficiaryRef: "" });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  if (programs.length === 0) {
    return <p className="text-sm text-muted">Créez d'abord un programme pour pouvoir y ajouter un besoin.</p>;
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Programme</span>
          <select value={n.programId} onChange={(e) => setN({ ...n, programId: e.target.value })} className="input">
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Résiduel (€) · {NEED_MIN_CENTS / 100}–{NEED_MAX_CENTS / 100}
          </span>
          <input type="number" min={NEED_MIN_CENTS / 100} max={NEED_MAX_CENTS / 100} value={n.amountEur} onChange={(e) => setN({ ...n, amountEur: e.target.value })} className="input" placeholder="180" required />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">L'objet du besoin</span>
        <input value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} className="input" placeholder="Un vélo pour aller au travail" required />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Raison du trou (gap_reason)</span>
          <select value={n.gapReason} onChange={(e) => setN({ ...n, gapReason: e.target.value as GapReason })} className="input">
            {(Object.keys(GAP_REASONS) as GapReason[]).map((k) => (
              <option key={k} value={k}>{GAP_REASONS[k].label}</option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">{GAP_REASONS[n.gapReason].help}</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Région</span>
          <input value={n.region} onChange={(e) => setN({ ...n, region: e.target.value })} className="input" placeholder="Hauts-de-France" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Explication du trou (public)</span>
        <input value={n.gapExplainer} onChange={(e) => setN({ ...n, gapExplainer: e.target.value })} className="input" placeholder="reste à charge après chèque énergie" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Réf. bénéficiaire (anonyme — jamais de nom/adresse)</span>
        <input value={n.beneficiaryRef} onChange={(e) => setN({ ...n, beneficiaryRef: e.target.value })} className="input" placeholder="BEN-014" />
      </label>
      <div>
        <button disabled={busy} className="btn-primary">{busy ? "Création…" : "Créer le besoin (brouillon)"}</button>
      </div>
    </form>
  );
}
