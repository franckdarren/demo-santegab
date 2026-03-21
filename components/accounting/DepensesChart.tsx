"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

const CATEGORIE_LABELS: Record<string, string> = {
  SALAIRES:     "Salaires",
  MEDICAMENTS:  "Médicaments",
  EQUIPEMENT:   "Équipement",
  LOYER:        "Loyer",
  ELECTRICITE:  "Électricité",
  EAU:          "Eau",
  TELEPHONE:    "Téléphone",
  FOURNITURES:  "Fournitures",
  MAINTENANCE:  "Maintenance",
  AUTRE:        "Autre",
};

const COLORS = [
  "#1d4ed8", "#0891b2", "#059669", "#d97706",
  "#7c3aed", "#db2777", "#ea580c", "#65a30d",
  "#0284c7", "#6b7280",
];

interface DepensesChartProps {
  data: Array<{ categorie: string; montant: number }>;
}

export function DepensesChart({ data }: DepensesChartProps) {
  const dataLabelled = data.map((d) => ({
    ...d,
    label: CATEGORIE_LABELS[d.categorie] ?? d.categorie,
  }));

  if (data.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-800">
            Dépenses par catégorie
          </CardTitle>
          <CardDescription className="text-xs">Ce mois-ci</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-sm text-gray-400">Aucune dépense ce mois</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-800">
          Dépenses par catégorie
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Ce mois-ci
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
              formatter={(value) => [formatCurrency(Number(value)), ""]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 10 }}
              formatter={(value) => CATEGORIE_LABELS[value] ?? value}
            />
            <Pie
              data={dataLabelled}
              dataKey="montant"
              nameKey="categorie"
              cx="50%"
              cy="42%"
              innerRadius={45}
              outerRadius={70}
              strokeWidth={2}
            >
              {dataLabelled.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}