import { createClient } from "@/lib/supabase/server";
import {
  Users, MapPin, ListOrdered, Coins,
  TrendingUp, CheckCircle, Clock, XCircle,
} from "lucide-react";

interface KPIs {
  users_total: number;
  users_today: number;
  spots_active: number;
  spots_today: number;
  reservations_total: number;
  reservations_today: number;
  completed_today: number;
  revenue_sc_today: number;
  revenue_sc_month: number;
  coins_circulating: number;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: kpis } = await supabase.rpc("admin_get_kpis") as { data: KPIs | null };

  type Reservation = {
    id: string; finder_name: string; finder_username: string;
    sharer_name: string; sharer_username: string;
    address: string; lat: number; lng: number;
    status: string; coin_amount: number;
  };
  type UserRow = {
    id: string; username: string; full_name: string;
    coin_balance: number; created_at: string;
    spots_shared: number; spots_found: number;
  };

  // Dernières réservations
  const { data: latestReservationsRaw } = await supabase
    .from("admin_reservations")
    .select("*")
    .limit(8);

  // Derniers utilisateurs
  const { data: latestUsersRaw } = await supabase
    .from("profiles")
    .select("id, username, full_name, coin_balance, created_at, spots_shared, spots_found")
    .order("created_at", { ascending: false })
    .limit(6);

  const latestReservations = (latestReservationsRaw ?? []) as unknown as Reservation[];
  const latestUsers        = (latestUsersRaw        ?? []) as unknown as UserRow[];

  const k = kpis ?? {} as KPIs;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Vue globale de SwiftPark en temps réel</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50"
          label="Utilisateurs"
          value={k.users_total?.toLocaleString("fr-FR") ?? "—"}
          sub={`+${k.users_today ?? 0} aujourd'hui`}
          subColor="text-blue-600"
        />
        <KpiCard
          icon={<MapPin className="w-5 h-5 text-brand-600" />}
          bg="bg-brand-50"
          label="Places actives"
          value={k.spots_active?.toLocaleString("fr-FR") ?? "—"}
          sub={`+${k.spots_today ?? 0} aujourd'hui`}
          subColor="text-brand-600"
        />
        <KpiCard
          icon={<ListOrdered className="w-5 h-5 text-purple-600" />}
          bg="bg-purple-50"
          label="Réservations"
          value={k.reservations_total?.toLocaleString("fr-FR") ?? "—"}
          sub={`${k.reservations_today ?? 0} aujourd'hui`}
          subColor="text-purple-600"
        />
        <KpiCard
          icon={<Coins className="w-5 h-5 text-swiftcoin-600" />}
          bg="bg-swiftcoin-50"
          label="SC en circulation"
          value={k.coins_circulating?.toLocaleString("fr-FR") ?? "—"}
          sub="SwiftCoins actifs"
          subColor="text-swiftcoin-600"
        />
      </div>

      {/* Revenue row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          bg="bg-green-50"
          label="Commission aujourd'hui"
          value={`${k.revenue_sc_today ?? 0} SC`}
          sub="25% des transactions"
          subColor="text-green-600"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          bg="bg-green-50"
          label="Commission ce mois"
          value={`${k.revenue_sc_month ?? 0} SC`}
          sub={new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          subColor="text-green-600"
        />
        <KpiCard
          icon={<CheckCircle className="w-5 h-5 text-brand-600" />}
          bg="bg-brand-50"
          label="Complétées auj."
          value={String(k.completed_today ?? 0)}
          sub="transactions validées GPS"
          subColor="text-brand-600"
        />
        <KpiCard
          icon={<Clock className="w-5 h-5 text-orange-500" />}
          bg="bg-orange-50"
          label="Taux complétion"
          value={
            k.reservations_today
              ? `${Math.round((k.completed_today / k.reservations_today) * 100)}%`
              : "—"
          }
          sub="réservations → validées"
          subColor="text-orange-600"
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières réservations */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Dernières réservations</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(latestReservations ?? []).map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {r.finder_name ?? r.finder_username} → {r.sharer_name ?? r.sharer_username}
                  </p>
                  <p className="text-xs text-gray-400 truncate max-w-[200px]">
                    {r.address ?? `${r.lat?.toFixed(4)}, ${r.lng?.toFixed(4)}`}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <StatusBadge status={r.status} />
                  <p className="text-xs text-swiftcoin-600 font-bold mt-0.5">{r.coin_amount} SC</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Derniers utilisateurs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Nouveaux utilisateurs</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(latestUsers ?? []).map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-xs font-black text-brand-600">
                    {(u.full_name ?? u.username)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{u.full_name ?? u.username}</p>
                    <p className="text-xs text-gray-400">@{u.username}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-swiftcoin-600">{u.coin_balance} SC</p>
                  <p className="text-[10px] text-gray-400">
                    🅿 {u.spots_shared} · 🔍 {u.spots_found}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon, bg, label, value, sub, subColor,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  sub: string;
  subColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className={`text-xs font-semibold mt-1 ${subColor}`}>{sub}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  reserved:  "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  expired:   "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? STATUS_COLORS.expired}`}>
      {status}
    </span>
  );
}
