// ============================================================
// STATS CARDS — 4 KPIs principaux en haut du dashboard
// ============================================================

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Stethoscope,
  Receipt,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalPatients: number;
    consultationsAujourdhui: number;
    consultationsMois: number;
    revenusMois: number;
    consultationsEnAttente: number;
    consultationsEnCours: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      titre: "Patients enregistrés",
      valeur: stats.totalPatients.toString(),
      description: "Total dans l'établissement",
      icon: Users,
      couleur: "text-blue-600",
      bg: "bg-blue-50",
      badge: null,
    },
    {
      titre: "Consultations aujourd'hui",
      valeur: stats.consultationsAujourdhui.toString(),
      description: `${stats.consultationsMois} ce mois-ci`,
      icon: Stethoscope,
      couleur: "text-green-600",
      bg: "bg-green-50",
      badge: stats.consultationsEnCours > 0
        ? { label: `${stats.consultationsEnCours} en cours`, color: "bg-green-100 text-green-700" }
        : null,
    },
    {
      titre: "En salle d'attente",
      valeur: stats.consultationsEnAttente.toString(),
      description: "Patients en attente aujourd'hui",
      icon: Clock,
      couleur: "text-orange-600",
      bg: "bg-orange-50",
      badge: stats.consultationsEnAttente > 3
        ? { label: "Affluence", color: "bg-orange-100 text-orange-700" }
        : null,
    },
    {
      titre: "Revenus du mois",
      valeur: formatCurrency(stats.revenusMois),
      description: "Part patient encaissée",
      icon: Receipt,
      couleur: "text-purple-600",
      bg: "bg-purple-50",
      badge: null,
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
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-500">{card.description}</p>
                {card.badge && (
                  <Badge className={`text-[10px] py-0 px-1.5 ${card.badge.color}`}>
                    {card.badge.label}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}