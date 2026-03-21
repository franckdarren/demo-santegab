"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface StatsFinancieresProps {
  stats: {
    revenusMensuels: Array<{ mois: string; revenus: number }>;
    facturesMois: number;
    facturesEnAttente: number;
    revenusMois: number;
  };
}

export function StatsFinancieres({ stats }: StatsFinancieresProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-800">
          Revenus mensuels
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          6 derniers mois · Part patient encaissée
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={stats.revenusMensuels}
            margin={{ top: 5, right: 5, bottom: 0, left: -20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="mois"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(value) => [formatCurrency(Number(value)), "Revenus"]}
            />
            <Bar dataKey="revenus" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* KPIs financiers */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">
              {stats.facturesMois}
            </p>
            <p className="text-xs text-gray-400">Factures ce mois</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-600">
              {stats.facturesEnAttente}
            </p>
            <p className="text-xs text-gray-400">En attente</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(stats.revenusMois)}
            </p>
            <p className="text-xs text-gray-400">Encaissé ce mois</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}