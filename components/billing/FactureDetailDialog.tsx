// ============================================================
// FACTURE DETAIL — Voir, payer, annuler et télécharger en PDF
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Loader2, X, CreditCard, XCircle } from "lucide-react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { payerFacture, annulerFacture } from "@/app/dashboard/billing/actions";
import { StatutFacture } from "@/app/generated/prisma/client";
import { DownloadFacturePDF } from "./DownloadFacturePDF";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const STATUT_CONFIG: Record<StatutFacture, { label: string; color: string }> = {
  EN_ATTENTE:          { label: "En attente", color: "bg-orange-100 text-orange-700" },
  PARTIELLEMENT_PAYEE: { label: "Partiel",    color: "bg-yellow-100 text-yellow-700" },
  PAYEE:               { label: "Payée",      color: "bg-green-100 text-green-700" },
  ANNULEE:             { label: "Annulée",    color: "bg-red-100 text-red-700" },
};

const MODES_PAIEMENT = [
  { value: "ESPECES",        label: "Espèces" },
  { value: "CARTE_BANCAIRE", label: "Carte bancaire" },
  { value: "MOBILE_MONEY",   label: "Mobile Money (Airtel/Moov)" },
  { value: "ASSURANCE",      label: "Assurance" },
  { value: "CHEQUE",         label: "Chèque" },
];

interface Facture {
  id: string;
  numero_facture: string;
  statut: StatutFacture;
  montant_total: number;
  montant_assurance: number;
  montant_patient: number;
  mode_paiement: string | null;
  date_paiement: Date | null;
  notes: string | null;
  created_at: Date;
  patient: { id: string; nom: string; prenom: string };
  lignes: Array<{
    id: string;
    description: string;
    quantite: number;
    prix_unitaire: number;
    montant_total: number;
  }>;
  consultation: {
    medecin: { nom: string; prenom: string };
  } | null;
}

interface Hospital {
  nom: string;
  adresse?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
}

interface FactureDetailDialogProps {
  facture: Facture;
  hospitalId: string;
  hospital: Hospital;
  utilisateurId: string;  // ← ajouté pour l'audit
  utilisateurNom: string; // ← ajouté pour l'audit
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FactureDetailDialog({
  facture,
  hospitalId,
  hospital,
  utilisateurId,  // ← ajouté
  utilisateurNom, // ← ajouté
  open,
  onOpenChange,
}: FactureDetailDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modePaiement, setModePaiement] = useState("ESPECES");
  const [confirmation, setConfirmation] = useState<"payer" | "annuler" | null>(null);
  const [succes, setSucces] = useState<"paye" | "annule" | null>(null);

  const nomPatient   = `${facture.patient.prenom} ${facture.patient.nom}`;
  const statutConfig = STATUT_CONFIG[facture.statut];
  const peutPayer    = facture.statut === "EN_ATTENTE" || facture.statut === "PARTIELLEMENT_PAYEE";
  const peutAnnuler  = facture.statut === "EN_ATTENTE";

