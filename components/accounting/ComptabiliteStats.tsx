import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Scale, Calendar } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface ComptabiliteStatsProps {
  stats: {
    recettesMois: number;
    depensesMois: number;
    beneficeMois: number;
    nombreRecettes: number;
    nombreDepenses: number;
    recettesAnnee: number;
    depensesAnnee: number;
    beneficeAnnee: number;
  };
}

export function ComptabiliteStats({ stats }: ComptabiliteStatsProps) {
  const cards = [
    {
      titre: "Recettes ce mois",
      valeur: formatCurrency(stats.recettesMois),
      description: `${stats.nombreRecettes} transaction${stats.nombreRecettes > 1 ? "s" : ""}`,
      icon: TrendingUp,
      couleur: "text-green-600",
      bg: "bg-green-50",
    },
    {
      titre: "Dépenses ce mois",
      valeur: formatCurrency(stats.depensesMois),
      description: `${stats.nombreDepenses} transaction${stats.nombreDepenses > 1 ? "s" : ""}`,
      icon: TrendingDown,
      couleur: "text-red-600",
      bg: "bg-red-50",
    },
    {
      titre: "Bénéfice ce mois",
      valeur: formatCurrency(stats.beneficeMois),
      description: stats.beneficeMois >= 0 ? "Résultat positif" : "Résultat négatif",
      icon: Scale,
      couleur: stats.beneficeMois >= 0 ? "text-blue-600" : "text-orange-600",
      bg: stats.beneficeMois >= 0 ? "bg-blue-50" : "bg-orange-50",
    },
    {
      titre: "Bénéfice annuel",
      valeur: formatCurrency(stats.beneficeAnnee),
      description: "Depuis le 1er janvier",
      icon: Calendar,
      couleur: stats.beneficeAnnee >= 0 ? "text-purple-600" : "text-red-600",
      bg: stats.beneficeAnnee >= 0 ? "bg-purple-50" : "bg-red-50",
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
              <p className={cn(
                "text-xl font-bold",
                card.titre.includes("Bénéfice") && stats.beneficeMois < 0
                  ? "text-red-600"
                  : "text-gray-900"
              )}>
                {card.valeur}
              </p>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}