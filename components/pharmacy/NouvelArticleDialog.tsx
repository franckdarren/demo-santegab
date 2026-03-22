"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { creerArticleStock } from "@/app/dashboard/pharmacy/actions";
import { CategorieArticle } from "@/app/generated/prisma/client";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const UNITES = [
  "comprimé", "gélule", "ampoule", "flacon", "sachet",
  "tube", "paire", "unité", "boîte", "litre",
];

interface NouvelArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
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

export function NouvelArticleDialog({
  open,
  onOpenChange,
  hospitalId,
  utilisateurId,
  utilisateurNom,
}: NouvelArticleDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [categorie, setCategorie] = useState<CategorieArticle>("MEDICAMENT");
  const [unite, setUnite] = useState("comprimé");
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    quantite_stock: "",
    seuil_alerte: "10",
    prix_unitaire: "",
    date_peremption: "",
    code_article: "",
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
    setCategorie("MEDICAMENT");
    setUnite("comprimé");
    setFormData({
      nom: "", description: "", quantite_stock: "",
      seuil_alerte: "10", prix_unitaire: "",
      date_peremption: "", code_article: "",
    });
    setErrors({});
    onOpenChange(false);
  }

  function handleCreer() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        await creerArticleStock(hospitalId, utilisateurId,
          utilisateurNom, {
          nom: formData.nom,
          categorie,
          description: formData.description || undefined,
          unite,
          quantite_stock: Number(formData.quantite_stock) || 0,
          seuil_alerte: Number(formData.seuil_alerte) || 10,
          prix_unitaire: Number(formData.prix_unitaire),
          date_peremption: formData.date_peremption || undefined,
          code_article: formData.code_article || undefined,
        });
        setSucces(true);
        router.refresh();
        setTimeout(() => close(), 1500);
      } catch (error) {
        setErrors({ global: "Erreur lors de la création." });
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg! w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Nouvel article</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">
              Article créé avec succès !
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                Nouvel article
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Médicament, consommable ou équipement
              </p>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 max-h-[65vh]">

              {errors.global && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{errors.global}</p>
                </div>
              )}

              {/* Nom */}
              <div className="space-y-1.5">
                <Label>Nom <span className="text-red-500">*</span></Label>
                <Input
                  name="nom"
                  placeholder="Ex: Paracétamol 500mg"
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

              {/* Stock initial + Seuil */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Stock initial</Label>
                  <Input
                    name="quantite_stock"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={formData.quantite_stock}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Seuil d'alerte</Label>
                  <Input
                    name="seuil_alerte"
                    type="number"
                    min={0}
                    placeholder="10"
                    value={formData.seuil_alerte}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Prix + Code */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prix unitaire (XAF) <span className="text-red-500">*</span></Label>
                  <Input
                    name="prix_unitaire"
                    type="number"
                    min={0}
                    placeholder="500"
                    value={formData.prix_unitaire}
                    onChange={handleChange}
                    className={cn(errors.prix_unitaire && "border-red-400")}
                  />
                  <FieldError message={errors.prix_unitaire} />
                </div>
                <div className="space-y-1.5">
                  <Label>Code article</Label>
                  <Input
                    name="code_article"
                    placeholder="MED-001"
                    value={formData.code_article}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Date péremption */}
              <div className="space-y-1.5">
                <Label>Date de péremption</Label>
                <Input
                  name="date_peremption"
                  type="date"
                  value={formData.date_peremption}
                  onChange={handleChange}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  name="description"
                  placeholder="Description, indications, précautions..."
                  rows={2}
                  className="resize-none"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
              <Button type="button" variant="ghost" onClick={close} className="text-gray-500">
                Annuler
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleCreer}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Créer l'article
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