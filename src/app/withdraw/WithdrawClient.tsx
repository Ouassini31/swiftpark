"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const MIN_WITHDRAW = 20;

export default function WithdrawClient({
  profile, userId,
}: {
  profile: { coin_balance: number; full_name: string; username: string } | null;
  userId: string;
}) {
  const [iban, setIban]       = useState("");
  const [name, setName]       = useState(profile?.full_name ?? profile?.username ?? "");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const balance = profile?.coin_balance ?? 0;
  const canWithdraw = balance >= MIN_WITHDRAW;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWithdraw) return;
    if (!iban.trim() || !name.trim()) { toast.error("Remplis tous les champs"); return; }

    setLoading(true);
    const res = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, iban: iban.trim(), name: name.trim(), amount: balance }),
    });
    const data = await res.json();
    if (data.success) { setDone(true); }
    else { toast.error(data.error ?? "Erreur lors de la demande"); }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#f5f5f2] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-[#e8f5ef] rounded-full flex items-center justify-center mb-5">
          <CheckCircle className="w-10 h-10 text-[#22956b]" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Demande envoyée !</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Ton virement de <span className="font-black text-[#22956b]">{balance}€</span> est en cours de traitement.<br/>
          Tu recevras les fonds sous <strong>3 à 5 jours ouvrés</strong>.
        </p>
        <Link href="/wallet" className="px-6 py-3 bg-[#22956b] text-white font-bold rounded-2xl">
          Retour au Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f2] pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#22956b] to-[#1a7a58] pt-12 pb-8 px-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/wallet" className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-white text-xl">Retirer mes SwiftCoins</h1>
        </div>

        {/* Solde */}
        <div className="bg-white/15 rounded-2xl p-4 text-center">
          <p className="text-white/70 text-xs mb-1">Solde disponible</p>
          <p className="text-4xl font-black text-white">⚡ {balance} SC</p>
          <p className="text-white/70 text-sm mt-1">= {balance}€</p>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">

        {/* Seuil minimum */}
        {!canWithdraw && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Solde insuffisant</p>
              <p className="text-amber-700 text-xs mt-1">
                Il faut minimum <strong>20 SC (20€)</strong> pour effectuer un retrait.<br/>
                Il te manque <strong>{MIN_WITHDRAW - balance} SC</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Infos retrait */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Banknote className="w-5 h-5 text-[#22956b]" />
            <p className="font-black text-gray-900 text-sm">Comment ça marche</p>
          </div>
          {[
            "Minimum 20 SC (20€) pour retirer",
            "Virement SEPA sous 3 à 5 jours ouvrés",
            "Ton solde est débité immédiatement",
            "Aucun frais de retrait",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-[#22956b]">✓</span> {item}
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom du titulaire du compte</label>
            <input
              type="text" required value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#22956b] bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">IBAN</label>
            <input
              type="text" required value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#22956b] bg-white tracking-widest font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={!canWithdraw || loading}
            className="w-full py-4 bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white font-black rounded-2xl shadow-lg shadow-[#22956b]/30 disabled:opacity-40 transition"
          >
            {loading ? "Envoi en cours…" : `Demander le virement de ${balance}€`}
          </button>

          <p className="text-center text-xs text-gray-400">
            En soumettant, tu acceptes que ton solde soit débité de {balance} SC
          </p>
        </form>
      </div>
    </div>
  );
}
