"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  TrendingUp, TrendingDown, Zap, ArrowLeft,
  CheckCircle, Loader2, ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Database } from "@/types/database";

type Profile     = Database["public"]["Tables"]["profiles"]["Row"];
type Transaction = Database["public"]["Tables"]["coin_transactions"]["Row"];

interface CoinPack {
  id: string;
  name: string;
  coins: number;
  price_eur_cents: number;
  bonus_pct: number;
  is_popular: boolean;
}

const TX_ICONS: Record<string, string> = {
  earn: "💰", spend: "🔑", commission: "🏦", refund: "↩️", bonus: "🎁", purchase: "💳",
};

export default function WalletClient({
  profile, transactions, packs,
}: {
  profile: Profile | null;
  transactions: Transaction[];
  packs: CoinPack[];
}) {
  const params  = useSearchParams();
  const success = params.get("success") === "1";
  const canceled = params.get("canceled") === "1";

  const [buying, setBuying] = useState<string | null>(null);

  async function handleBuy(pack: CoinPack) {
    setBuying(pack.id);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_id: pack.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Erreur serveur");
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      toast.error(msg);
      setBuying(null);
    }
  }

  const balance = profile?.coin_balance ?? 0;

  return (
    <div className="min-h-screen bg-[#f5f5f2] pb-28">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#22956b] to-[#1a7a58] pt-12 pb-10 px-5">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/map"
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white font-black text-xl">Wallet SwiftCoins</h1>
        </div>

        {/* Bannière succès / annulation */}
        {success && (
          <div className="mb-6 bg-white/20 rounded-2xl px-4 py-3 flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-white shrink-0" />
            <p className="text-white text-sm font-semibold">
              Paiement réussi ! Tes SwiftCoins ont été crédités ✨
            </p>
          </div>
        )}
        {canceled && (
          <div className="mb-6 bg-white/10 rounded-2xl px-4 py-3">
            <p className="text-white/70 text-sm">Paiement annulé.</p>
          </div>
        )}

        {/* Solde */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div className="w-10 h-10 bg-[#f5a623] rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-6xl font-black text-white tracking-tight">
              {balance}
            </span>
          </div>
          <p className="text-white/60 text-sm mt-1">SwiftCoins disponibles</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-7">
          <div className="bg-white/15 rounded-2xl p-3.5 text-center">
            <div className="flex items-center justify-center gap-1 text-green-300 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Gagnés</span>
            </div>
            <p className="text-white font-black text-lg">{profile?.coins_earned ?? 0} SC</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3.5 text-center">
            <div className="flex items-center justify-center gap-1 text-red-300 mb-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Dépensés</span>
            </div>
            <p className="text-white font-black text-lg">{profile?.coins_spent ?? 0} SC</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 mt-6">

        {/* ── Packs d'achat ─────────────────────────────────────── */}
        {packs.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
              Acheter des SwiftCoins
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {packs.map((pack) => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  loading={buying === pack.id}
                  onBuy={() => handleBuy(pack)}
                />
              ))}
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-3">
              Paiement sécurisé via Stripe · Crédité instantanément
            </p>
          </section>
        )}

        {/* ── Historique ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Historique des transactions
          </h2>

          {transactions.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucune transaction pour l'instant</p>
              <p className="text-xs mt-1 text-gray-400">
                Partagez ou trouvez une place pour commencer !
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ── PackCard ─────────────────────────────────────────────────────────── */
function PackCard({
  pack, loading, onBuy,
}: {
  pack: CoinPack;
  loading: boolean;
  onBuy: () => void;
}) {
  const euros = (pack.price_eur_cents / 100).toFixed(2).replace(".", ",");

  return (
    <div
      className={`relative bg-white rounded-2xl p-4 shadow-sm border-2 transition ${
        pack.is_popular ? "border-[#22956b]" : "border-transparent"
      }`}
    >
      {pack.is_popular && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="bg-[#22956b] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
            ⭐ Populaire
          </span>
        </div>
      )}

      <div className="text-center mb-3">
        <div className="flex items-center justify-center gap-1.5">
          <Zap className="w-4 h-4 text-[#f5a623] fill-[#f5a623]" />
          <span className="text-2xl font-black text-gray-900">{pack.coins}</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">
          SwiftCoins{pack.bonus_pct > 0 ? ` (+${pack.bonus_pct}% bonus)` : ""}
        </p>
      </div>

      <button
        onClick={onBuy}
        disabled={loading}
        className={`w-full py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 transition active:scale-95 ${
          pack.is_popular
            ? "bg-gradient-to-r from-[#22956b] to-[#1a7a58] text-white shadow-lg shadow-[#22956b]/25"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <ShoppingCart className="w-3.5 h-3.5" />
            {euros} €
          </>
        )}
      </button>
    </div>
  );
}

/* ── TransactionRow ───────────────────────────────────────────────────── */
function TransactionRow({ tx }: { tx: Transaction }) {
  const isPositive = tx.amount > 0;

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg shrink-0">
        {TX_ICONS[tx.type] ?? "💫"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
        <p className="text-xs text-gray-400">
          {format(new Date(tx.created_at), "d MMM · HH:mm", { locale: fr })}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-black ${isPositive ? "text-[#22956b]" : "text-red-500"}`}>
          {isPositive ? "+" : ""}{tx.amount} SC
        </p>
        <p className="text-[10px] text-gray-400">{tx.balance_after} SC</p>
      </div>
    </div>
  );
}
