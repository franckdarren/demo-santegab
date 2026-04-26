// ============================================================
// DIALOG — Création / modification d'un examen du catalogue
// ============================================================

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  creerExamenCatalogue,
  modifierExamenCatalogue,
} from "@/app/dashboard/laboratory/catalogue/actions";

// Familles prédéfinies — correspond à exameslabo.md
const FAMILLES_PREDEFINIES = [
  "HEMATOLOGIE",
  "HORMONES",
  "SEROLOGIE",
  "BACTERIOLOGIE",
  "BIOCHIMIE",
  "IMMUNOLOGIE / MARQUEURS TUMORAUX",
  "AUTRES",
];

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export interface CatalogueItem {
  id: string;
  famille: string;
  nom: string;
  description: string | null;
  prix: number;
  actif: boolean;
  ordre: number;
}

interface CatalogueExamenFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
  examen?: CatalogueItem | null; // null → création, défini → modification
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

export function CatalogueExamenFormDialog({
  open,
  onOpenChange,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  examen,
}: CatalogueExamenFormDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [famille, setFamille] = useState("");
  const [familleSaisie, setFamilleSaisie] = useState("");
  const [useFamilleLibre, setUseFamilleLibre] = useState(false);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("0");
  const [actif, setActif] = useState(true);
  const [ordre, setOrdre] = useState("0");

  // Pré-remplir en mode modification
  useEffect(() => {
    if (examen) {
      const estPredefinee = FAMILLES_PREDEFINIES.includes(examen.famille);
      setUseFamilleLibre(!estPredefinee);
      setFamille(estPredefinee ? examen.famille : "");
      setFamilleSaisie(estPredefinee ? "" : examen.famille);
      setNom(examen.nom);
      setDescription(examen.description ?? "");
      setPrix(String(examen.prix));
      setActif(examen.actif);
      setOrdre(String(examen.ordre));
    } else {
      resetForm();
    }
  }, [examen, open]);

  function resetForm() {
    setFamille("");
    setFamilleSaisie("");
    setUseFamilleLibre(false);
    setNom("");
    setDescription("");
    setPrix("0");
    setActif(true);
    setOrdre("0");
    setErrors({});
  }

  function getFamilleFinale(): string {
    return useFamilleLibre ? familleSaisie.trim() : famille;
  }

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    const fam = getFamilleFinale();
    if (!fam) newErrors.famille = "La famille est obligatoire";
    if (!nom.trim()) newErrors.nom = "Le nom est obligatoire";
    const prixNum = parseFloat(prix);
    if (isNaN(prixNum) || prixNum < 0)
      newErrors.prix = "Le prix doit être un nombre positif";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!valider()) return;

    const data = {
      famille:     getFamilleFinale().toUpperCase(),
      nom:         nom.trim(),
      description: description.trim() || undefined,
      prix:        parseFloat(prix),
      actif,
      ordre:       parseInt(ordre) || 0,
    };

    startTransition(async () => {
      try {
        if (examen) {
          await modifierExamenCatalogue(
            examen.id,
            hospitalId,
            utilisateurId,
            utilisateurNom,
            data
          );
        } else {
          await creerExamenCatalogue(
            hospitalId,
            utilisateurId,
            utilisateurNom,
            data
          );
        }
        router.refresh();
        resetForm();
        onOpenChange(false);
      } catch (error) {
        setErrors({ global: "Erreur lors de l'enregistrement. Veuillez réessayer." });
        console.error(error);
      }
    });
  }

  function close() {
    resetForm();
    onOpenChange(false);
  }

  const titre = examen ? "Modifier l'examen" : "Ajouter un examen";

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md! w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">{titre}</DialogTitle>

        <div className="flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">{titre}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Catalogue des examens biologiques
            </p>
          </div>

          <div className="overflow-y-auto p-6 space-y-4 max-h-[70vh]">
            {errors.global && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">{errors.global}</p>
              </div>
            )}

            {/* Famille */}
            <div className="space-y-1.5">
              <Label>
                Famille <span className="text-red-500">*</span>
              </Label>
              {!useFamilleLibre ? (
                <>
                  <select
                    value={famille}
                    onChange={(e) => {
                      setFamille(e.target.value);
                      if (errors.famille)
                        setErrors((p) => ({ ...p, famille: "" }));
                    }}
                    className={cn(
                      selectClass,
                      errors.famille && "border-red-400"
                    )}
                  >
                    <option value="">Sélectionner une famille</option>
                    {FAMILLES_PREDEFINIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setUseFamilleLibre(true); setFamille(""); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Saisir une famille personnalisée
                  </button>
                </>
              ) : (
                <>
                  <Input
                    placeholder="Ex: COAGULATION, VIROLOGIE..."
                    value={familleSaisie}
                    onChange={(e) => {
                      setFamilleSaisie(e.target.value);
                      if (errors.famille)
                        setErrors((p) => ({ ...p, famille: "" }));
                    }}
                    className={cn(errors.famille && "border-red-400")}
                  />
                  <button
                    type="button"
                    onClick={() => { setUseFamilleLibre(false); setFamilleSaisie(""); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    ← Choisir dans la liste
                  </button>
                </>
              )}
              <FieldError message={errors.famille} />
            </div>

            {/* Nom */}
            <div className="space-y-1.5">
              <Label>
                Nom de l'examen <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Électrophorèse de l'hémoglobine"
                value={nom}
                onChange={(e) => {
                  setNom(e.target.value);
                  if (errors.nom) setErrors((p) => ({ ...p, nom: "" }));
                }}
                className={cn(errors.nom && "border-red-400")}
              />
              <FieldError message={errors.nom} />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description (optionnel)</Label>
              <Textarea
                placeholder="Indications, notes particulières..."
                rows={2}
                className="resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Prix */}
            <div className="space-y-1.5">
              <Label>
                Tarif (XAF) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                step={500}
                placeholder="0"
                value={prix}
                onChange={(e) => {
                  setPrix(e.target.value);
                  if (errors.prix) setErrors((p) => ({ ...p, prix: "" }));
                }}
                className={cn(errors.prix && "border-red-400")}
              />
              <FieldError message={errors.prix} />
            </div>

            {/* Ordre d'affichage */}
            <div className="space-y-1.5">
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                min={0}
                value={ordre}
                onChange={(e) => setOrdre(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-400">
                Les examens avec un ordre plus petit apparaissent en premier.
              </p>
            </div>

            {/* Actif */}
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                actif
                  ? "bg-green-50 border-green-300"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              )}
              onClick={() => setActif(!actif)}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  actif ? "bg-green-600 border-green-600" : "border-gray-300"
                )}
              >
                {actif && <Check className="h-3 w-3 text-white" />}
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    actif ? "text-green-700" : "text-gray-600"
                  )}
                >
                  {actif ? "Examen actif" : "Examen inactif"}
                </p>
                <p className="text-xs text-gray-400">
                  {actif
                    ? "Visible dans les demandes d'examens"
                    : "Masqué dans les nouvelles demandes"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
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
              onClick={handleSubmit}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  {examen ? "Enregistrer" : "Ajouter"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