  function handlePayer() {
    startTransition(async () => {
      try {
        // ← utilisateurId + utilisateurNom ajoutés
        await payerFacture(
          facture.id,
          hospitalId,
          modePaiement,
          utilisateurId,
          utilisateurNom
        );
        setSucces("paye");
        router.refresh();
        setTimeout(() => {
          setSucces(null);
          setConfirmation(null);
          onOpenChange(false);
        }, 1500);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function handleAnnuler() {
    startTransition(async () => {
      try {
        // ← utilisateurId + utilisateurNom ajoutés
        await annulerFacture(
          facture.id,
          hospitalId,
          utilisateurId,
          utilisateurNom
        );
        setSucces("annule");
        router.refresh();
        setTimeout(() => {
          setSucces(null);
          setConfirmation(null);
          onOpenChange(false);
        }, 1500);
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl! w-full p-0 overflow-hidden gap-0 [&>button:first-of-type]:hidden">
        <DialogTitle className="sr-only">Détail facture</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              succes === "paye" ? "bg-green-100" : "bg-red-100"
            )}>
              {succes === "paye" ? (
                <Check className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {succes === "paye" ? "Paiement enregistré !" : "Facture annulée"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {facture.numero_facture}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {nomPatient} · Émise le {formatDate(facture.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs border-0", statutConfig.color)}>
                  {statutConfig.label}
                </Badge>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="overflow-y-auto p-6 space-y-5 max-h-[55vh]">

              {/* Tableau des actes */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Détail des actes
                </p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b">
                    <p className="col-span-6 text-xs text-gray-400 font-medium">Description</p>
                    <p className="col-span-2 text-xs text-gray-400 font-medium text-center">Qté</p>
                    <p className="col-span-2 text-xs text-gray-400 font-medium text-right">Prix unit.</p>
                    <p className="col-span-2 text-xs text-gray-400 font-medium text-right">Total</p>
                  </div>
                  {facture.lignes.map((ligne) => (
                    <div
                      key={ligne.id}
                      className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b last:border-0"
                    >
                      <p className="col-span-6 text-sm text-gray-800">{ligne.description}</p>
                      <p className="col-span-2 text-sm text-gray-600 text-center">{ligne.quantite}</p>
                      <p className="col-span-2 text-sm text-gray-600 text-right">
                        {formatCurrency(ligne.prix_unitaire)}
                      </p>
                      <p className="col-span-2 text-sm font-medium text-gray-800 text-right">
                        {formatCurrency(ligne.montant_total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totaux */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{formatCurrency(facture.montant_total)}</span>
                </div>
                {facture.montant_assurance > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Part assurance</span>
                    <span className="text-green-600 font-medium">
                      -{formatCurrency(facture.montant_assurance)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Reste à payer</span>
                  <span className="text-lg font-bold text-blue-700">
                    {formatCurrency(facture.montant_patient)}
                  </span>
                </div>
              </div>

              {/* Info paiement si déjà payée */}
              {facture.statut === "PAYEE" && facture.date_paiement && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-700 mb-1">
                    ✅ Paiement reçu
                  </p>
                  <p className="text-xs text-green-600">
                    Le {formatDate(facture.date_paiement)} ·{" "}
                    {MODES_PAIEMENT.find((m) => m.value === facture.mode_paiement)?.label ??
                      facture.mode_paiement}
                  </p>
                </div>
              )}

              {/* Notes */}
              {facture.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-gray-700">{facture.notes}</p>
                </div>
              )}

              {/* Zone de paiement */}
              {peutPayer && !confirmation && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Enregistrer le paiement
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-500">Mode de paiement</p>
                    <select
                      value={modePaiement}
                      onChange={(e) => setModePaiement(e.target.value)}
                      className={cn(selectClass, "bg-white")}
                    >
                      {MODES_PAIEMENT.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Confirmation paiement */}
              {confirmation === "payer" && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-2">
                  <p className="text-sm font-semibold text-green-800">
                    Confirmer le paiement de{" "}
                    {formatCurrency(facture.montant_patient)} ?
                  </p>
                  <p className="text-xs text-green-700">
                    Mode :{" "}
                    {MODES_PAIEMENT.find((m) => m.value === modePaiement)?.label}
                  </p>
                </div>
              )}

              {/* Confirmation annulation */}
              {confirmation === "annuler" && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-2">
                  <p className="text-sm font-semibold text-red-800">
                    ⚠️ Confirmer l'annulation de cette facture ?
                  </p>
                  <p className="text-xs text-red-600">
                    Cette action est irréversible.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 flex flex-col gap-3 px-6 py-4 border-t bg-gray-50">

              {/* Ligne 1 — bouton PDF */}
              <DownloadFacturePDF facture={facture} hospital={hospital} />

              {/* Ligne 2 — actions */}
              <div className="flex justify-between items-center">

                <div>
                  {peutAnnuler && !confirmation && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmation("annuler")}
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Annuler la facture
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {confirmation && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setConfirmation(null)}
                      disabled={isPending}
                      className="text-gray-500"
                    >
                      Retour
                    </Button>
                  )}

                  {!confirmation && !peutPayer && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                      className="text-gray-500"
                    >
                      Fermer
                    </Button>
                  )}

                  {peutPayer && !confirmation && (
                    <Button
                      type="button"
                      onClick={() => setConfirmation("payer")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CreditCard className="h-4 w-4 mr-1.5" />
                      Encaisser {formatCurrency(facture.montant_patient)}
                    </Button>
                  )}

                  {confirmation === "payer" && (
                    <Button
                      type="button"
                      disabled={isPending}
                      onClick={handlePayer}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1.5" />
                          Confirmer le paiement
                        </>
                      )}
                    </Button>
                  )}

                  {confirmation === "annuler" && (
                    <Button
                      type="button"
                      disabled={isPending}
                      onClick={handleAnnuler}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Annulation...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Confirmer l'annulation
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}