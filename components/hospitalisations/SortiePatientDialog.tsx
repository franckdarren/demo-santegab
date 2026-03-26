// ============================================================
// SORTIE PATIENT — Clôturer une hospitalisation
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Check, Loader2, AlertCircle, LogOut,
  CreditCard, AlertTriangle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  cloturerHospitalisation,
  payerHospitalisation,
} from "@/app/dashboard/hospitalisations/actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const MODES_PAIEMENT = [
  { value: "ESPECES",        label: "Espèces" },
  { value: "CARTE_BANCAIRE", label: "Carte bancaire" },
  { value: "MOBILE_MONEY",   label: "Mobile Money (Airtel/Moov)" },
  { value: "ASSURANCE",      label: "Assurance" },
  { value: "CHEQUE",         label: "Chèque" },
];

interface SortiePatientDialogProps {
  open:              boolean;
  onOpenChange:      (open: boolean) => void;
  hospitalisationId: string;
  hospitalId:        string;
  utilisateurId:     string;
  utilisateurNom:    string;
  nomPatient:        string;
  statut:            string;
  montantTotal:      number;
  montantPatient:    number;
  montantAssurance:  number;
  nbLignesAttente:   number;
}

export function SortiePatientDialog({
  open,
  onOpenChange,
  hospitalisationId,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  nomPatient,
  statut,
  montantTotal,
  montantPatient,
  montantAssurance,
  nbLignesAttente,
}: SortiePatientDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [etape, setEtape]             = useState<"sortie" | "paiement">(
    statut === "SORTIE" ? "paiement" : "sortie"
  );
  const [succes, setSucces]           = useState(false);
  const [erreur, setErreur]           = useState<string | null>(null);

  const [diagnostic,    setDiagnostic]    = useState("");
  const [notes,         setNotes]         = useState("");
  const [modePaiement,  setModePaiement]  = useState("ESPECES");

  function close() {
    setSucces(false);
    setErreur(null);
    setDiagnostic("");
    setNotes("");
    setModePaiement("ESPECES");
    setEtape(statut === "SORTIE" ? "paiement" : "sortie");
    onOpenChange(false);
  }

  function handleSortie() {
    startTransition(async () => {
      try {
        await cloturerHospitalisation(
          hospitalisationId,
          hospitalId,
          utilisateurId,
          utilisateurNom,
          { diagnostic: diagnostic || undefined, notes: notes || undefined }
        );
        router.refresh();
        setEtape("paiement");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erreur lors de la sortie.";
        setErreur(message);
        console.error(error);
      }
    });
  }

  function handlePayer() {
    startTransition(async () => {
      try {
        await payerHospitalisation(
          hospitalisationId,
          hospitalId,
          modePaiement,
          utilisateurId,
          utilisateurNom
        );
        setSucces(true);
        router.refresh();
        setTimeout(() => {
          close();
          router.push("/dashboard/hospitalisations");
        }, 1800);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erreur lors du paiement.";
        setErreur(message);
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="!max-w-md w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Sortie patient</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-10">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">
                Paiement enregistré !
              </p>
              <p className="text-sm text-gray-500 mt-1">
                L&apos;écriture comptable a été générée automatiquement.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Header */}
            <div className="px-5 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                {etape === "sortie" ? "Sortie du patient" : "Encaisser l'hospitalisation"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{nomPatient}</p>

              {/* Indicateur étape */}
              <div className="flex items-center gap-2 mt-3">
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                  etape === "sortie"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                )}>
                  <span className={cn(
                    "w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold",
                    etape === "sortie" ? "bg-blue-700 text-white" : "bg-green-600 text-white"
                  )}>
                    {etape === "sortie" ? "1" : "✓"}
                  </span>
                  Sortie
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                  etape === "paiement"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-400"
                )}>
                  <span className={cn(
                    "w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold",
                    etape === "paiement" ? "bg-blue-700 text-white" : "bg-gray-300 text-white"
                  )}>
                    2
                  </span>
                  Paiement
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">

              {erreur && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{erreur}</p>
                </div>
              )}

              {/* ------------------------------------------ */}
              {/* ÉTAPE 1 — Sortie                           */}
              {/* ------------------------------------------ */}
              {etape === "sortie" && (
                <>
                  {/* Alerte lignes en attente */}
                  {nbLignesAttente > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-orange-700">
                          {nbLignesAttente} ligne{nbLignesAttente > 1 ? "s" : ""} en attente de stock
                        </p>
                        <p className="text-xs text-orange-600 mt-0.5">
                          Ces lignes ne seront pas facturées. Seules les lignes SERVIES sont incluses.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Diagnostic de sortie</Label>
                    <Textarea
                      placeholder="Diagnostic final, état du patient à la sortie..."
                      rows={3}
                      className="resize-none"
                      value={diagnostic}
                      onChange={(e) => setDiagnostic(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Notes de sortie</Label>
                    <Textarea
                      placeholder="Recommandations, suivi post-hospitalisation..."
                      rows={2}
                      className="resize-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Récap montant */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-1.5">
                    <p className="text-xs font-semibold text-blue-700">
                      Récapitulatif facturation
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total séjour</span>
                      <span className="font-medium">{formatCurrency(montantTotal)}</span>
                    </div>
                    {montantAssurance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Part assurance</span>
                        <span className="text-green-600 font-medium">
                          -{formatCurrency(montantAssurance)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-blue-200">
                      <span className="text-gray-900">À payer</span>
                      <span className="text-blue-700">{formatCurrency(montantPatient)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* ------------------------------------------ */}
              {/* ÉTAPE 2 — Paiement                         */}
              {/* ------------------------------------------ */}
              {etape === "paiement" && (
                <>
                  {/* Récap montant final */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total séjour</span>
                      <span className="font-medium">{formatCurrency(montantTotal)}</span>
                    </div>
                    {montantAssurance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Part assurance</span>
                        <span className="text-green-600 font-medium">
                          -{formatCurrency(montantAssurance)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                      <span className="text-gray-900">Reste à payer</span>
                      <span className="text-xl text-blue-700">
                        {formatCurrency(montantPatient)}
                      </span>
                    </div>
                  </div>

                  {/* Mode de paiement */}
                  <div className="space-y-1.5">
                    <Label>Mode de paiement</Label>
                    <select
                      value={modePaiement}
                      onChange={(e) => setModePaiement(e.target.value)}
                      className={selectClass}
                    >
                      {MODES_PAIEMENT.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs text-green-700">
                      💡 Une écriture comptable RECETTE sera générée automatiquement après le paiement.
                    </p>
                  </div>
                </>
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

              {etape === "sortie" ? (
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={handleSortie}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4 mr-1.5" />
                      Valider la sortie
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={handlePayer}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Paiement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-1.5" />
                      Encaisser {formatCurrency(montantPatient)}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}