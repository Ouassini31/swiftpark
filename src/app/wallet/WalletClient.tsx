"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TrendingUp, TrendingDown, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCoins } from "@/lib/utils";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Transaction = Database["public"]["Tables"]["coin_transactions"]["Row"];

const TX_ICONS: Record<string, string> = {
  earn: "💰", spend: "🔑", commission: "🏦", refund: "↩️", bonus: "🎁",
};

export default function WalletClient({
  profile, transactions,
}: {
  profile: Profile | null;
  transactions: Transaction[];
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header dégradé */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 pt-12 pb-8 px-5">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/map" className="p-2 bg-white/20 rounded-xl text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white font-black text-xl">Wallet SwiftCoins</h1>
        </div>

        {/* Solde principal */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Star className="w-7 h-7 fill-swiftcoin-400 text-swiftcoin-400" />
            <span className="text-5xl font-black text-white">
              {profile?.coin_balance ?? 0}
            </span>
          </div>
          <p className="text-white/70 text-sm">SwiftCoins disponibles</p>
        </div>

        {/* Stats gains / dépenses */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-green-300 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Gagnés</span>
            </div>
            <p className="text-white font-bold">{formatCoins(profile?.coins_earned ?? 0)}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-red-300 mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium">Dépensés</span>
            </div>
            <p className="text-white font-bold">{formatCoins(profile?.coins_spent ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
          Historique
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune transaction pour l'instant</p>
            <p className="text-xs mt-1">Partagez ou trouvez une place pour commencer !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isPositive = tx.amount > 0;

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
        {TX_ICONS[tx.type] ?? "💫"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
        <p className="text-xs text-gray-400">
          {format(new Date(tx.created_at), "d MMM yyyy · HH:mm", { locale: fr })}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-black ${isPositive ? "text-brand-600" : "text-red-500"}`}>
          {isPositive ? "+" : ""}{tx.amount} SC
        </p>
        <p className="text-[10px] text-gray-400">Solde : {tx.balance_after} SC</p>
      </div>
    </div>
  );
}
