"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

export function ReportButton({ needId }: { needId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ needId, reason }),
      });
      if (!res.ok) throw new Error();
      toast.success("Merci, votre signalement a été transmis.");
      setOpen(false);
      setReason("");
    } catch {
      toast.error("Impossible d'envoyer le signalement.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-ink"
      >
        <Flag className="h-3.5 w-3.5" /> Signaler ce besoin
      </button>
    );
  }

  return (
    <div className="rounded-xl2 border border-line bg-card p-4">
      <label className="text-sm font-medium text-ink">Motif du signalement</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="mt-2 w-full rounded-lg border border-line bg-paper/40 p-2 text-sm outline-none focus:border-ink-2"
        placeholder="Décrivez le problème…"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={submit}
          disabled={sending || !reason.trim()}
          className="rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-paper disabled:opacity-50"
        >
          Envoyer
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-ink"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
