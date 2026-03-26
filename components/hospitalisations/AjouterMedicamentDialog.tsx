// ============================================================
// AJOUTER MÉDICAMENT — Bon de commande pharmacie
//
// Vérifie la disponibilité stock en temps réel.
// Disponible   → débit stock immédiat + ligne SERVI
// Indisponible → ligne EN_ATTENTE (pas de débit)
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Check, Loader2, AlertCircle, Pill,
  AlertTriangle, PackageCheck, PackageX,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ajouterMedicamentHospitalisation } from "@/app/dashboard/hospitalisations/actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface Article {
  id:             string;
  nom:            string;
  unite:          string;
  quantite_stock: number;
  seuil_alerte:   number;
  prix_unitaire:  number;
  categorie:      string;
}

interface AjouterMedicamentDialogProps {
  open:              boolean;
  onOpenChange:      (open: boolean) => void;
  hospitalisationId: string;
  hospitalId:        string;
  utilisateurId:     string;
  utilisateurNom:    string;
  articles:          Article[];
}

export function AjouterMedicamentDialog({
  open,
  onOpenChange,
  hospitalisationId,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  articles,
}: AjouterMedicamentDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState<"servi" | "attente" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [articleId,  setArticleId]  = useState("");
  const [quantite,   setQuantite]   = useState("1");
  const [notes,      setNotes]      = useState("");

  // Article sélectionné pour afficher les infos stock
  const articleSelectionne = articles.find((a) => a.id === articleId);
  const quantiteNum        = Number(quantite) || 0;
  const estDisponible      = articleSelectionne
    ? articleSelectionne.quantite_stock >= quantiteNum
    : false;
  const montantTotal = articleSelectionne
    ? articleSelectionne.prix_unitaire * quantiteNum
    : 0;

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!articleId)      newErrors.article  = "Veuillez sélectionner un médicament";
    if (quantiteNum <= 0) newErrors.quantite = "La quantité doit être supérieure à 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(null);
    setArticleId("");
    setQuantite("1");
    setNotes("");
    setErrors({});
    onOpenChange(false);
  }

  function handleAjouter() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        const result = await ajouterMedicamentHospitalisation(
          hospitalisationId,
          hospitalId,
          utilisateurId,
          utilisateurNom,
          {
            article_stock_id: articleId,
            quantite:         quantiteNum,
            prescrit_par:     utilisateurNom,
            notes:            notes || undefined,
          }
        );
        setSucces(result.estDisponible ? "servi" : "attente");
        router.refresh();
        setTimeout(() => close(), 1800);
      } catch (error: unknown) {
        const message = error instanceof Error
          ? error.message
          : "Erreur lors de l'ajout.";
        setErrors({ global: message });
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="!max-w-md w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Ajouter un médicament</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              succes === "servi" ? "bg-green-100" : "bg-orange-100"
            )}>
              {succes === "servi" ? (
                <PackageCheck className="h-8 w-8 text-green-600" />
              ) : (
                <PackageX className="h-8 w-8 text-orange-600" />
              )}
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">
                {succes === "servi"
                  ? "Médicament délivré !"
                  : "En attente de stock"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {succes === "servi"
                  ? "Le stock a été débité et la facture mise à jour."
                  : "La ligne est en attente. Le stock sera débité à la livraison."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Header */}
            <div className="px-5 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Pill className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Bon de commande médicament
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Délivrance pharmacie → hospitalisation
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">

              {errors.global && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{errors.global}</p>
                </div>
              )}

              {/* Médicament */}
              <div className="space-y-1.5">
                <Label>Médicament <span className="text-red-500">*</span></Label>
                <select
                  value={articleId}
                  onChange={(e) => {
                    setArticleId(e.target.value);
                    setQuantite("1");
                    if (errors.article) setErrors((p) => ({ ...p, article: "" }));
                  }}
                  className={cn(selectClass, errors.article && "border-red-400")}
                >
                  <option value="">Sélectionner...</option>
                  {articles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom} — Stock : {a.quantite_stock} {a.unite}(s)
                    </option>
                  ))}
                </select>
                {errors.article && (
                  <p className="text-xs text-red-500">{errors.article}</p>
                )}

                {/* Info stock article sélectionné */}
                {articleSelectionne && (
                  <div className={cn(
                    "flex items-center gap-2 p-2.5 rounded-lg border text-xs",
                    articleSelectionne.quantite_stock === 0
                      ? "bg-red-50 border-red-200 text-red-700"
                      : articleSelectionne.quantite_stock <= articleSelectionne.seuil_alerte
                      ? "bg-orange-50 border-orange-200 text-orange-700"
                      : "bg-green-50 border-green-200 text-green-700"
                  )}>
                    {articleSelectionne.quantite_stock === 0 ? (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>
                      Stock disponible :{" "}
                      <strong>
                        {articleSelectionne.quantite_stock} {articleSelectionne.unite}(s)
                      </strong>
                      {" · "}
                      {formatCurrency(articleSelectionne.prix_unitaire)}/{articleSelectionne.unite}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantité */}
              <div className="space-y-1.5">
                <Label>Quantité <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min={1}
                  value={quantite}
                  onChange={(e) => {
                    setQuantite(e.target.value);
                    if (errors.quantite) setErrors((p) => ({ ...p, quantite: "" }));
                  }}
                  className={cn(errors.quantite && "border-red-400")}
                />
                {errors.quantite && (
                  <p className="text-xs text-red-500">{errors.quantite}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input
                  placeholder="Posologie, instructions particulières..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Prévisualisation */}
              {articleSelectionne && quantiteNum > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Montant</span>
                    <span className="font-semibold">
                      {formatCurrency(montantTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Statut</span>
                    <Badge className={cn(
                      "text-xs border-0",
                      estDisponible
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {estDisponible ? "✅ Sera délivré" : "⏳ En attente stock"}
                    </Badge>
                  </div>
                  {!estDisponible && (
                    <p className="text-xs text-orange-600">
                      Stock insuffisant — la ligne sera ajoutée en attente.
                      Le stock sera débité lors de la livraison.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-5 py-4 border-t bg-gray-50">
              <Button
                type="button"
                variant="ghost"
                onClick={close}
                className="text-gray-500"
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleAjouter}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Pill className="h-4 w-4 mr-1.5" />
                    Ajouter au séjour
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}