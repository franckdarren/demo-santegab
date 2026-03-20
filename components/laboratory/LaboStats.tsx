// ============================================================
// LABO STATS — KPIs en haut de la page laboratoire
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FlaskConical, CheckCircle, AlertTriangle } from "lucide-react";

interface LaboStatsProps {
  stats: {
    enAttente: number;
    enCours: number;
    valides: number;
    urgents: number;
  };
}

export function LaboStats({ stats }: LaboStatsProps) {
  const cards = [
    {
      titre: "En attente",
      valeur: stats.enAttente.toString(),
      description: "Demandes à traiter",
      icon: Clock,
      couleur: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      titre: "En cours",
      valeur: stats.enCours.toString(),
      description: "Analyses en cours",
      icon: FlaskConical,
      couleur: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      titre: "Validés",
      valeur: stats.valides.toString(),
      description: "Résultats validés",
      icon: CheckCircle,
      couleur: "text-green-600",
      bg: "bg-green-50",
    },
    {
      titre: "Urgents",
      valeur: stats.urgents.toString(),
      description: "Examens urgents en cours",
      icon: AlertTriangle,
      couleur: "text-red-600",
      bg: "bg-red-50",
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