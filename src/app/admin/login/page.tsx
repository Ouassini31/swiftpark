"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientAny as createClient } from "@/lib/supabase/client";
import { Shield, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // Vérifier que le compte est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Erreur d'authentification."); setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles" as never)
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };

    if (!profile || profile.role !== "admin") {
      await supabase.auth.signOut();
      setError("Accès refusé. Ce compte n'est pas administrateur.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#22956b] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#22956b]/40">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">SwiftPark Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Accès réservé aux administrateurs</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@swiftpark.fr"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#22956b]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#22956b]"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-semibold bg-red-900/30 border border-red-800 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#22956b] text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#22956b]/30"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accéder au dashboard"}
          </button>
        </form>

      </div>
    </div>
  );
}
