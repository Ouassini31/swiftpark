"use client";

import { useState } from "react";
import Link from "next/link";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "linear-gradient(160deg,#e8f5ef 0%,#f5f5f2 60%)" }}>
        <div className="w-20 h-20 bg-[#e8f5ef] border-2 border-[#22956b]/20 rounded-full flex items-center justify-center mb-5">
          <Mail className="w-9 h-9 text-[#22956b]" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Email envoyé !</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
          Vérifie ta boîte mail — tu as reçu un lien pour réinitialiser ton mot de passe.<br/>
          <span className="text-xs text-gray-400 mt-2 block">Pense à vérifier tes spams.</span>
        </p>
        <Link href="/auth/login"
          className="px-6 py-3 bg-[#22956b] text-white font-bold rounded-2xl text-sm">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "linear-gradient(160deg,#e8f5ef 0%,#f5f5f2 60%)" }}>

      <div className="w-full max-w-sm">
        <Link href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 font-semibold mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="bg-white border border-[#e8e8e2] rounded-[22px] p-6 shadow-[0_3px_20px_rgba(0,0,0,.06)]">
          <div className="w-12 h-12 bg-[#e8f5ef] rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-[#22956b]" />
          </div>

          <h1 className="text-[19px] font-black text-gray-900 mb-1">Mot de passe oublié ?</h1>
          <p className="text-sm text-gray-400 mb-5">
            Saisis ton email — on t'envoie un lien pour en créer un nouveau.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className="w-full border border-[#e8e8e2] rounded-[10px] px-3 py-3 text-sm text-gray-900 bg-[#f8f8f5] outline-none focus:border-[#22956b] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#22956b] text-white font-bold rounded-[14px] text-sm shadow-[0_3px_12px_rgba(34,149,107,.3)] disabled:opacity-50"
            >
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
