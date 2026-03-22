"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, X, Plus, Minus, AlertCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { enregistrerMouvement } from "@/app/dashboard/pharmacy/actions";
import { CategorieArticle, TypeMouvement } from "@/app/generated/prisma/client";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface Article {
  id: string;
  nom: string;
  categorie: CategorieArticle;
  unite: string;
  quantite_stock: number;
  seuil_alerte: number;
  prix_unitaire: number;
}

interface MouvementDialogProps {
  article: Article;
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MouvementDialog({
  article,
  hospitalId,
  utilisateurId,
  open,
  utilisateurNom,
  onOpenChange,
}: MouvementDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [typeMouvement, setTypeMouvement] = useState<TypeMouvement>("ENTREE");
  const [quantite, setQuantite] = useState("");
  const [motif, setMotif] = useState("");

  // Calcul prévisuel du nouveau stock
  const quantiteNum = Number(quantite) || 0;
  const nouveauStock =
    typeMouvement === "ENTREE"
      ? article.quantite_stock + quantiteNum
      : typeMouvement === "SORTIE"
      ? article.quantite_stock - quantiteNum
      : quantiteNum;

  function close() {
    setSucces(false);
    setErreur(null);
    setQuantite("");
    setMotif("");
    setTypeMouvement("ENTREE");
    onOpenChange(false);
  }

  function handleEnregistrer() {
    setErreur(null);
    if (!quantite || quantiteNum <= 0) {
      setErreur("La quantité doit être supérieure à 0");
      return;
    }
    if (typeMouvement === "SORTIE" && quantiteNum > article.quantite_stock) {
      setErreur(`Stock insuffisant — disponible : ${article.quantite_stock} ${article.unite}s`);
      return;
    }

    startTransition(async () => {
      try {
        await enregistrerMouvement(hospitalId, utilisateurId, utilisateurNom, {
          article_id: article.id,
          type_mouvement: typeMouvement,
          quantite: quantiteNum,
          motif: motif || undefined,
        });
        setSucces(true);
        router.refresh();
        setTimeout(() => close(), 1200);
      } catch (error: any) {
        setErreur(error.message ?? "Erreur lors de l'enregistrement");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md! w-full p-0 overflow-hidden gap-0 [&>button:first-of-type]:hidden">
        <DialogTitle className="sr-only">Mouvement de stock</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-base font-semibold text-gray-900">
              Mouvement enregistré !
            </p>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Header */}
            <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {article.nom}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Stock actuel :{" "}
                  <span className="font-semibold text-gray-700">
                    {article.quantite_stock} {article.unite}s
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Type de mouvement */}
              <div className="space-y-2">
                <Label>Type de mouvement</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "ENTREE" as TypeMouvement, label: "Entrée", icon: Plus, color: "border-green-400 bg-green-50 text-green-700" },
                    { value: "SORTIE" as TypeMouvement, label: "Sortie", icon: Minus, color: "border-orange-400 bg-orange-50 text-orange-700" },
                    { value: "AJUSTEMENT" as TypeMouvement, label: "Ajust.", icon: AlertCircle, color: "border-blue-400 bg-blue-50 text-blue-700" },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTypeMouvement(t.value)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                          typeMouvement === t.value
                            ? t.color
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantité */}
              <div className="space-y-1.5">
                <Label>
                  {typeMouvement === "AJUSTEMENT"
                    ? "Nouveau stock total"
                    : "Quantité"}
                  {" "}({article.unite}s)
                </Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="0"
                  value={quantite}
                  onChange={(e) => {
                    setQuantite(e.target.value);
                    setErreur(null);
                  }}
                  className={cn(erreur && "border-red-400")}
                />
              </div>

              {/* Prévisualisation nouveau stock */}
              {quantiteNum > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stock actuel</span>
                    <span className="font-medium">{article.quantite_stock} {article.unite}s</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">
                      {typeMouvement === "ENTREE" ? "+ Entrée" : typeMouvement === "SORTIE" ? "- Sortie" : "= Ajustement"}
                    </span>
                    <span className={cn(
                      "font-medium",
                      typeMouvement === "ENTREE" ? "text-green-600" : "text-orange-600"
                    )}>
                      {typeMouvement === "ENTREE" ? "+" : typeMouvement === "SORTIE" ? "-" : "="}{quantiteNum} {article.unite}s
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-700">Nouveau stock</span>
                    <span className={cn(
                      nouveauStock <= article.seuil_alerte ? "text-orange-600" : "text-green-600"
                    )}>
                      {nouveauStock} {article.unite}s
                    </span>
                  </div>
                </div>
              )}

              {/* Motif */}
              <div className="space-y-1.5">
                <Label>Motif</Label>
                <Input
                  placeholder="Ex: Approvisionnement, délivrance patient..."
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
              </div>

              {/* Erreur */}
              {erreur && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{erreur}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center px-5 py-4 border-t bg-gray-50">
              <Button type="button" variant="ghost" onClick={close} className="text-gray-500">
                Annuler
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleEnregistrer}
                className={cn(
                  "text-white",
                  typeMouvement === "SORTIE"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-blue-700 hover:bg-blue-800"
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Enregistrer
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