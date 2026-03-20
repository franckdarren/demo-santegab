// ============================================================
// SUPPRIMER PATIENT — Dialog de confirmation
//
// Affiche un dialog de confirmation avant suppression.
// Gère les erreurs côté client avec un message visible.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { supprimerPatient } from "@/app/dashboard/patients/actions";

interface SupprimerPatientDialogProps {
  patientId: string;
  nomPatient: string;
  hospitalId: string;
}

export function SupprimerPatientDialog({
  patientId,
  nomPatient,
  hospitalId,
}: SupprimerPatientDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  function handleSupprimer() {
  setErreur(null);

  startTransition(async () => {
    try {
      await supprimerPatient(patientId, hospitalId);
      // On ferme d'abord le dialog puis on redirige
      // router.refresh() seul après push cause un blocage
      setOpen(false);
      window.location.href = "/dashboard/patients";
    } catch (error) {
      setErreur("Une erreur est survenue lors de la suppression. Veuillez réessayer.");
      console.error("Erreur suppression :", error);
    }
  });
}

  function handleClose() {
    // Ne ferme pas si une suppression est en cours
    if (isPending) return;
    setErreur(null);
    setOpen(false);
  }

  return (
    <>
      {/* Bouton qui ouvre le dialog */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-300"
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        Supprimer
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">

          {/* Titre avec icône d'alerte */}
          <DialogTitle className="flex items-center gap-3 text-gray-900">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            Supprimer le patient
          </DialogTitle>

          {/* Description principale */}
          <DialogDescription className="text-gray-600">
            Vous êtes sur le point de retirer{" "}
            <span className="font-semibold text-gray-900">{nomPatient}</span>{" "}
            de votre établissement.
          </DialogDescription>

          {/* Détail de ce qui sera supprimé */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-semibold text-amber-700">
              ⚠️ Cette action va supprimer :
            </p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Le dossier du patient dans votre établissement</li>
              <li>Toutes ses consultations enregistrées ici</li>
              <li>Toutes ses prescriptions associées</li>
              <li>Toutes ses factures liées à votre établissement</li>
            </ul>
            <p className="text-xs text-amber-600 mt-2 font-medium">
              Le dossier global du patient est conservé s'il est
              suivi dans d'autres structures.
            </p>
          </div>

          {/* Message d'erreur si la suppression échoue */}
          {erreur && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{erreur}</p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Annuler
            </Button>

            <Button
              type="button"
              disabled={isPending}
              onClick={handleSupprimer}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Confirmer la suppression
                </>
              )}
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}