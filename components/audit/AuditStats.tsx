import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, LogIn, Shield, Users } from "lucide-react";

interface AuditStatsProps {
  stats: {
    totalAujourdhui: number;
    connexionsAujourdhui: number;
    actionsCarnet: number;
    utilisateursActifsAujourdhui: number;
  };
}

export function AuditStats({ stats }: AuditStatsProps) {
  const cards = [
    {
      titre: "Actions aujourd'hui",
      valeur: stats.totalAujourdhui.toString(),
      description: "Toutes actions confondues",
      icon: Activity,
      couleur: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      titre: "Connexions",
      valeur: stats.connexionsAujourdhui.toString(),
      description: "Connexions aujourd'hui",
      icon: LogIn,
      couleur: "text-green-600",
      bg: "bg-green-50",
    },
    {
      titre: "Accès carnets",
      valeur: stats.actionsCarnet.toString(),
      description: "Sur les 24 dernières heures",
      icon: Shield,
      couleur: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      titre: "Utilisateurs actifs",
      valeur: stats.utilisateursActifsAujourdhui.toString(),
      description: "Connectés aujourd'hui",
      icon: Users,
      couleur: "text-purple-600",
      bg: "bg-purple-50",
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