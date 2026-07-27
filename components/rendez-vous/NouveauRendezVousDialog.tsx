// ============================================================
// NOUVEAU RENDEZ-VOUS — Dialog de création
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
import { creerRendezVous } from "@/app/dashboard/rendez-vous/actions";

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

interface Service {
  id: string;
  nom: string;
  couleur: string;
}

interface NouveauRendezVousDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
  medecins: Medecin[];
  patients: PatientHospital[];
  services: Service[];
  // Date pré-remplie = jour affiché dans le calendrier (format YYYY-MM-DD)
  dateParDefaut: string;
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

export function NouveauRendezVousDialog({
  open,
  onOpenChange,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  medecins,
  patients,
  services,
  dateParDefaut,
}: NouveauRendezVousDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Champs du formulaire
  const [patientId, setPatientId] = useState("");
  const [medecinId, setMedecinId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate]           = useState(dateParDefaut);
  const [heure, setHeure]         = useState("09:00");
  const [dureeMin, setDureeMin]   = useState("30");
  const [motif, setMotif]         = useState("");
  const [notes, setNotes]         = useState("");

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!patientId) newErrors.patient_id = "Veuillez sélectionner un patient";
    if (!medecinId) newErrors.medecin_id = "Veuillez sélectionner un médecin";
    if (!date)      newErrors.date       = "La date est obligatoire";
    if (!heure)     newErrors.heure      = "L'heure est obligatoire";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(false);
    setPatientId("");
    setMedecinId("");
    setServiceId("");
    setDate(dateParDefaut);
    setHeure("09:00");
    setDureeMin("30");
    setMotif("");
    setNotes("");
    setErrors({});
    onOpenChange(false);
  }

  function handleCreer() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        // Date + heure saisies séparément → un seul DateTime
        const dateHeure = new Date(`${date}T${heure}`);

        await creerRendezVous(hospitalId, utilisateurId, utilisateurNom, {
          patient_id: patientId,
          medecin_id: medecinId,
          service_id: serviceId || undefined,
          date_heure: dateHeure,
          duree_min:  Number(dureeMin),
          motif:      motif || undefined,
          notes:      notes || undefined,
        });

        setSucces(true);
        router.refresh();
        setTimeout(() => close(), 1500);
      } catch (error) {
        // Le message du serveur est utile à l'utilisateur
        // (ex : « Ce médecin a déjà un rendez-vous à 09:00 »)
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors de la création. Veuillez réessayer.";
        setErrors({ global: message });
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-2xl! w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Nouveau rendez-vous</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Rendez-vous créé avec succès !
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                Nouveau rendez-vous
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Planification d&apos;une consultation à venir
              </p>
            </div>

            {/* Contenu scrollable */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-6 max-h-[60vh] sm:max-h-[70vh]">

              {errors.global && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{errors.global}</p>
                </div>
              )}

              {/* Patient + médecin */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Informations générales
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Patient <span className="text-red-500">*</span></Label>
                    <select
                      value={patientId}
                      onChange={(e) => {
                        setPatientId(e.target.value);
                        if (errors.patient_id)
                          setErrors((prev) => ({ ...prev, patient_id: "" }));
                      }}
                      className={cn(selectClass, errors.patient_id && "border-red-400")}
                    >
                      <option value="">Sélectionner un patient</option>
                      {patients.map((p) => (
                        <option key={p.patient.id} value={p.patient.id}>
                          {p.patient.prenom} {p.patient.nom} — {p.patient.numero_dossier}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.patient_id} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Médecin <span className="text-red-500">*</span></Label>
                    <select
                      value={medecinId}
                      onChange={(e) => {
                        setMedecinId(e.target.value);
                        if (errors.medecin_id)
                          setErrors((prev) => ({ ...prev, medecin_id: "" }));
                      }}
                      className={cn(selectClass, errors.medecin_id && "border-red-400")}
                    >
                      <option value="">Sélectionner un médecin</option>
                      {medecins.map((m) => (
                        <option key={m.id} value={m.id}>
                          Dr. {m.prenom} {m.nom}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.medecin_id} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Service</Label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Aucun service précis</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Créneau */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Créneau
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        if (errors.date)
                          setErrors((prev) => ({ ...prev, date: "" }));
                      }}
                      className={cn(errors.date && "border-red-400")}
                    />
                    <FieldError message={errors.date} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Heure <span className="text-red-500">*</span></Label>
                    <Input
                      type="time"
                      value={heure}
                      onChange={(e) => {
                        setHeure(e.target.value);
                        if (errors.heure)
                          setErrors((prev) => ({ ...prev, heure: "" }));
                      }}
                      className={cn(errors.heure && "border-red-400")}
                    />
                    <FieldError message={errors.heure} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Durée</Label>
                    <select
                      value={dureeMin}
                      onChange={(e) => setDureeMin(e.target.value)}
                      className={selectClass}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">1 heure</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Motif + notes */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Détails
                </p>

                <div className="space-y-1.5">
                  <Label>Motif</Label>
                  <Input
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="Ex : contrôle post-opératoire"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informations complémentaires"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-4 sm:px-6 py-4 border-t bg-gray-50">
              <Button variant="outline" onClick={close} disabled={isPending}>
                Annuler
              </Button>
              <Button onClick={handleCreer} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer le rendez-vous
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
