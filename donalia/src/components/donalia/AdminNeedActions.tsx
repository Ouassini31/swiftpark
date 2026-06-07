"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { STATUS_META, TRANSITIONS, ESTIMATE_DISCLAIMER, type NeedStatus, type GapReason } from "@/lib/donalia/constants";

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

export function AdminNeedActions({ needId, status }: { needId: string; status: NeedStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const next = TRANSITIONS[status] ?? [];

  async function transition(to: NeedStatus) {
    setBusy(to);
    try {
      await post("/api/admin/update-need", { id: needId, status: to });
      toast.success(`Statut → ${STATUS_META[to].label}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  if (next.length === 0) {
    return <p className="text-sm text-muted">Aucune action d'état disponible.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((to) => (
        <button
          key={to}
          onClick={() => transition(to)}
          disabled={busy !== null}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
            to === "rejete" || to === "clos_sans_suite"
              ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              : "bg-ink text-paper hover:bg-ink-2"
          }`}
        >
          {busy === to ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {to === "rejete" ? "Rejeter" : to === "clos_sans_suite" ? "Clore sans suite" : `→ ${STATUS_META[to].label}`}
        </button>
      ))}
    </div>
  );
}

/** Bilan des droits (OpenFisca / saisie agent). */
export function DiagnosisForm({ needId }: { needId: string }) {
  const router = useRouter();
  const [aids, setAids] = useState<{ label: string; eur: string }[]>([{ label: "", eur: "" }]);
  const [residual, setResidual] = useState("");
  const [note, setNote] = useState("");
  const [align, setAlign] = useState(true);
  const [busy, setBusy] = useState(false);

  function setAid(i: number, k: "label" | "eur", v: string) {
    setAids((a) => a.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const aidsMap: Record<string, number> = {};
      for (const a of aids) if (a.label.trim() && a.eur) aidsMap[a.label.trim()] = Number(a.eur);
      await post("/api/admin/diagnose", {
        needId,
        aids: aidsMap,
        residualEur: residual ? Number(residual) : null,
        note: note || null,
        setNeedAmount: align,
      });
      toast.success("Bilan des droits enregistré.");
      setAids([{ label: "", eur: "" }]);
      setResidual("");
      setNote("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink">Aides estimées (droits ouverts)</span>
        <div className="space-y-2">
          {aids.map((a, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={a.label}
                onChange={(e) => setAid(i, "label", e.target.value)}
                className="input flex-1"
                placeholder="ex : chèque énergie"
              />
              <input
                type="number"
                value={a.eur}
                onChange={(e) => setAid(i, "eur", e.target.value)}
                className="input w-28"
                placeholder="€"
              />
              {aids.length > 1 ? (
                <button type="button" onClick={() => setAids((x) => x.filter((_, idx) => idx !== i))} className="rounded-lg px-2 text-muted hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setAids((x) => [...x, { label: "", eur: "" }])} className="mt-2 inline-flex items-center gap-1 text-sm text-green hover:underline">
          <Plus className="h-3.5 w-3.5" /> Ajouter une aide
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Résiduel après droits (€)</span>
          <input type="number" value={residual} onChange={(e) => setResidual(e.target.value)} className="input" placeholder="ex : 180" />
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm text-ink">
          <input type="checkbox" checked={align} onChange={(e) => setAlign(e.target.checked)} />
          Aligner le montant du besoin sur le résiduel
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Note interne</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input" placeholder="Sources / hypothèses du bilan…" />
      </label>

      <p className="text-xs text-muted">{ESTIMATE_DISCLAIMER}</p>
      <div>
        <button disabled={busy} className="btn-primary">{busy ? "Enregistrement…" : "Enregistrer le bilan des droits"}</button>
      </div>
    </form>
  );
}

/** Traçage de l'activation du droit (requis pour publier un non_recours). */
export function ActivationToggle({ needId, traced }: { needId: string; traced: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (traced) return <p className="text-sm text-green">✓ Activation du droit tracée.</p>;
  async function mark() {
    setBusy(true);
    try {
      await post("/api/admin/update-need", { id: needId, patch: { activation_traced: true } });
      toast.success("Activation tracée.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={mark} disabled={busy} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50">
      {busy ? "…" : "Marquer l'activation du droit comme tentée/tracée"}
    </button>
  );
}

export function AdminFulfillmentForm({ needId }: { needId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ vendor: "", amountEur: "", invoiceUrl: "", purchasedAt: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await post("/api/admin/fulfillment", { needId, ...f });
      toast.success("Achat-en-nature enregistré.");
      setF({ vendor: "", amountEur: "", invoiceUrl: "", purchasedAt: "" });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Commerçant payé par l'asso">
        <input value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} className="input" placeholder="Cyclable Lille" />
      </Field>
      <Field label="Montant de l'achat (€)">
        <input type="number" value={f.amountEur} onChange={(e) => setF({ ...f, amountEur: e.target.value })} className="input" placeholder="180" />
      </Field>
      <Field label="URL de la facture (Storage privé)">
        <input value={f.invoiceUrl} onChange={(e) => setF({ ...f, invoiceUrl: e.target.value })} className="input" placeholder="https://…/facture.pdf" />
      </Field>
      <Field label="Date d'achat / remise">
        <input type="date" value={f.purchasedAt} onChange={(e) => setF({ ...f, purchasedAt: e.target.value })} className="input" />
      </Field>
      <div className="sm:col-span-2">
        <button disabled={busy} className="btn-primary">{busy ? "Enregistrement…" : "Enregistrer l'achat-en-nature"}</button>
      </div>
    </form>
  );
}

export function AdminProofForm({ needId }: { needId: string }) {
  const router = useRouter();
  const [p, setP] = useState({ mediaUrl: "", caption: "", published: true });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await post("/api/admin/proof", { needId, ...p });
      toast.success("Preuve ajoutée.");
      setP({ mediaUrl: "", caption: "", published: true });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <Field label="URL média (l'OBJET remis — jamais le visage)">
        <input value={p.mediaUrl} onChange={(e) => setP({ ...p, mediaUrl: e.target.value })} className="input" placeholder="https://…/velo.jpg" />
      </Field>
      <Field label="Légende">
        <textarea value={p.caption} onChange={(e) => setP({ ...p, caption: e.target.value })} rows={3} className="input" placeholder="Vélo acheté chez … et remis." />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={p.published} onChange={(e) => setP({ ...p, published: e.target.checked })} />
        Publier la preuve (visible publiquement une fois le besoin clôturé)
      </label>
      <div>
        <button disabled={busy} className="btn-primary">{busy ? "Ajout…" : "Ajouter la preuve"}</button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
