"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { creerExamenImagerie } from "@/app/dashboard/imaging/actions";
import { TypeExamenImagerie } from "@/app/generated/prisma/client";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const TYPES_EXAMEN: { value: TypeExamenImagerie; label: string }[] = [
  { value: "RADIOGRAPHIE", label: "Radiographie" },
  { value: "ECHOGRAPHIE",  label: "Échographie" },
  { value: "SCANNER",      label: "Scanner" },
  { value: "IRM",          label: "IRM" },
  { value: "MAMMOGRAPHIE", label: "Mammographie" },
  { value: "AUTRE",        label: "Autre" },
];

// Zones anatomiques courantes pour la démo
const ZONES_ANATOMIQUES = [
  "Thorax", "Abdomen", "Crâne", "Colonne vertébrale",
  "Bassin", "Membres supérieurs", "Membres inférieurs", "Autre",
];

interface Medecin {
  id: string;
  nom: string;
  prenom: string;
}

interface PatientHospital {
  patient: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
  };
}

interface NouvelleDemandeImagerieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalId: string;
  medecinConnecteId: string;
  medecins: Medecin[];
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

export function NouvelleDemandeImagerieDialog({
  open,
  onOpenChange,
  hospitalId,
  medecinConnecteId,
  medecins,
  patients,
}: NouvelleDemandeImagerieDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [patientId, setPatientId] = useState("");
  const [medecinId, setMedecinId] = useState(medecinConnecteId);
  const [typeExamen, setTypeExamen] = useState<TypeExamenImagerie>("RADIOGRAPHIE");
  const [zoneAnatomique, setZoneAnatomique] = useState("");
  const [notes, setNotes] = useState("");
  const [urgence, setUrgence] = useState(false);

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!patientId) newErrors.patient = "Veuillez sélectionner un patient";
    if (!medecinId) newErrors.medecin = "Veuillez sélectionner un médecin";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(false);
    setPatientId("");
    setMedecinId(medecinConnecteId);
    setTypeExamen("RADIOGRAPHIE");
    setZoneAnatomique("");
    setNotes("");
    setUrgence(false);
    setErrors({});
    onOpenChange(false);
  }

  function handleCreer() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        await creerExamenImagerie(hospitalId, {
          patient_id: patientId,
          medecin_id: medecinId,
          type_examen: typeExamen,
          zone_anatomique: zoneAnatomique || undefined,
          notes: notes || undefined,
          urgence,
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
      <DialogContent className="!max-w-lg w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Nouvelle demande d'imagerie</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">
              Demande créée avec succès !
            </p>
          </div>
        ) : (
          <div className="flex flex-col">

            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                Nouvelle demande d'imagerie
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Radiologie — Imagerie médicale
              </p>
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
              </div>

              {/* Médecin */}
              <div className="space-y-1.5">
                <Label>Médecin prescripteur <span className="text-red-500">*</span></Label>
                <select
                  value={medecinId}
                  onChange={(e) => setMedecinId(e.target.value)}
                  className={selectClass}
                >
                  {medecins.map((m) => (
                    <option key={m.id} value={m.id}>
                      Dr. {m.prenom} {m.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type + Zone anatomique */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type d'examen <span className="text-red-500">*</span></Label>
                  <select
                    value={typeExamen}
                    onChange={(e) => setTypeExamen(e.target.value as TypeExamenImagerie)}
                    className={selectClass}
                  >
                    {TYPES_EXAMEN.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Zone anatomique</Label>
                  <select
                    value={zoneAnatomique}
                    onChange={(e) => setZoneAnatomique(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Sélectionner...</option>
                    {ZONES_ANATOMIQUES.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Urgence */}
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  urgence
                    ? "bg-red-50 border-red-300"
                    : "bg-gray-50 border-gray-200 hover:border-red-200"
                )}
                onClick={() => setUrgence(!urgence)}
              >
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  urgence ? "bg-red-600 border-red-600" : "border-gray-300"
                )}>
                  {urgence && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    urgence ? "text-red-600" : "text-gray-400"
                  )} />
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      urgence ? "text-red-700" : "text-gray-700"
                    )}>
                      Examen urgent
                    </p>
                    <p className="text-xs text-gray-400">
                      Priorité maximale — traitement immédiat
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes cliniques</Label>
                <Textarea
                  placeholder="Contexte clinique, indications particulières..."
                  rows={3}
                  className="resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

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
                className={cn(
                  "text-white",
                  urgence
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-700 hover:bg-blue-800"
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Créer la demande
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