import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PharmacieStatsProps {
  stats: {
    totalArticles: number;
    articlesEnAlerte: number;
    articlesRupture: number;
    valeurTotale: number;
  };
}

export function PharmacieStats({ stats }: PharmacieStatsProps) {
  const cards = [
    {
      titre: "Articles en stock",
      valeur: stats.totalArticles.toString(),
      description: "Médicaments et consommables actifs",
      icon: Package,
      couleur: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      titre: "Alertes de seuil",
      valeur: stats.articlesEnAlerte.toString(),
      description: "Sous le seuil critique",
      icon: AlertTriangle,
      couleur: stats.articlesEnAlerte > 0 ? "text-orange-600" : "text-green-600",
      bg: stats.articlesEnAlerte > 0 ? "bg-orange-50" : "bg-green-50",
    },
    {
      titre: "En rupture",
      valeur: stats.articlesRupture.toString(),
      description: "Stock à zéro — réapprovisionnement urgent",
      icon: XCircle,
      couleur: stats.articlesRupture > 0 ? "text-red-600" : "text-green-600",
      bg: stats.articlesRupture > 0 ? "bg-red-50" : "bg-green-50",
    },
    {
      titre: "Valeur du stock",
      valeur: formatCurrency(stats.valeurTotale),
      description: "Valeur totale des articles en stock",
      icon: TrendingUp,
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