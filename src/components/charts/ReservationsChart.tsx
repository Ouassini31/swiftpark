"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface DataPoint {
  day: string;
  completed: number;
  cancelled: number;
  active: number;
}

export default function ReservationsChart({ data }: { data: DataPoint[] }) {
  const reversed = [...data].reverse();

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={reversed} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
          labelFormatter={(d) => format(parseISO(d as string), "d MMMM yyyy", { locale: fr })}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="completed" name="Terminées" fill="#1da45f" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cancelled" name="Annulées"  fill="#f87171" radius={[4, 4, 0, 0]} />
        <Bar dataKey="active"    name="En cours"  fill="#60a5fa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
