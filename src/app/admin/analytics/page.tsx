import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";

const RevenueChart      = dynamic(() => import("@/components/charts/RevenueChart"),      { ssr: false });
const ReservationsChart = dynamic(() => import("@/components/charts/ReservationsChart"), { ssr: false });

export default async function AnalyticsPage() {
  const supabase = await createClient();

  type TxRow  = { day: string; volume_sc: number; commission_sc: number; purchases: number };
  type ResRow = { day: string; completed: number; cancelled: number; active: number };

  const [{ data: txRaw }, { data: resRaw }] = await Promise.all([
    supabase.from("daily_transactions").select("*"),
    supabase.from("daily_reservations").select("*"),
  ]);

  const txData  = (txRaw  ?? []) as unknown as TxRow[];
  const resData = (resRaw ?? []) as unknown as ResRow[];

  // Calculs globaux 30j
  const totalVolume     = txData.reduce((a, d) => a + (d.volume_sc ?? 0), 0);
  const totalCommission = txData.reduce((a, d) => a + (d.commission_sc ?? 0), 0);
  const totalCompleted  = resData.reduce((a, d) => a + (d.completed ?? 0), 0);
  const totalCancelled  = resData.reduce((a, d) => a + (d.cancelled ?? 0), 0);
  const completionRate  = totalCompleted + totalCancelled > 0
    ? Math.round((totalCompleted / (totalCompleted + totalCancelled)) * 100)
    : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">30 derniers jours</p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Volume total",   value: `${totalVolume.toLocaleString()} SC`,     color: "text-brand-600",      bg: "bg-brand-50" },
          { label: "Commission",     value: `${totalCommission.toLocaleString()} SC`, color: "text-swiftcoin-600",  bg: "bg-swiftcoin-50" },
          { label: "Complétées",     value: totalCompleted.toLocaleString(),           color: "text-green-600",      bg: "bg-green-50" },
          { label: "Taux complétion", value: `${completionRate}%`,                    color: "text-purple-600",     bg: "bg-purple-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-5">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Graphique revenus */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="mb-4">
          <h2 className="font-bold text-gray-900">Volume & Commission SwiftCoins</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-1 bg-brand-500 rounded inline-block" /> Volume
            </span>
            <span className="inline-flex items-center gap-1 ml-3">
              <span className="w-3 h-1 bg-swiftcoin-500 rounded inline-block" /> Commission
            </span>
          </p>
        </div>
        <RevenueChart data={txData.map((d) => ({
          day: d.day,
          volume_sc: Number(d.volume_sc ?? 0),
          commission_sc: Number(d.commission_sc ?? 0),
          purchases: Number(d.purchases ?? 0),
        }))} />
      </div>

      {/* Graphique réservations */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-4">
          <h2 className="font-bold text-gray-900">Réservations par jour</h2>
        </div>
        <ReservationsChart data={resData.map((d) => ({
          day: d.day,
          completed: Number(d.completed ?? 0),
          cancelled: Number(d.cancelled ?? 0),
          active:    Number(d.active ?? 0),
        }))} />
      </div>
    </div>
  );
}
