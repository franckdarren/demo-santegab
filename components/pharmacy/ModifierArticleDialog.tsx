"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, AlertCircle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { modifierArticleStock, supprimerArticleStock } from "@/app/dashboard/pharmacy/actions";
import { CategorieArticle } from "@/app/generated/prisma/client";
import { format } from "date-fns";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const UNITES = [
  "comprimé", "gélule", "ampoule", "flacon", "sachet",
  "tube", "paire", "unité", "boîte", "litre",
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
}

interface ModifierArticleDialogProps {
  article: Article;
  hospitalId: string;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
      <p className="text-xs text-red-500">{message}</p>
    </div>
  );
}

export function ModifierArticleDialog({
  article,
  hospitalId,
}: ModifierArticleDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isPendingDelete, startTransitionDelete] = useTransition();
  const [succes, setSucces] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [categorie, setCategorie] = useState<CategorieArticle>(article.categorie);
  const [unite, setUnite] = useState(article.unite);
  const [formData, setFormData] = useState({
    nom: article.nom,
    description: article.description ?? "",
    seuil_alerte: article.seuil_alerte.toString(),
    prix_unitaire: article.prix_unitaire.toString(),
    date_peremption: article.date_peremption
      ? format(new Date(article.date_peremption), "yyyy-MM-dd")
      : "",
    code_article: article.code_article ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prix_unitaire || Number(formData.prix_unitaire) < 0) {
      newErrors.prix_unitaire = "Le prix est obligatoire";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(false);
    setConfirmation(false);
    setErrors({});
    setOpen(false);
  }

  function handleSauvegarder() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        await modifierArticleStock(article.id, hospitalId, {
          nom: formData.nom,
          categorie,
          description: formData.description || undefined,
          unite,
          seuil_alerte: Number(formData.seuil_alerte) || 10,
          prix_unitaire: Number(formData.prix_unitaire),
          date_peremption: formData.date_peremption || undefined,
          code_article: formData.code_article || undefined,
        });
        setSucces(true);
        router.refresh();
        setTimeout(() => close(), 1200);
      } catch (error) {
        setErrors({ global: "Erreur lors de la modification." });
        console.error(error);
      }
    });
  }

  function handleSupprimer() {
    startTransitionDelete(async () => {
      try {
        await supprimerArticleStock(article.id, hospitalId);
        router.refresh();
        close();
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex-1 border-gray-200 text-gray-600 hover:text-blue-700 text-xs h-8"
      >
        <Pencil className="h-3 w-3 mr-1" />
        Modifier
      </Button>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-lg! w-full p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">Modifier l'article</DialogTitle>

          {succes ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">
                Article modifié avec succès !
              </p>
            </div>
          ) : (
            <div className="flex flex-col">

              {/* Header */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-base font-semibold text-gray-900">
                  Modifier l'article
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {article.nom} · Stock actuel : {article.quantite_stock} {article.unite}s
                </p>
              </div>

              <div className="overflow-y-auto p-6 space-y-4 max-h-[60vh]">

                {errors.global && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{errors.global}</p>
                  </div>
                )}

                {/* Confirmation suppression */}
                {confirmation && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-3">
                    <p className="text-sm font-semibold text-red-800">
                      ⚠️ Confirmer la suppression ?
                    </p>
                    <p className="text-xs text-red-600">
                      L'article sera désactivé. L'historique des mouvements sera conservé.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmation(false)}
                        className="text-gray-500"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isPendingDelete}
                        onClick={handleSupprimer}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isPendingDelete ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Confirmer la suppression"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Nom */}
                <div className="space-y-1.5">
                  <Label>Nom <span className="text-red-500">*</span></Label>
                  <Input
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className={cn(errors.nom && "border-red-400")}
                  />
                  <FieldError message={errors.nom} />
                </div>

                {/* Catégorie + Unité */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Catégorie</Label>
                    <select
                      value={categorie}
                      onChange={(e) => setCategorie(e.target.value as CategorieArticle)}
                      className={selectClass}
                    >
                      <option value="MEDICAMENT">Médicament</option>
                      <option value="CONSOMMABLE">Consommable</option>
                      <option value="EQUIPEMENT">Équipement</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unité</Label>
                    <select
                      value={unite}
                      onChange={(e) => setUnite(e.target.value)}
                      className={selectClass}
                    >
                      {UNITES.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Seuil + Prix */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Seuil d'alerte</Label>
                    <Input
                      name="seuil_alerte"
                      type="number"
                      min={0}
                      value={formData.seuil_alerte}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prix unitaire (XAF) <span className="text-red-500">*</span></Label>
                    <Input
                      name="prix_unitaire"
                      type="number"
                      min={0}
                      value={formData.prix_unitaire}
                      onChange={handleChange}
                      className={cn(errors.prix_unitaire && "border-red-400")}
                    />
                    <FieldError message={errors.prix_unitaire} />
                  </div>
                </div>

                {/* Code + Péremption */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Code article</Label>
                    <Input
                      name="code_article"
                      value={formData.code_article}
                      onChange={handleChange}
                      placeholder="MED-001"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date de péremption</Label>
                    <Input
                      name="date_peremption"
                      type="date"
                      value={formData.date_peremption}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    name="description"
                    rows={2}
                    className="resize-none"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                {/* Bouton supprimer à gauche */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmation(true)}
                  disabled={confirmation}
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                >
                  Supprimer l'article
                </Button>

                <div className="flex gap-2">
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
                    onClick={handleSauvegarder}
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1.5" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}