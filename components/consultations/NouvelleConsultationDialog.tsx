// ============================================================
// NOUVELLE CONSULTATION — Dialog de création
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { creerConsultation } from "@/app/dashboard/consultations/actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

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

interface Prescription {
  medicament: string;
  dosage: string;
  frequence: string;
  duree: string;
}

interface NouvelleConsultationDialogProps {
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

export function NouvelleConsultationDialog({
  open,
  onOpenChange,
  hospitalId,
  medecinConnecteId,
  medecins,
  patients,
}: NouvelleConsultationDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Champs du formulaire
  const [patientId, setPatientId] = useState("");
  const [medecinId, setMedecinId] = useState(medecinConnecteId);
  const [statut, setStatut] = useState("EN_ATTENTE");
  const [formData, setFormData] = useState({
    motif: "",
    diagnostic: "",
    notes: "",
    tension: "",
    poids_kg: "",
    taille_cm: "",
    temperature: "",
  });

  // Prescriptions dynamiques
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function ajouterPrescription() {
    setPrescriptions((prev) => [
      ...prev,
      { medicament: "", dosage: "", frequence: "", duree: "" },
    ]);
  }

  function modifierPrescription(
    index: number,
    champ: keyof Prescription,
    valeur: string
  ) {
    setPrescriptions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [champ]: valeur } : p))
    );
  }

  function supprimerPrescription(index: number) {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  }

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!patientId) newErrors.patient_id = "Veuillez sélectionner un patient";
    if (!medecinId) newErrors.medecin_id = "Veuillez sélectionner un médecin";
    if (!formData.motif.trim()) newErrors.motif = "Le motif est obligatoire";

    // Vérifie que chaque prescription a au moins un médicament
    prescriptions.forEach((p, i) => {
      if (!p.medicament.trim()) {
        newErrors[`prescription_${i}`] = "Le nom du médicament est requis";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(false);
    setPatientId("");
    setMedecinId(medecinConnecteId);
    setStatut("EN_ATTENTE");
    setFormData({
      motif: "", diagnostic: "", notes: "",
      tension: "", poids_kg: "", taille_cm: "", temperature: "",
    });
    setPrescriptions([]);
    setErrors({});
    onOpenChange(false);
  }

  function handleCreer() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        await creerConsultation(hospitalId, medecinId, {
          patient_id: patientId,
          motif: formData.motif || undefined,
          diagnostic: formData.diagnostic || undefined,
          notes: formData.notes || undefined,
          tension: formData.tension || undefined,
          poids_kg: formData.poids_kg ? Number(formData.poids_kg) : undefined,
          taille_cm: formData.taille_cm ? Number(formData.taille_cm) : undefined,
          temperature: formData.temperature ? Number(formData.temperature) : undefined,
          statut: statut as "EN_ATTENTE" | "EN_COURS" | "TERMINEE" | "ANNULEE",
          prescriptions: prescriptions.filter((p) => p.medicament.trim()),
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
      <DialogContent className="!max-w-2xl w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Nouvelle consultation</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Consultation créée avec succès !
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                Nouvelle consultation
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Enregistrement d'une consultation médicale
              </p>
            </div>

            {/* Contenu scrollable */}
            <div className="overflow-y-auto p-6 space-y-6 max-h-[70vh]">

              {errors.global && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{errors.global}</p>
                </div>
              )}

              {/* Patient + Médecin + Statut */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Informations générales
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Patient <span className="text-red-500">*</span></Label>
                    <select
                      value={patientId}
                      onChange={(e) => {
                        setPatientId(e.target.value);
                        if (errors.patient_id)
                          setErrors((prev) => ({ ...prev, patient_id: "" }));
                      }}
                      className={cn(
                        selectClass,
                        errors.patient_id && "border-red-400"
                      )}
                    >
                      <option value="">Sélectionner un patient</option>
                      {patients.map(({ patient }) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.prenom} {patient.nom} — {patient.numero_dossier}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.patient_id} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Médecin <span className="text-red-500">*</span></Label>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Motif <span className="text-red-500">*</span></Label>
                    <Input
                      name="motif"
                      placeholder="Raison de la consultation..."
                      value={formData.motif}
                      onChange={handleChange}
                      className={cn(errors.motif && "border-red-400")}
                    />
                    <FieldError message={errors.motif} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Statut</Label>
                    <select
                      value={statut}
                      onChange={(e) => setStatut(e.target.value)}
                      className={selectClass}
                    >
                      <option value="EN_ATTENTE">En attente</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="TERMINEE">Terminée</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Constantes vitales */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Constantes vitales
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: "tension", label: "Tension", placeholder: "12/8" },
                    { name: "temperature", label: "Température (°C)", placeholder: "37.2" },
                    { name: "poids_kg", label: "Poids (kg)", placeholder: "70" },
                    { name: "taille_cm", label: "Taille (cm)", placeholder: "170" },
                  ].map((field) => (
                    <div key={field.name} className="space-y-1.5">
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        name={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleChange}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnostic */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Diagnostic & notes
                </p>
                <div className="space-y-1.5">
                  <Label>Diagnostic</Label>
                  <Textarea
                    name="diagnostic"
                    placeholder="Diagnostic médical..."
                    rows={2}
                    className="resize-none"
                    value={formData.diagnostic}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes complémentaires</Label>
                  <Textarea
                    name="notes"
                    placeholder="Observations, recommandations..."
                    rows={2}
                    className="resize-none"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Prescriptions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Prescriptions ({prescriptions.length})
                  </p>
                  <button
                    type="button"
                    onClick={ajouterPrescription}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter un médicament
                  </button>
                </div>

                {prescriptions.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-400">
                      Aucune prescription — cliquez sur "Ajouter un médicament"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((p, index) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-blue-700">
                            Médicament {index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => supprimerPrescription(index)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2 space-y-1">
                            <Input
                              placeholder="Nom du médicament *"
                              value={p.medicament}
                              onChange={(e) =>
                                modifierPrescription(index, "medicament", e.target.value)
                              }
                              className={cn(
                                "bg-white text-sm",
                                errors[`prescription_${index}`] && "border-red-400"
                              )}
                            />
                            <FieldError message={errors[`prescription_${index}`]} />
                          </div>
                          <Input
                            placeholder="Dosage (ex: 500mg)"
                            value={p.dosage}
                            onChange={(e) =>
                              modifierPrescription(index, "dosage", e.target.value)
                            }
                            className="bg-white text-sm"
                          />
                          <Input
                            placeholder="Fréquence (ex: 3x/jour)"
                            value={p.frequence}
                            onChange={(e) =>
                              modifierPrescription(index, "frequence", e.target.value)
                            }
                            className="bg-white text-sm"
                          />
                          <Input
                            placeholder="Durée (ex: 7 jours)"
                            value={p.duree}
                            onChange={(e) =>
                              modifierPrescription(index, "duree", e.target.value)
                            }
                            className="bg-white text-sm col-span-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Créer la consultation
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