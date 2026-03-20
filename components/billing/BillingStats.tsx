// ============================================================
// BILLING STATS — KPIs facturation en haut de page
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Clock, TrendingUp, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BillingStatsProps {
  stats: {
    montantEnAttente: number;
    nombreEnAttente: number;
    encaisseMois: number;
    totalFacturesMois: number;
  };
}

export function BillingStats({ stats }: BillingStatsProps) {
  const cards = [
    {
      titre: "Encaissé ce mois",
      valeur: formatCurrency(stats.encaisseMois),
      description: `${stats.totalFacturesMois} facture${stats.totalFacturesMois > 1 ? "s" : ""} émise${stats.totalFacturesMois > 1 ? "s" : ""}`,
      icon: TrendingUp,
      couleur: "text-green-600",
      bg: "bg-green-50",
    },
    {
      titre: "En attente de paiement",
      valeur: formatCurrency(stats.montantEnAttente),
      description: `${stats.nombreEnAttente} facture${stats.nombreEnAttente > 1 ? "s" : ""} impayée${stats.nombreEnAttente > 1 ? "s" : ""}`,
      icon: Clock,
      couleur: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      titre: "Factures ce mois",
      valeur: stats.totalFacturesMois.toString(),
      description: "Total émises ce mois",
      icon: FileText,
      couleur: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      titre: "Part assurance",
      valeur: "Calculée auto",
      description: "Par patient à l'enregistrement",
      icon: Receipt,
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