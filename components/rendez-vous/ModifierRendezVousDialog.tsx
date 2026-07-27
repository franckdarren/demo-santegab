// ============================================================
// MODIFIER RENDEZ-VOUS — Dialog de report / correction
//
// Le patient n'est PAS modifiable : changer de patient revient
// à créer un autre rendez-vous. On peut en revanche reporter la
// date, changer de médecin, de service, de durée ou de motif.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, AlertCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { modifierRendezVous } from "@/app/dashboard/rendez-vous/actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface Medecin {
  id: string;
  nom: string;
  prenom: string;
}

interface Service {
  id: string;
  nom: string;
  couleur: string;
}

interface RendezVousAModifier {
  id: string;
  date_heure: Date;
  duree_min: number;
  motif: string | null;
  notes: string | null;
  patient: {
    nom: string;
    prenom: string;
    numero_dossier: string;
  };
  medecin: {
    id: string;
  };
  service: {
    id: string;
  } | null;
}

interface ModifierRendezVousDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
  medecins: Medecin[];
  services: Service[];
  rendezVous: RendezVousAModifier;
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

export function ModifierRendezVousDialog({
  open,
  onOpenChange,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  medecins,
  services,
  rendezVous,
}: ModifierRendezVousDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Champs pré-remplis avec les valeurs actuelles du rendez-vous
  const [medecinId, setMedecinId] = useState(rendezVous.medecin.id);
  const [serviceId, setServiceId] = useState(rendezVous.service?.id ?? "");
  const [date, setDate]           = useState(format(rendezVous.date_heure, "yyyy-MM-dd"));
  const [heure, setHeure]         = useState(format(rendezVous.date_heure, "HH:mm"));
  const [dureeMin, setDureeMin]   = useState(String(rendezVous.duree_min));
  const [motif, setMotif]         = useState(rendezVous.motif ?? "");
  const [notes, setNotes]         = useState(rendezVous.notes ?? "");

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!medecinId) newErrors.medecin_id = "Veuillez sélectionner un médecin";
    if (!date)      newErrors.date       = "La date est obligatoire";
    if (!heure)     newErrors.heure      = "L'heure est obligatoire";

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
        const dateHeure = new Date(`${date}T${heure}`);

        await modifierRendezVous(
          rendezVous.id,
          hospitalId,
          utilisateurId,
          utilisateurNom,
          {
            medecin_id: medecinId,
            // null vide explicitement le service côté base
            service_id: serviceId || null,
            date_heure: dateHeure,
            duree_min:  Number(dureeMin),
            motif,
            notes,
          }
        );

        setSucces(true);
        router.refresh();
        setTimeout(() => close(), 1200);
      } catch (error) {
        // Message du serveur : conflit d'agenda notamment
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors de la modification. Veuillez réessayer.";
        setErrors({ global: message });
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-2xl! w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Modifier le rendez-vous</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">
              Rendez-vous modifié !
            </p>
          </div>
        ) : (
          <div className="flex flex-col">

            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                Modifier le rendez-vous
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Report, changement de médecin ou correction
              </p>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6 space-y-6 max-h-[60vh] sm:max-h-[70vh]">

              {errors.global && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{errors.global}</p>
                </div>
              )}

              {/* Patient — non modifiable */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 rounded-lg bg-white">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {rendezVous.patient.prenom} {rendezVous.patient.nom}
                  </p>
                  <p className="text-xs text-gray-400">
                    {rendezVous.patient.numero_dossier} — patient non modifiable
                  </p>
                </div>
              </div>

              {/* Médecin + service */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Date <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
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
                      if (errors.heure) setErrors((prev) => ({ ...prev, heure: "" }));
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

              {/* Motif + notes */}
              <div className="space-y-4">
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
              <Button onClick={handleEnregistrer} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
