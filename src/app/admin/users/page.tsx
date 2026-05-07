import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, Star, Shield } from "lucide-react";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  type UserProfile = {
    id: string; username: string; full_name: string; role: string;
    coin_balance: number; spots_shared: number; spots_found: number;
    rating: number; rating_count: number; is_active: boolean; created_at: string;
  };

  const { data: usersRaw } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const users = (usersRaw ?? []) as unknown as UserProfile[];

  const total       = users?.length ?? 0;
  const admins      = users?.filter((u) => u.role === "admin").length ?? 0;
  const active      = users?.filter((u) => u.is_active).length ?? 0;
  const totalCoins  = users?.reduce((a, u) => a + u.coin_balance, 0) ?? 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Utilisateurs</h1>
        <p className="text-gray-500 text-sm mt-1">{total} comptes enregistrés</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",       value: total,       color: "text-gray-900"       },
          { label: "Actifs",      value: active,      color: "text-green-600"      },
          { label: "Admins",      value: admins,      color: "text-purple-600"     },
          { label: "SC distribués", value: `${totalCoins.toLocaleString("fr-FR")} SC`, color: "text-swiftcoin-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-4">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Utilisateur", "Rôle", "Solde SC", "Partagées", "Trouvées", "Note", "Inscrit le"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(users ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center text-xs font-black text-brand-600 shrink-0">
                        {(u.full_name ?? u.username)[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{u.full_name ?? u.username}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {u.role === "admin" && <Shield className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-swiftcoin-600">{u.coin_balance} SC</td>
                  <td className="px-4 py-3 text-gray-600">{u.spots_shared}</td>
                  <td className="px-4 py-3 text-gray-600">{u.spots_found}</td>
                  <td className="px-4 py-3">
                    {u.rating ? (
                      <span className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-swiftcoin-400 text-swiftcoin-400" />
                        {Number(u.rating).toFixed(1)}
                        <span className="text-gray-400">({u.rating_count})</span>
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {format(new Date(u.created_at), "d MMM yyyy", { locale: fr })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
