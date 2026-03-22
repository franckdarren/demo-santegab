"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, Plus, Loader2, Package, AlertTriangle, History } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { CategorieArticle, TypeMouvement } from "@/app/generated/prisma/client";
import { NouvelArticleDialog } from "./NouvelArticleDialog";
import { MouvementDialog } from "./MouvementDialog";
import { HistoriqueDialog } from "./HistoriqueDialog";
import { ModifierArticleDialog } from "./ModifierArticleDialog";

const CATEGORIE_LABELS: Record<CategorieArticle, string> = {
  MEDICAMENT: "Médicament",
  CONSOMMABLE: "Consommable",
  EQUIPEMENT: "Équipement",
  AUTRE: "Autre",
};

const CATEGORIE_COLORS: Record<CategorieArticle, string> = {
  MEDICAMENT: "bg-blue-100 text-blue-700",
  CONSOMMABLE: "bg-cyan-100 text-cyan-700",
  EQUIPEMENT: "bg-purple-100 text-purple-700",
  AUTRE: "bg-gray-100 text-gray-700",
};

const FILTRES = [
  { label: "Tous", value: "" },
  { label: "Médicaments", value: "MEDICAMENT" },
  { label: "Consommables", value: "CONSOMMABLE" },
  { label: "⚠️ Alertes", value: "ALERTE" },
];

interface Article {
  id: string;
  nom: string;
  categorie: CategorieArticle;
  description: string | null;
  unite: string;
  quantite_stock: number;
  seuil_alerte: number;
  prix_unitaire: number;
  date_peremption: Date | null;
  code_article: string | null;
  mouvements: Array<{
    id: string;
    type_mouvement: TypeMouvement;
    quantite: number;
    created_at: Date;
    motif: string | null;
  }>;
}

interface Mouvement {
  id: string;
  type_mouvement: TypeMouvement;
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  motif: string | null;
  created_at: Date;
  article: { nom: string; unite: string };
}

interface ArticlesStockListProps {
  articles: Article[];
  mouvements: Mouvement[];
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
  searchQuery: string;
}

export function ArticlesStockList({
  articles,
  mouvements,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  searchQuery,
}: ArticlesStockListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchQuery);
  const [isPending, startTransition] = useTransition();
  const [filtre, setFiltre] = useState("");
  const [dialogNouvel, setDialogNouvel] = useState(false);
  const [dialogHistorique, setDialogHistorique] = useState(false);
  const [articleSelectionne, setArticleSelectionne] = useState<Article | null>(null);

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  // Filtre par catégorie ou alerte
  const articlesFiltres = articles.filter((a) => {
    if (filtre === "ALERTE") return a.quantite_stock <= a.seuil_alerte;
    if (filtre) return a.categorie === filtre;
    return true;
  });

  // Calcule le pourcentage de stock pour la barre de progression
  function getPourcentageStock(article: Article): number {
    const max = Math.max(article.seuil_alerte * 4, article.quantite_stock);
    if (max === 0) return 0;
    return Math.min((article.quantite_stock / max) * 100, 100);
  }

  // Couleur de la barre selon le niveau de stock
  function getStockBarColor(article: Article): string {
    if (article.quantite_stock === 0) return "bg-red-500";
    if (article.quantite_stock <= article.seuil_alerte) return "bg-orange-400";
    return "bg-green-500";
  }

  return (
    <div className="space-y-4">

      {/* Barre d'outils */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un médicament, consommable..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200"
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogHistorique(true)}
          className="border-gray-200 text-gray-600 shrink-0"
        >
          <History className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Historique</span>
        </Button>

        <Button
          type="button"
          onClick={() => setDialogNouvel(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nouvel article</span>
        </Button>
      </div>

      {/* Filtres rapides */}
      <div className="flex gap-2 flex-wrap">
        {FILTRES.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltre(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              filtre === f.value
                ? "bg-blue-700 text-white border-blue-700"
                : "border-gray-200 text-gray-600 hover:border-blue-300 bg-white"
            )}
          >
            {f.label}
            {f.value === "ALERTE" && (
              <span className="ml-1.5 opacity-60">
                ({articles.filter((a) => a.quantite_stock <= a.seuil_alerte).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grille des articles */}
      {articlesFiltres.length === 0 ? (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun article trouvé</p>
            <p className="text-gray-400 text-sm mt-1">
              {search
                ? `Aucun résultat pour "${search}"`
                : "Aucun article enregistré"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {articlesFiltres.map((article) => {
            const enAlerte = article.quantite_stock <= article.seuil_alerte;
            const enRupture = article.quantite_stock === 0;

            return (
              <Card
                key={article.id}
                className={cn(
                  "border shadow-sm transition-shadow hover:shadow-md",
                  enRupture
                    ? "border-red-200 bg-red-50/30"
                    : enAlerte
                      ? "border-orange-200 bg-orange-50/30"
                      : "border-gray-200"
                )}
              >
                <CardContent className="p-4 space-y-3">

                  {/* Header article */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {article.nom}
                      </p>
                      {article.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {article.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      {enRupture && (
                        <Badge className="text-[10px] bg-red-100 text-red-700 border-0">
                          Rupture
                        </Badge>
                      )}
                      {enAlerte && !enRupture && (
                        <Badge className="text-[10px] bg-orange-100 text-orange-700 border-0 flex items-center gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Alerte
                        </Badge>
                      )}
                      <Badge className={cn("text-[10px] border-0", CATEGORIE_COLORS[article.categorie])}>
                        {CATEGORIE_LABELS[article.categorie]}
                      </Badge>
                    </div>
                  </div>

                  {/* Barre de stock */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Stock</span>
                      <span className={cn(
                        "text-sm font-bold",
                        enRupture
                          ? "text-red-600"
                          : enAlerte
                            ? "text-orange-600"
                            : "text-gray-900"
                      )}>
                        {article.quantite_stock} {article.unite}s
                      </span>
                    </div>
                    {/* Barre de progression custom — évite les classes dynamiques */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          getStockBarColor(article)
                        )}
                        style={{ width: `${getPourcentageStock(article)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Seuil alerte : {article.seuil_alerte} {article.unite}s
                    </p>
                  </div>

                  {/* Prix + date péremption */}
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {formatCurrency(article.prix_unitaire)} / {article.unite}
                    </span>
                    {article.date_peremption && (
                      <span className="text-xs text-gray-400">
                        Périme le {formatDate(article.date_peremption)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {/* Bouton mouvement de stock */}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setArticleSelectionne(article)}
                      className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-xs h-8"
                    >
                      Mouvement
                    </Button>

                    {/* Bouton modifier / supprimer */}
                    <ModifierArticleDialog
                      article={article}
                      hospitalId={hospitalId}
                      utilisateurId={utilisateurId}
                      utilisateurNom={utilisateurNom}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog nouvel article */}
      <NouvelArticleDialog
        open={dialogNouvel}
        onOpenChange={setDialogNouvel}
        hospitalId={hospitalId}
        utilisateurId={utilisateurId}
        utilisateurNom={utilisateurNom}
      />

      {/* Dialog mouvement de stock */}
      {articleSelectionne && (
        <MouvementDialog
          article={articleSelectionne}
          hospitalId={hospitalId}
          utilisateurId={utilisateurId}
          utilisateurNom={utilisateurNom}
          open={!!articleSelectionne}
          onOpenChange={(open) => {
            if (!open) setArticleSelectionne(null);
          }}
        />
      )}

      {/* Dialog historique des mouvements */}
      <HistoriqueDialog
        open={dialogHistorique}
        onOpenChange={setDialogHistorique}
        mouvements={mouvements}
      />
    </div>
  );
}