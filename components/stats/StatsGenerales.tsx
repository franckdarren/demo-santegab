import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Stethoscope, FlaskConical, ScanLine,
  TrendingUp, TrendingDown, UserPlus,
} from "lucide-react";

interface StatsGeneralesProps {
  stats: {
    totalPatients: number;
    nouveauxPatientsMois: number;
    totalConsultationsMois: number;
    evolutionConsultations: number;
    totalExamensLabo: number;
    totalExamensImagerie: number;
  };
}

export function StatsGenerales({ stats }: StatsGeneralesProps) {
  const cards = [
    {
      titre: "Total patients",
      valeur: stats.totalPatients.toString(),
      description: `+${stats.nouveauxPatientsMois} ce mois`,
      icon: Users,
      couleur: "text-blue-600",
      bg: "bg-blue-50",
      badge: null,
    },
    {
      titre: "Consultations ce mois",
      valeur: stats.totalConsultationsMois.toString(),
      description: "vs mois précédent",
      icon: Stethoscope,
      couleur: "text-green-600",
      bg: "bg-green-50",
      badge: {
        label: `${stats.evolutionConsultations > 0 ? "+" : ""}${stats.evolutionConsultations}%`,
        color: stats.evolutionConsultations >= 0
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700",
        icon: stats.evolutionConsultations >= 0 ? TrendingUp : TrendingDown,
      },
    },
    {
      titre: "Examens labo ce mois",
      valeur: stats.totalExamensLabo.toString(),
      description: "Demandes enregistrées",
      icon: FlaskConical,
      couleur: "text-cyan-600",
      bg: "bg-cyan-50",
      badge: null,
    },
    {
      titre: "Examens imagerie",
      valeur: stats.totalExamensImagerie.toString(),
      description: "Radios, écho, scanners",
      icon: ScanLine,
      couleur: "text-violet-600",
      bg: "bg-violet-50",
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
                  <Badge className={`text-[10px] border-0 flex items-center gap-0.5 ${card.badge.color}`}>
                    <card.badge.icon className="h-2.5 w-2.5" />
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