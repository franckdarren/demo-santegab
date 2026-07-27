// ============================================================
// ANTÉCÉDENT MÉDICAL — Dialog de saisie / modification
//
// Répond aux exigences §5.6 (antécédents structurés) et §5.1
// (traitements en cours) du cahier des charges KIMBA.
//
// Le même dialog sert à créer et à modifier : si la prop
// « antecedent » est fournie, on est en modification.
// ============================================================

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
import { format } from "date-fns";
import { TypeAntecedent } from "@/app/generated/prisma/client";
import {
  creerAntecedent,
  modifierAntecedent,
} from "@/app/dashboard/patients/actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

// Libellés lisibles des types d'antécédents
export const TYPE_ANTECEDENT_LABELS: Record<TypeAntecedent, string> = {
  PATHOLOGIE:           "Pathologie",
  HOSPITALISATION:      "Hospitalisation",
  CHIRURGIE:            "Chirurgie",
  ALLERGIE:             "Allergie",
  TRAITEMENT_CHRONIQUE: "Traitement chronique",
};

interface AntecedentExistant {
  id: string;
  type: TypeAntecedent;
  libelle: string;
  date_debut: Date | null;
  date_fin: Date | null;
  est_actif: boolean;
  notes: string | null;
}

interface AntecedentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalId: string;
  patientId: string;
  utilisateurId: string;
  utilisateurNom: string;
  // Absent = création, présent = modification
  antecedent?: AntecedentExistant;
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

export function AntecedentDialog({
  open,
  onOpenChange,
  hospitalId,
  patientId,
  utilisateurId,
  utilisateurNom,
  antecedent,
}: AntecedentDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const estModification = antecedent !== undefined;

  // Champs — pré-remplis en modification
  const [type, setType] = useState<TypeAntecedent>(
    antecedent?.type ?? "PATHOLOGIE"
  );
  const [libelle, setLibelle] = useState(antecedent?.libelle ?? "");
  const [dateDebut, setDateDebut] = useState(
    antecedent?.date_debut ? format(antecedent.date_debut, "yyyy-MM-dd") : ""
  );
  const [dateFin, setDateFin] = useState(
    antecedent?.date_fin ? format(antecedent.date_fin, "yyyy-MM-dd") : ""
  );
  const [estActif, setEstActif] = useState(antecedent?.est_actif ?? true);
  const [notes, setNotes] = useState(antecedent?.notes ?? "");

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!libelle.trim()) newErrors.libelle = "Le libellé est obligatoire";

    // Une date de fin antérieure au début n'a pas de sens
    if (dateDebut && dateFin && dateFin < dateDebut) {
      newErrors.date_fin = "La date de fin précède la date de début";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(false);
    setErrors({});
    onOpenChange(false);
  }

  function handleEnregistrer() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        const donnees = {
          type,
          libelle:    libelle.trim(),
          date_debut: dateDebut ? new Date(dateDebut) : null,
          date_fin:   dateFin ? new Date(dateFin) : null,
          est_actif:  estActif,
          notes:      notes.trim(),
        };

        if (estModification) {
          await modifierAntecedent(
            antecedent.id,
            hospitalId,
            utilisateurId,
            utilisateurNom,
            donnees
          );
        } else {
          await creerAntecedent(hospitalId, utilisateurId, utilisateurNom, {
            patient_id: patientId,
            ...donnees,
          });
        }

        setSucces(true);
        router.refresh();
        setTimeout(() => close(), 1200);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors de l'enregistrement. Veuillez réessayer.";
        setErrors({ global: message });
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      {/* max-w préfixé sm: pour conserver la marge mobile de DialogContent */}
      <DialogContent className="sm:max-w-xl! w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">
          {estModification ? "Modifier l'antécédent" : "Nouvel antécédent"}
        </DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {estModification ? "Antécédent modifié !" : "Antécédent ajouté !"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                {estModification ? "Modifier l'antécédent" : "Nouvel antécédent"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Dossier médical structuré du patient
              </p>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6 space-y-5 max-h-[60vh] sm:max-h-[70vh]">

              {errors.global && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{errors.global}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Type <span className="text-red-500">*</span></Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TypeAntecedent)}
                  className={selectClass}
                >
                  {(Object.keys(TYPE_ANTECEDENT_LABELS) as TypeAntecedent[]).map(
                    (t) => (
                      <option key={t} value={t}>
                        {TYPE_ANTECEDENT_LABELS[t]}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Libellé <span className="text-red-500">*</span></Label>
                <Input
                  value={libelle}
                  onChange={(e) => {
                    setLibelle(e.target.value);
                    if (errors.libelle)
                      setErrors((prev) => ({ ...prev, libelle: "" }));
                  }}
                  placeholder="Ex : Hypertension artérielle"
                  className={cn(errors.libelle && "border-red-400")}
                />
                <FieldError message={errors.libelle} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={dateFin}
                    onChange={(e) => {
                      setDateFin(e.target.value);
                      if (errors.date_fin)
                        setErrors((prev) => ({ ...prev, date_fin: "" }));
                    }}
                    className={cn(errors.date_fin && "border-red-400")}
                  />
                  <FieldError message={errors.date_fin} />
                </div>
              </div>

              {/* Actif — pour un traitement chronique, c'est ce qui */}
              {/* distingue « en cours » de « terminé » (CDC §5.1)   */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={estActif}
                  onChange={(e) => setEstActif(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-800">
                    Actif
                  </span>
                  <span className="block text-xs text-gray-400 mt-0.5">
                    {type === "TRAITEMENT_CHRONIQUE"
                      ? "Traitement actuellement suivi par le patient"
                      : "Antécédent toujours d'actualité"}
                  </span>
                </span>
              </label>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Précisions cliniques, posologie, suivi..."
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-4 sm:px-6 py-4 border-t bg-gray-50">
              <Button variant="outline" onClick={close} disabled={isPending}>
                Annuler
              </Button>
              <Button onClick={handleEnregistrer} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {estModification ? "Enregistrer" : "Ajouter"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
