import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Banknote, Clock, CheckCircle, XCircle } from "lucide-react";

type WithdrawalRequest = {
  id: string;
  user_id: string;
  amount_sc: number;
  amount_eur: number;
  iban: string;
  account_name: string;
  status: "pending" | "processing" | "completed" | "rejected";
  created_at: string;
  processed_at: string | null;
  profiles: { username: string; full_name: string | null } | null;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending:    { bg: "bg-amber-100",  text: "text-amber-700",  icon: <Clock className="w-3.5 h-3.5" /> },
  processing: { bg: "bg-blue-100",   text: "text-blue-700",   icon: <Clock className="w-3.5 h-3.5" /> },
  completed:  { bg: "bg-green-100",  text: "text-green-700",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected:   { bg: "bg-red-100",    text: "text-red-700",    icon: <XCircle className="w-3.5 h-3.5" /> },
};

const STATUS_LABELS: Record<string, string> = {
  pending:    "En attente",
  processing: "En cours",
  completed:  "Virée",
  rejected:   "Rejetée",
};

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient();

  const { data: requestsRaw } = await supabase
    .from("withdrawal_requests" as never)
    .select("*, profiles(username, full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  const requests = (requestsRaw ?? []) as unknown as WithdrawalRequest[];

  const pending   = requests.filter((r) => r.status === "pending").length;
  const totalEur  = requests.filter((r) => r.status === "completed").reduce((a, r) => a + r.amount_eur, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Demandes de retrait</h1>
        <p className="text-gray-500 text-sm mt-1">{requests.length} demandes · {pending} en attente</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{pending}</p>
          <p className="text-xs text-gray-500 mt-0.5">En attente</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{requests.filter((r) => r.status === "completed").length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Virements effectués</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="w-9 h-9 bg-[#e8f5ef] rounded-xl flex items-center justify-center mb-3">
            <Banknote className="w-4 h-4 text-[#22956b]" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalEur.toFixed(0)}€</p>
          <p className="text-xs text-gray-500 mt-0.5">Total versé</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Toutes les demandes</h2>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Banknote className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucune demande pour l'instant</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-3 text-left">Utilisateur</th>
                  <th className="px-5 py-3 text-left">Montant</th>
                  <th className="px-5 py-3 text-left">IBAN</th>
                  <th className="px-5 py-3 text-left">Titulaire</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((r) => {
                  const style = STATUS_STYLES[r.status] ?? STATUS_STYLES.pending;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">
                          {r.profiles?.full_name ?? r.profiles?.username ?? "—"}
                        </p>
                        <p className="text-xs text-gray-400">@{r.profiles?.username}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-black text-[#22956b]">{r.amount_eur}€</p>
                        <p className="text-xs text-gray-400">{r.amount_sc} SC</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg inline-block">
                          {r.iban.slice(0, 4)}···{r.iban.slice(-4)}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{r.account_name}</td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {format(new Date(r.created_at), "d MMM yyyy · HH:mm", { locale: fr })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                          {style.icon}
                          {STATUS_LABELS[r.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Pour valider un virement, effectue le virement SEPA manuellement puis mets à jour le statut dans Supabase.
      </p>
    </div>
  );
}
