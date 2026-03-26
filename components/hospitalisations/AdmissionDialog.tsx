// ============================================================
// ADMISSION DIALOG — Admettre un patient en hospitalisation
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, AlertCircle, BedDouble } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { admettrePatienten } from "@/app/dashboard/hospitalisations/actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const TYPES_CHAMBRE: Record<string, string> = {
  COMMUNE:     "Commune",
  PRIVEE:      "Privée",
  VIP:         "VIP",
  REANIMATION: "Réanimation",
};

interface Medecin {
  id:     string;
  nom:    string;
  prenom: string;
}

interface PatientHospital {
  patient: {
    id:             string;
    nom:            string;
    prenom:         string;
    numero_dossier: string;
  };
}

interface Chambre {
  id:              string;
  numero:          string;
  type_chambre:    string;
  prix_journalier: number;
  est_disponible:  boolean;
}

interface AdmissionDialogProps {
  open:           boolean;
  onOpenChange:   (open: boolean) => void;
  medecins:       Medecin[];
  patients:       PatientHospital[];
  chambres:       Chambre[];
  hospitalId:     string;
  utilisateurId:  string;
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

export function AdmissionDialog({
  open,
  onOpenChange,
  medecins,
  patients,
  chambres,
  hospitalId,
  utilisateurId,
  utilisateurNom,
}: AdmissionDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [patientId,   setPatientId]   = useState("");
  const [medecinId,   setMedecinId]   = useState("");
  const [chambreId,   setChambreId]   = useState("");
  const [motif,       setMotif]       = useState("");

  // Chambre sélectionnée pour afficher le tarif
  const chambreSelectionnee = chambres.find((c) => c.id === chambreId);
  const chambresDisponibles = chambres.filter((c) => c.est_disponible);

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!patientId) newErrors.patient  = "Veuillez sélectionner un patient";
    if (!medecinId) newErrors.medecin  = "Veuillez sélectionner un médecin";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(false);
    setPatientId("");
    setMedecinId("");
    setChambreId("");
    setMotif("");
    setErrors({});
    onOpenChange(false);
  }

  function handleAdmettre() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        const hospit = await admettrePatienten(
          hospitalId,
          utilisateurId,
          utilisateurNom,
          {
            patient_id:       patientId,
            medecin_id:       medecinId,
            chambre_id:       chambreId || undefined,
            motif_admission:  motif || undefined,
          }
        );
        setSucces(true);
        router.refresh();
        // Redirige vers la fiche après 1.5s
        setTimeout(() => {
          close();
          router.push(`/dashboard/hospitalisations/${hospit.id}`);
        }, 1500);
      } catch (error) {
        setErrors({ global: "Erreur lors de l'admission. Veuillez réessayer." });
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg! w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Admettre un patient</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Patient admis !
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Redirection vers la fiche...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <BedDouble className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Admission hospitalisation
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Une facture est créée automatiquement à l&apos;admission
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 max-h-[65vh]">

              {errors.global && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{errors.global}</p>
                </div>
              )}

              {/* Patient */}
              <div className="space-y-1.5">
                <Label>Patient <span className="text-red-500">*</span></Label>
                <select
                  value={patientId}
                  onChange={(e) => {
                    setPatientId(e.target.value);
                    if (errors.patient) setErrors((p) => ({ ...p, patient: "" }));
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
              </div>

              {/* Médecin responsable */}
              <div className="space-y-1.5">
                <Label>Médecin responsable <span className="text-red-500">*</span></Label>
                <select
                  value={medecinId}
                  onChange={(e) => {
                    setMedecinId(e.target.value);
                    if (errors.medecin) setErrors((p) => ({ ...p, medecin: "" }));
                  }}
                  className={cn(selectClass, errors.medecin && "border-red-400")}
                >
                  <option value="">Sélectionner un médecin</option>
                  {medecins.map((m) => (
                    <option key={m.id} value={m.id}>
                      Dr. {m.prenom} {m.nom}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.medecin} />
              </div>

              {/* Chambre */}
              <div className="space-y-1.5">
                <Label>
                  Chambre
                  <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
                </Label>
                <select
                  value={chambreId}
                  onChange={(e) => setChambreId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Sans chambre assignée</option>
                  {chambresDisponibles.map((c) => (
                    <option key={c.id} value={c.id}>
                      Chambre {c.numero} — {TYPES_CHAMBRE[c.type_chambre] ?? c.type_chambre} — {formatCurrency(c.prix_journalier)}/jour
                    </option>
                  ))}
                </select>

                {/* Aperçu tarif chambre */}
                {chambreSelectionnee && (
                  <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                    <BedDouble className="h-4 w-4 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-700">
                      <span className="font-semibold">
                        {formatCurrency(chambreSelectionnee.prix_journalier)}
                      </span>
                      {" "}/jour — La première journée sera facturée à l&apos;admission
                    </p>
                  </div>
                )}

                {chambresDisponibles.length === 0 && (
                  <p className="text-xs text-orange-600">
                    ⚠️ Aucune chambre disponible actuellement
                  </p>
                )}
              </div>

              {/* Motif d'admission */}
              <div className="space-y-1.5">
                <Label>Motif d&apos;admission</Label>
                <Textarea
                  placeholder="Raison de l'hospitalisation, symptômes principaux..."
                  rows={3}
                  className="resize-none"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
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
                onClick={handleAdmettre}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Admission...
                  </>
                ) : (
                  <>
                    <BedDouble className="h-4 w-4 mr-1.5" />
                    Admettre le patient
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