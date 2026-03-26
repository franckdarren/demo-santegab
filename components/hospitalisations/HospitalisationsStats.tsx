// ============================================================
// STATS HOSPITALISATIONS — KPIs en haut de page
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, LogOut, TrendingUp, DoorOpen } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface HospitalisationsStatsProps {
  stats: {
    enCours:            number;
    sorties:            number;
    totalMois:          number;
    chambresDisponibles: number;
  };
}

export function HospitalisationsStats({ stats }: HospitalisationsStatsProps) {
  const cards = [
    {
      titre:       "En cours",
      valeur:      stats.enCours.toString(),
      description: "Patients hospitalisés",
      icon:        BedDouble,
      couleur:     "text-blue-600",
      bg:          "bg-blue-50",
    },
    {
      titre:       "Chambres disponibles",
      valeur:      stats.chambresDisponibles.toString(),
      description: "Lits libres",
      icon:        DoorOpen,
      couleur:     "text-green-600",
      bg:          "bg-green-50",
    },
    {
      titre:       "Sorties ce mois",
      valeur:      stats.sorties.toString(),
      description: "Patients sortis",
      icon:        LogOut,
      couleur:     "text-orange-600",
      bg:          "bg-orange-50",
    },
    {
      titre:       "Recettes hospit.",
      valeur:      formatCurrency(stats.totalMois),
      description: "Encaissé ce mois",
      icon:        TrendingUp,
      couleur:     "text-purple-600",
      bg:          "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.titre} className="border border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.titre}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.couleur}`} />
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-2xl font-bold text-gray-900">{card.valeur}</p>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}