"use client";

import { useState } from "react";
import { Loader2, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { DONATION_CHIPS } from "@/lib/donalia/constants";
import { toCents, euroCents } from "@/lib/donalia/format";
import { ReceiptBanner } from "./signature";

type ProgramOption = { id: string; title: string; category: string };
const TIPS = [0, 2, 5];

export function DonationForm({
  programs,
  presetProgram,
  presetNeed,
}: {
  programs: ProgramOption[];
  presetProgram?: string;
  presetNeed?: string;
}) {
  const [programId, setProgramId] = useState(presetProgram ?? programs[0]?.id ?? "");
  const [amount, setAmount] = useState<number>(20);
  const [custom, setCustom] = useState("");
  const [tip, setTip] = useState<number>(0);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const effectiveAmount = custom ? Number(custom) : amount;
  const totalCents = toCents((effectiveAmount || 0) + tip);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!programId) return toast.error("Choisissez un programme.");
    if (!effectiveAmount || effectiveAmount < 1) return toast.error("Montant invalide.");
    if (!email.includes("@")) return toast.error("Email invalide.");
    setLoading(true);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          needId: presetNeed ?? null,
          amountCents: toCents(effectiveAmount),
          tipCents: toCents(tip),
          donorEmail: email,
          donorName: name || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      window.location.href = json.redirectUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du don.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Programme */}
      <div>
        <span className="flabel">Programme soutenu</span>
        <div className="field">
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full bg-transparent text-[15px] font-semibold text-[color:var(--text)] outline-none"
          >
            {programs.length === 0 ? (
              <option value="">Aucun programme disponible</option>
            ) : (
              programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)
            )}
          </select>
        </div>
        <p className="tip-note mt-2">
          Votre don est rattaché à ce <b>programme</b>. C'est l'association qui décide de l'allocation.
        </p>
      </div>

      {/* Montant */}
      <div>
        <span className="flabel">Votre don</span>
        <div className="amounts">
          {DONATION_CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setAmount(c); setCustom(""); }}
              className={`amount ${!custom && amount === c ? "amount--on" : ""}`}
            >
              {c} €
            </button>
          ))}
        </div>
        <div className="field mt-2.5">
          <span className="field__cur">€</span>
          <input
            type="number" min={1} value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Autre montant"
          />
        </div>
      </div>

      {/* Pourboire HelloAsso */}
      <div>
        <span className="flabel">Pourboire à HelloAsso</span>
        <div className="seg">
          {TIPS.map((t) => (
            <button key={t} type="button" onClick={() => setTip(t)} className={tip === t ? "is-on" : ""}>
              {t === 0 ? "Aucun" : `${t} €`}
            </button>
          ))}
        </div>
        <p className="tip-note mt-2">
          Le pourboire soutient l'outil <b>HelloAsso</b> (qui rend le service gratuit). Il ne revient <b>pas</b> à Donalia.
        </p>
      </div>

      {/* Coordonnées */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className="flabel">Email (pour le reçu)</span>
          <div className="field"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@email.fr" /></div>
        </div>
        <div>
          <span className="flabel">Nom (optionnel)</span>
          <div className="field"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom Nom" /></div>
        </div>
      </div>

      <ReceiptBanner />

      <button type="submit" disabled={loading} className="btn btn--primary btn--block btn--lg">
        {loading ? <Loader2 className="animate-spin" size={18} /> : <>Donner {euroCents(totalCents)} <ArrowRight size={18} /></>}
      </button>

      <div className="pay-secure">
        <Lock size={14} /> Paiement sécurisé via <strong style={{ color: "var(--ink2)", fontWeight: 800 }}>&nbsp;HelloAsso</strong>
      </div>
    </form>
  );
}
