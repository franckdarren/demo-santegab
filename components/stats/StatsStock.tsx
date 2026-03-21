import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface StatsStockProps {
  stats: {
    articles: Array<{
      id: string;
      nom: string;
      quantite_stock: number;
      seuil_alerte: number;
      unite: string;
      prix_unitaire: number;
    }>;
    totalArticles: number;
    articlesEnAlerte: number;
    articlesRupture: number;
  };
}

export function StatsStock({ stats }: StatsStockProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-800">
              État des stocks
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Articles nécessitant une attention
            </CardDescription>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">
                {stats.totalArticles}
              </p>
              <p className="text-xs text-gray-400">Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">
                {stats.articlesEnAlerte}
              </p>
              <p className="text-xs text-gray-400">Alertes</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">
                {stats.articlesRupture}
              </p>
              <p className="text-xs text-gray-400">Ruptures</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {stats.articles.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-400">Aucun article enregistré</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.articles.map((article) => {
              const enRupture = article.quantite_stock === 0;
              const enAlerte = article.quantite_stock <= article.seuil_alerte;
              const pourcentage = Math.min(
                (article.quantite_stock / Math.max(article.seuil_alerte * 4, 1)) * 100,
                100
              );

              return (
                <div
                  key={article.id}
                  className="flex items-center gap-4 px-5 py-3"
                >
                  {/* Icône */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    enRupture ? "bg-red-100" : enAlerte ? "bg-orange-100" : "bg-gray-100"
                  )}>
                    {enAlerte ? (
                      <AlertTriangle className={cn(
                        "h-4 w-4",
                        enRupture ? "text-red-600" : "text-orange-600"
                      )} />
                    ) : (
                      <Package className="h-4 w-4 text-gray-400" />
                    )}
                  </div>

                  {/* Nom */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {article.nom}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            enRupture ? "bg-red-500" : enAlerte ? "bg-orange-400" : "bg-green-500"
                          )}
                          style={{ width: `${pourcentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-sm font-bold",
                      enRupture ? "text-red-600" : enAlerte ? "text-orange-600" : "text-gray-700"
                    )}>
                      {article.quantite_stock} {article.unite}s
                    </p>
                    <p className="text-xs text-gray-400">
                      seuil : {article.seuil_alerte}
                    </p>
                  </div>

                  {/* Badge */}
                  {enRupture ? (
                    <Badge className="text-[10px] bg-red-100 text-red-700 border-0 shrink-0">
                      Rupture
                    </Badge>
                  ) : enAlerte ? (
                    <Badge className="text-[10px] bg-orange-100 text-orange-700 border-0 shrink-0">
                      Alerte
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] bg-green-100 text-green-700 border-0 shrink-0">
                      OK
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}