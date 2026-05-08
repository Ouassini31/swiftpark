import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ListOrdered } from "lucide-react";

type Reservation = {
  id: string;
  finder_name: string | null;
  finder_username: string | null;
  sharer_name: string | null;
  sharer_username: string | null;
  address: string | null;
  lat: number;
  lng: number;
  status: string;
  coin_amount: number;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  reserved:  "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  expired:   "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  reserved:  "Réservée",
  completed: "Terminée",
  cancelled: "Annulée",
  expired:   "Expirée",
};

export default async function AdminReservationsPage() {
  const supabase = await createClient();

  const { data: rawData } = await supabase
    .from("admin_reservations" as never)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const reservations = (rawData ?? []) as unknown as Reservation[];

  const total     = reservations.length;
  const completed = reservations.filter((r) => r.status === "completed").length;
  const totalSC   = reservations.filter((r) => r.status === "completed").reduce((a, r) => a + r.coin_amount, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Réservations</h1>
        <p className="text-gray-500 text-sm mt-1">{total} réservations au total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-2xl font-black text-gray-900">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-2xl font-black text-green-600">{completed}</p>
          <p className="text-xs text-gray-500 mt-0.5">Terminées</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-2xl font-black text-[#22956b]">{totalSC} SC</p>
          <p className="text-xs text-gray-500 mt-0.5">Échangés</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Toutes les réservations</h2>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ListOrdered className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Aucune réservation pour l'instant</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-3 text-left">Finder</th>
                  <th className="px-5 py-3 text-left">Sharer</th>
                  <th className="px-5 py-3 text-left">Adresse</th>
                  <th className="px-5 py-3 text-left">SC</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      {r.finder_name ?? r.finder_username ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {r.sharer_name ?? r.sharer_username ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs max-w-[180px] truncate">
                      {r.address ?? `${r.lat?.toFixed(4)}, ${r.lng?.toFixed(4)}`}
                    </td>
                    <td className="px-5 py-3.5 font-black text-[#22956b]">{r.coin_amount} SC</td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {format(new Date(r.created_at), "d MMM · HH:mm", { locale: fr })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status] ?? STATUS_COLORS.expired}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
