"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface ActiviteChartProps {
  data: Array<{
    date: string;
    consultations: number;
    examens: number;
  }>;
}

export function ActiviteChart({ data }: ActiviteChartProps) {
  // Affiche seulement 1 point sur 3 pour éviter la surcharge
  const dataFiltered = data.filter((_, i) => i % 3 === 0 || i === data.length - 1);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-800">
          Activité médicale
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Consultations et examens — 30 derniers jours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={dataFiltered}
            margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="colorConsultations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExamens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
              formatter={(value) => [String(value), ""]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Area
              type="monotone"
              dataKey="consultations"
              name="Consultations"
              stroke="#1d4ed8"
              strokeWidth={2}
              fill="url(#colorConsultations)"
            />
            <Area
              type="monotone"
              dataKey="examens"
              name="Examens labo"
              stroke="#0891b2"
              strokeWidth={2}
              fill="url(#colorExamens)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}