"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface DataPoint {
  day: string;
  volume_sc: number;
  commission_sc: number;
  purchases: number;
}

export default function RevenueChart({ data }: { data: DataPoint[] }) {
  const reversed = [...data].reverse();

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={reversed} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#1da45f" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1da45f" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradCommission" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="day"
          tickFormatter={(d) => format(parseISO(d), "d MMM", { locale: fr })}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
          labelFormatter={(d) => format(parseISO(d as string), "d MMMM yyyy", { locale: fr })}
          formatter={(value: number, name: string) => [
            `${value} SC`,
            name === "volume_sc" ? "Volume total" : "Commission",
          ]}
        />
        <Area type="monotone" dataKey="volume_sc"     stroke="#1da45f" strokeWidth={2} fill="url(#gradVolume)" />
        <Area type="monotone" dataKey="commission_sc" stroke="#f59e0b" strokeWidth={2} fill="url(#gradCommission)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
