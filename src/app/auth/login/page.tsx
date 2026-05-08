"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Composant interne qui utilise useSearchParams (doit être dans <Suspense>)
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/map";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [refCode, setRefCode]   = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    router.push(redirectTo);
    router.refresh();
  }

  async function handleGoogle() {
    const supabase = createClient();
    const ref = refCode.trim() ? `&ref=${refCode.trim().toUpperCase()}` : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}${ref}` },
    });
    if (error) toast.error("Google : " + error.message);
  }

  return (
    <div className="w-full max-w-sm bg-[var(--s,#fff)] border border-[var(--b,#e8e8e2)] rounded-[22px] p-6 shadow-[0_3px_20px_rgba(0,0,0,.06)]">
      <h2 className="text-[19px] font-black text-[var(--t,#111)] mb-5">Connexion</h2>

      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--t2,#555)] mb-1.5">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.fr"
            className="w-full border border-[var(--b,#e8e8e2)] rounded-[10px] px-3 py-3 text-sm text-[var(--t,#111)] bg-[var(--s2,#f8f8f5)] outline-none focus:border-[#22956b] focus:bg-white"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[var(--t2,#555)]">Mot de passe</label>
            <Link href="/auth/forgot-password" className="text-[10px] text-[#22956b] font-semibold">
              Mot de passe oublié ?
            </Link>
          </div>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-[var(--b,#e8e8e2)] rounded-[10px] px-3 py-3 text-sm text-[var(--t,#111)] bg-[var(--s2,#f8f8f5)] outline-none focus:border-[#22956b] focus:bg-white"
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full py-3.5 bg-[#22956b] text-white font-bold rounded-[14px] text-sm shadow-[0_3px_12px_rgba(34,149,107,.3)] disabled:opacity-50 mt-1"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="mt-3">
        <input
          type="text"
          value={refCode}
          onChange={(e) => setRefCode(e.target.value.toUpperCase())}
          placeholder="Code de parrainage (optionnel)"
          className="w-full border border-[var(--b,#e8e8e2)] rounded-[10px] px-3 py-2.5 text-sm text-[var(--t,#111)] bg-[var(--s2,#f8f8f5)] outline-none focus:border-[#22956b] tracking-widest text-center"
        />
      </div>

      <button
        onClick={handleGoogle}
        className="w-full py-3.5 mt-2 bg-[var(--s2,#f8f8f5)] text-[var(--t2,#555)] font-bold rounded-[14px] text-sm border border-[var(--b,#e8e8e2)] flex items-center justify-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuer avec Google
      </button>

      <div className="mt-4 bg-[var(--gl,#e8f5ef)] border border-[rgba(34,149,107,.2)] rounded-[11px] px-4 py-2.5 text-xs font-semibold text-[#085041] text-center leading-relaxed">
        🎁 5 SwiftCoins offerts à l'inscription
      </div>

      <p className="text-center text-xs text-[var(--t3,#999)] mt-4">
        Pas encore de compte ?{" "}
        <Link href="/auth/register" className="text-[#22956b] font-bold">Créer un compte</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "linear-gradient(160deg,var(--gl,#e8f5ef) 0%,var(--bg,#f5f5f2) 60%)" }}>

      {/* Branding */}
      <div className="text-center mb-7">
        <div className="w-[68px] h-[68px] bg-[#22956b] rounded-[20px] flex items-center justify-center mx-auto mb-3 shadow-[0_6px_24px_rgba(34,149,107,.4)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <h1 className="text-[26px] font-black text-[var(--t,#111)]">SwiftPark</h1>
        <p className="text-[13px] text-[var(--t2,#555)] mt-1">Partage l'info · Trouve ta place</p>
      </div>

      {/* Formulaire enveloppé dans Suspense (requis par useSearchParams) */}
      <Suspense fallback={
        <div className="w-full max-w-sm bg-white rounded-[22px] p-6 h-64 animate-pulse" />
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
