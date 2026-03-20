// ============================================================
// NOUVELLE FACTURE — Dialog de création manuelle
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check, Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { creerFacture } from "@/app/dashboard/billing/actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const ACTES_PREDEFINIS = [
  { description: "Consultation générale",    prix: 20000 },
  { description: "Consultation spécialisée", prix: 35000 },
  { description: "Consultation prénatale",   prix: 25000 },
  { description: "Bilan sanguin",            prix: 15000 },
  { description: "Radiographie",             prix: 30000 },
  { description: "Échographie",              prix: 45000 },
  { description: "Pansement",                prix: 5000  },
  { description: "Injection",                prix: 3000  },
];

interface LigneFacture {
  description: string;
  quantite: number;
  prix_unitaire: number;
}

interface PatientHospital {
  patient: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
  };
  assurance_nom: string | null;
  taux_couverture: number | null;
}

interface NouvelleFactureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalId: string;
  patients: PatientHospital[];
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

export function NouvelleFactureDialog({
  open,
  onOpenChange,
  hospitalId,
  patients,
}: NouvelleFactureDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneFacture[]>([
    { description: "Consultation générale", quantite: 1, prix_unitaire: 20000 },
  ]);

  // Récupère assurance du patient sélectionné
  const patientSelectionne = patients.find((p) => p.patient.id === patientId);
  const tauxAssurance = patientSelectionne?.taux_couverture ?? 0;
  const assuranceNom = patientSelectionne?.assurance_nom ?? null;

  // Calculs en temps réel
  const montantTotal = lignes.reduce(
    (sum, l) => sum + l.quantite * l.prix_unitaire,
    0
  );
  const montantAssurance = Math.round(montantTotal * (tauxAssurance / 100));
  const montantPatient = montantTotal - montantAssurance;

  function ajouterLigne() {
    setLignes((prev) => [
      ...prev,
      { description: "", quantite: 1, prix_unitaire: 0 },
    ]);
  }

  function modifierLigne(
    index: number,
    champ: keyof LigneFacture,
    valeur: string | number
  ) {
    setLignes((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [champ]: valeur } : l))
    );
  }

  function supprimerLigne(index: number) {
    if (lignes.length === 1) return;
    setLignes((prev) => prev.filter((_, i) => i !== index));
  }

  function ajouterActePredefini(acte: { description: string; prix: number }) {
    setLignes((prev) => [
      ...prev,
      { description: acte.description, quantite: 1, prix_unitaire: acte.prix },
    ]);
  }

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!patientId) newErrors.patient = "Veuillez sélectionner un patient";
    lignes.forEach((l, i) => {
      if (!l.description.trim()) newErrors[`ligne_${i}`] = "La description est requise";
      if (l.prix_unitaire <= 0) newErrors[`prix_${i}`] = "Le prix doit être supérieur à 0";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(false);
    setPatientId("");
    setNotes("");
    setLignes([{ description: "Consultation générale", quantite: 1, prix_unitaire: 20000 }]);
    setErrors({});
    onOpenChange(false);
  }

  function handleCreer() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        await creerFacture(hospitalId, {
          patient_id: patientId,
          lignes,
          notes: notes || undefined,
          taux_assurance: tauxAssurance,
        });
        setSucces(true);
        router.refresh();
        setTimeout(() => close(), 1500);
      } catch (error) {
        setErrors({ global: "Erreur lors de la création. Veuillez réessayer." });
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="!max-w-3xl w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Nouvelle facture</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">
              Facture créée avec succès !
            </p>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                Nouvelle facture
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Création d'une facture manuelle
              </p>
            </div>

            <div className="flex" style={{ maxHeight: "70vh" }}>

              {/* Colonne gauche — formulaire */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {errors.global && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{errors.global}</p>
                  </div>
                )}

                {/* Patient */}
                <div className="space-y-1.5">
                  <Label>
                    Patient <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={patientId}
                    onChange={(e) => {
                      setPatientId(e.target.value);
                      if (errors.patient)
                        setErrors((prev) => ({ ...prev, patient: "" }));
                    }}
                    className={cn(selectClass, errors.patient && "border-red-400")}
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map(({ patient }) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.prenom} {patient.nom} — {patient.numero_dossier}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.patient} />

                  {/* Badge assurance si patient sélectionné */}
                  {assuranceNom && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        🛡️ {assuranceNom} — {tauxAssurance}% pris en charge
                      </p>
                    </div>
                  )}
                </div>

                {/* Actes prédéfinis */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actes rapides
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ACTES_PREDEFINIS.map((acte) => (
                      <button
                        key={acte.description}
                        type="button"
                        onClick={() => ajouterActePredefini(acte)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-all"
                      >
                        + {acte.description}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lignes de facturation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Lignes de facturation
                    </p>
                    <button
                      type="button"
                      onClick={ajouterLigne}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter une ligne
                    </button>
                  </div>

                  {/* En-têtes colonnes */}
                  <div className="grid grid-cols-12 gap-2 px-1">
                    <p className="col-span-6 text-xs text-gray-400">Description</p>
                    <p className="col-span-2 text-xs text-gray-400 text-center">Qté</p>
                    <p className="col-span-3 text-xs text-gray-400 text-right">Prix unit.</p>
                    <p className="col-span-1"></p>
                  </div>

                  {lignes.map((ligne, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-6">
                        <Input
                          placeholder="Description de l'acte"
                          value={ligne.description}
                          onChange={(e) =>
                            modifierLigne(index, "description", e.target.value)
                          }
                          className={cn(
                            "text-sm",
                            errors[`ligne_${index}`] && "border-red-400"
                          )}
                        />
                        <FieldError message={errors[`ligne_${index}`]} />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={1}
                          value={ligne.quantite}
                          onChange={(e) =>
                            modifierLigne(index, "quantite", Number(e.target.value))
                          }
                          className="text-sm text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min={0}
                          value={ligne.prix_unitaire}
                          onChange={(e) =>
                            modifierLigne(index, "prix_unitaire", Number(e.target.value))
                          }
                          className={cn(
                            "text-sm text-right",
                            errors[`prix_${index}`] && "border-red-400"
                          )}
                        />
                        <FieldError message={errors[`prix_${index}`]} />
                      </div>
                      <div className="col-span-1 flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => supprimerLigne(index)}
                          disabled={lignes.length === 1}
                          className="text-red-400 hover:text-red-600 disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Input
                    placeholder="Notes optionnelles..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Colonne droite — récapitulatif */}
              <div className="w-56 shrink-0 border-l bg-gray-50 p-5 flex flex-col gap-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Récapitulatif
                </p>

                {/* Détail lignes */}
                <div className="space-y-2 flex-1">
                  {lignes.map((l, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600 truncate max-w-[100px]">
                        {l.description || `Ligne ${i + 1}`}
                      </span>
                      <span className="text-gray-800 font-medium shrink-0 ml-1">
                        {formatCurrency(l.quantite * l.prix_unitaire)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totaux */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold">
                      {formatCurrency(montantTotal)}
                    </span>
                  </div>

                  {tauxAssurance > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">
                        Assurance ({tauxAssurance}%)
                      </span>
                      <span className="text-green-600 font-medium">
                        -{formatCurrency(montantAssurance)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-900">
                      À payer
                    </span>
                    <span className="text-base font-bold text-blue-700">
                      {formatCurrency(montantPatient)}
                    </span>
                  </div>

                  {tauxAssurance > 0 && (
                    <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs text-green-700 text-center">
                        🛡️ {assuranceNom} couvre{" "}
                        {formatCurrency(montantAssurance)}
                      </p>
                    </div>
                  )}
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
                    Créer la facture
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