import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  reserved:  "bg-blue-100 text-blue-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-500",
  expired:   "bg-yellow-100 text-yellow-700",
};

export default async function AdminSpotsPage() {
  const supabase = await createClient();

  type Spot = {
    id: string; address: string; city: string; lat: number; lng: number;
    coin_price: number; vehicle_type: string; is_covered: boolean; is_handicap: boolean;
    expires_at: string; status: string;
    sharer_name: string; sharer_username: string; sharer_rating: number;
  };

  const { data: spotsRaw } = await supabase
    .from("active_spots_detail")
    .select("*")
    .limit(100);

  const { data: allSpotsRaw } = await supabase
    .from("parking_spots")
    .select("status")
    .limit(1000);

  const spots    = (spotsRaw    ?? []) as unknown as Spot[];
  const allSpots = (allSpotsRaw ?? []) as unknown as { status: string }[];

  const counts = allSpots.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Places de stationnement</h1>
        <p className="text-gray-500 text-sm mt-1">Suivi des places en temps réel</p>
      </div>

      {/* Stats par statut */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-500"}`}>
              {status}
            </span>
            <span className="text-sm font-black text-gray-900">{count}</span>
          </div>
        ))}
      </div>

      {/* Table des places actives */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-600" />
          <h2 className="font-bold text-gray-900">Places disponibles ({spots?.length ?? 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Adresse", "Partageur", "Prix", "Véhicule", "Options", "Expire", "Statut"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(spots ?? []).map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-gray-800 truncate">{s.address ?? `${Number(s.lat).toFixed(4)}, ${Number(s.lng).toFixed(4)}`}</p>
                    {s.city && <p className="text-xs text-gray-400">{s.city}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700">{s.sharer_name ?? s.sharer_username}</p>
                    {s.sharer_rating && (
                      <p className="text-xs text-gray-400">★ {Number(s.sharer_rating).toFixed(1)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-swiftcoin-600">{s.coin_price} SC</td>
                  <td className="px-4 py-3 text-gray-600">{s.vehicle_type ?? "car"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {s.is_covered  && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Couvert</span>}
                      {s.is_handicap && <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">PMR</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {format(new Date(s.expires_at), "HH:mm", { locale: fr })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] ?? ""}`}>
                      {s.status}
                    </span>
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
