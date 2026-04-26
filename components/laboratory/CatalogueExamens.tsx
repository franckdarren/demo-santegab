// ============================================================
// CATALOGUE EXAMENS — Gestion CRUD groupée par famille
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { supprimerExamenCatalogue, toggleActifExamenCatalogue } from "@/app/dashboard/laboratory/catalogue/actions";
import {
  CatalogueExamenFormDialog,
  type CatalogueItem,
} from "./CatalogueExamenFormDialog";

interface CatalogueExamensProps {
  catalogue: CatalogueItem[];
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
  peutModifier: boolean;
}

// Groupe les examens par famille
function grouperParFamille(items: CatalogueItem[]): Map<string, CatalogueItem[]> {
  const map = new Map<string, CatalogueItem[]>();
  for (const item of items) {
    const groupe = map.get(item.famille) ?? [];
    groupe.push(item);
    map.set(item.famille, groupe);
  }
  return map;
}

export function CatalogueExamens({
  catalogue,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  peutModifier,
}: CatalogueExamensProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [examenEdite, setExamenEdite] = useState<CatalogueItem | null>(null);
  const [famillesOuvertes, setFamillesOuvertes] = useState<Set<string>>(new Set());
  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null);
  const [toggleEnCours, setToggleEnCours] = useState<string | null>(null);

  const grouped = grouperParFamille(catalogue);
  const familles = Array.from(grouped.keys()).sort();
  const totalActifs = catalogue.filter((e) => e.actif).length;

  function toggleFamille(famille: string) {
    setFamillesOuvertes((prev) => {
      const next = new Set(prev);
      if (next.has(famille)) {
        next.delete(famille);
      } else {
        next.add(famille);
      }
      return next;
    });
  }

  function ouvrirCreation() {
    setExamenEdite(null);
    setDialogOpen(true);
  }

  function ouvrirEdition(examen: CatalogueItem) {
    setExamenEdite(examen);
    setDialogOpen(true);
  }

  async function handleSupprimer(examen: CatalogueItem) {
    if (!confirm(`Supprimer l'examen "${examen.nom}" ?`)) return;
    setSuppressionEnCours(examen.id);
    startTransition(async () => {
      try {
        await supprimerExamenCatalogue(
          examen.id,
          hospitalId,
          utilisateurId,
          utilisateurNom
        );
        router.refresh();
      } catch (error) {
        alert("Impossible de supprimer cet examen.");
        console.error(error);
      } finally {
        setSuppressionEnCours(null);
      }
    });
  }

  async function handleToggle(examen: CatalogueItem) {
    setToggleEnCours(examen.id);
    startTransition(async () => {
      try {
        await toggleActifExamenCatalogue(
          examen.id,
          hospitalId,
          !examen.actif,
          utilisateurId,
          utilisateurNom
        );
        router.refresh();
      } catch (error) {
        console.error(error);
      } finally {
        setToggleEnCours(null);
      }
    });
  }

  return (
    <>
      {/* Stats + bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-sm text-gray-500">
          <span>
            <span className="font-semibold text-gray-900">{catalogue.length}</span> examens
          </span>
          <span>·</span>
          <span>
            <span className="font-semibold text-green-700">{totalActifs}</span> actifs
          </span>
          <span>·</span>
          <span>
            <span className="font-semibold text-gray-500">{familles.length}</span>{" "}
            famille{familles.length !== 1 ? "s" : ""}
          </span>
        </div>
        {peutModifier && (
          <Button
            type="button"
            onClick={ouvrirCreation}
            className="bg-blue-700 hover:bg-blue-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un examen
          </Button>
        )}
      </div>

      {/* État vide */}
      {catalogue.length === 0 && (
        <Card className="border border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <FlaskConical className="h-6 w-6 text-blue-400" />
            </div>
            <p className="text-gray-700 font-semibold">
              Catalogue vide
            </p>
            <p className="text-gray-400 text-sm mt-1 text-center max-w-xs">
              Ajoutez les examens biologiques proposés par votre structure avec
              leurs tarifs.
            </p>
            {peutModifier && (
              <Button
                type="button"
                onClick={ouvrirCreation}
                className="mt-4 bg-blue-700 hover:bg-blue-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le premier examen
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Familles */}
      <div className="space-y-3">
        {familles.map((famille) => {
          const examens = grouped.get(famille)!;
          const ouvert = famillesOuvertes.has(famille);
          const nbActifs = examens.filter((e) => e.actif).length;

          return (
            <Card key={famille} className="border border-gray-200 shadow-sm overflow-hidden">
              {/* En-tête famille */}
              <button
                type="button"
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-100 transition-colors text-left"
                onClick={() => toggleFamille(famille)}
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                  <FlaskConical className="h-4 w-4 text-cyan-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {famille}
                  </p>
                  <p className="text-xs text-gray-400">
                    {examens.length} examen{examens.length !== 1 ? "s" : ""}{" "}
                    · {nbActifs} actif{nbActifs !== 1 ? "s" : ""}
                  </p>
                </div>
                {ouvert ? (
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                )}
              </button>

              {/* Liste des examens */}
              {ouvert && (
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {examens.map((examen) => (
                      <div
                        key={examen.id}
                        className={cn(
                          "flex items-center gap-3 px-5 py-3 transition-colors",
                          !examen.actif && "opacity-50"
                        )}
                      >
                        {/* Nom */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {examen.nom}
                            </p>
                            {!examen.actif && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-gray-300 text-gray-400 py-0 px-1.5"
                              >
                                Inactif
                              </Badge>
                            )}
                          </div>
                          {examen.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {examen.description}
                            </p>
                          )}
                        </div>

                        {/* Tarif */}
                        <span className="text-sm font-semibold text-gray-700 shrink-0">
                          {formatCurrency(examen.prix)}
                        </span>

                        {/* Actions */}
                        {peutModifier && (
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Toggle actif/inactif */}
                            <button
                              type="button"
                              onClick={() => handleToggle(examen)}
                              disabled={toggleEnCours === examen.id}
                              className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                              title={examen.actif ? "Désactiver" : "Activer"}
                            >
                              {toggleEnCours === examen.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : examen.actif ? (
                                <ToggleRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </button>

                            {/* Modifier */}
                            <button
                              type="button"
                              onClick={() => ouvrirEdition(examen)}
                              className="p-1.5 rounded hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-600"
                              title="Modifier"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* Supprimer */}
                            <button
                              type="button"
                              onClick={() => handleSupprimer(examen)}
                              disabled={suppressionEnCours === examen.id}
                              className="p-1.5 rounded hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600"
                              title="Supprimer"
                            >
                              {suppressionEnCours === examen.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Dialog formulaire */}
      <CatalogueExamenFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hospitalId={hospitalId}
        utilisateurId={utilisateurId}
        utilisateurNom={utilisateurNom}
        examen={examenEdite}
      />
    </>
  );
}
