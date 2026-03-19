"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface AssuranceChartProps {
  data: { nom: string; montant: number }[];
}

const COLORS = ["#1d4ed8", "#0891b2", "#059669", "#d97706", "#7c3aed"];

export function AssuranceChart({ data }: AssuranceChartProps) {
  const totalMois = data.reduce((sum, d) => sum + d.montant, 0);

  if (data.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-800">Revenus par assurance</CardTitle>
          <CardDescription className="text-xs">Ce mois-ci</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[220px]">
          <p className="text-sm text-gray-400">Aucune donnée ce mois</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-800">
          Revenus par assurance
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Total : {formatCurrency(totalMois)} ce mois
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(value) => [formatCurrency(Number(value)), ""]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Pie data={data} dataKey="montant" nameKey="nom" cx="50%" cy="45%" innerRadius={50} outerRadius={75} strokeWidth={2}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}