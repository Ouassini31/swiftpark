"use client";

import { useState } from "react";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function WithdrawalActions({
  id,
  status,
  iban,
}: {
  id: string;
  status: string;
  iban: string;
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [done, setDone]       = useState<string>(status);
  const [copied, setCopied]   = useState(false);

  async function update(newStatus: "completed" | "rejected") {
    setLoading(newStatus === "completed" ? "approve" : "reject");
    const supabase = createClient();
    const { error } = await (supabase as Parameters<typeof supabase.from>[0] extends never ? never : ReturnType<typeof supabase.from>["update"] extends never ? never : typeof supabase)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("withdrawal_requests" as any)
      .update({ status: newStatus, processed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      setDone(newStatus);
      toast.success(newStatus === "completed" ? "Virement marqué comme effectué" : "Demande rejetée");
    }
    setLoading(null);
  }

  function copyIban() {
    navigator.clipboard.writeText(iban);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (done === "completed") {
    return <span className="text-xs text-green-600 font-bold">✓ Virée</span>;
  }
  if (done === "rejected") {
    return <span className="text-xs text-red-500 font-bold">✗ Rejetée</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Copier IBAN */}
      <button
        onClick={copyIban}
        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
        title="Copier l'IBAN complet"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {/* Rejeter */}
      <button
        onClick={() => update("rejected")}
        disabled={!!loading}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition disabled:opacity-50"
      >
        {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
        Rejeter
      </button>

      {/* Approuver */}
      <button
        onClick={() => update("completed")}
        disabled={!!loading}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition disabled:opacity-50"
      >
        {loading === "approve" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
        Virement fait
      </button>
    </div>
  );
}
