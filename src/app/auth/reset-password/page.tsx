"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Lock, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("Les mots de passe ne correspondent pas"); return; }
    if (password.length < 8)  { toast.error("Minimum 8 caractères"); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/map"), 2000);
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "linear-gradient(160deg,#e8f5ef 0%,#f5f5f2 60%)" }}>
        <div className="w-20 h-20 bg-[#e8f5ef] border-2 border-[#22956b]/20 rounded-full flex items-center justify-center mb-5">
          <CheckCircle className="w-9 h-9 text-[#22956b]" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Mot de passe mis à jour !</h1>
        <p className="text-gray-400 text-sm">Redirection en cours…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "linear-gradient(160deg,#e8f5ef 0%,#f5f5f2 60%)" }}>

      <div className="w-full max-w-sm bg-white border border-[#e8e8e2] rounded-[22px] p-6 shadow-[0_3px_20px_rgba(0,0,0,.06)]">
        <div className="w-12 h-12 bg-[#e8f5ef] rounded-2xl flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-[#22956b]" />
        </div>

        <h1 className="text-[19px] font-black text-gray-900 mb-1">Nouveau mot de passe</h1>
        <p className="text-sm text-gray-400 mb-5">Choisis un mot de passe sécurisé (min. 8 caractères).</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-[#e8e8e2] rounded-[10px] px-3 py-3 text-sm text-gray-900 bg-[#f8f8f5] outline-none focus:border-[#22956b] focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-[#e8e8e2] rounded-[10px] px-3 py-3 text-sm text-gray-900 bg-[#f8f8f5] outline-none focus:border-[#22956b] focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#22956b] text-white font-bold rounded-[14px] text-sm shadow-[0_3px_12px_rgba(34,149,107,.3)] disabled:opacity-50 mt-1"
          >
            {loading ? "Mise à jour…" : "Mettre à jour"}
          </button>
        </form>
      </div>
    </div>
  );
}
