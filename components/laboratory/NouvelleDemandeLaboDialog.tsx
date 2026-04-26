// ============================================================
// NOUVELLE DEMANDE LABO — Dialog de création avec catalogue
// ============================================================

"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  Loader2,
  AlertCircle,
  AlertTriangle,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { creerExamenLabo } from "@/app/dashboard/laboratory/actions";
import Link from "next/link";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export interface CatalogueItem {
  id: string;
  famille: string;
  nom: string;
  prix: number;
  actif: boolean;
}

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

interface NouvelleDemandeLaboDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalId: string;
  medecinConnecteId: string;
  medecinConnecteNom: string;
  medecins: Medecin[];
  patients: PatientHospital[];
  catalogue: CatalogueItem[];
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

export function NouvelleDemandeLaboDialog({
  open,
  onOpenChange,
  hospitalId,
  medecinConnecteId,
  medecinConnecteNom,
  medecins,
  patients,
  catalogue,
}: NouvelleDemandeLaboDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [patientId, setPatientId] = useState("");
  const [medecinId, setMedecinId] = useState(medecinConnecteId);
  const [examensSelectionnes, setExamensSelectionnes] = useState<Set<string>>(new Set());
  const [famillesOuvertes, setFamillesOuvertes] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [urgence, setUrgence] = useState(false);

  // Groupement du catalogue par famille (mémoïsé)
  const famillesGroupees = useMemo(() => {
    const map = new Map<string, CatalogueItem[]>();
    for (const item of catalogue) {
      const groupe = map.get(item.famille) ?? [];
      groupe.push(item);
      map.set(item.famille, groupe);
    }
    return map;
  }, [catalogue]);

  const familles = Array.from(famillesGroupees.keys()).sort();

  // Total des examens sélectionnés
  const totalSelectionne = useMemo(() => {
    return catalogue
      .filter((e) => examensSelectionnes.has(e.id))
      .reduce((sum, e) => sum + e.prix, 0);
  }, [catalogue, examensSelectionnes]);

  function toggleFamille(famille: string) {
    setFamillesOuvertes((prev) => {
      const next = new Set(prev);
      next.has(famille) ? next.delete(famille) : next.add(famille);
      return next;
    });
  }

  function toggleExamen(id: string) {
    setExamensSelectionnes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (errors.examens) setErrors((p) => ({ ...p, examens: "" }));
  }

  // Tout sélectionner / désélectionner dans une famille
  function toggleFamilleSelectAll(famille: string) {
    const items = famillesGroupees.get(famille) ?? [];
    const tousSelectionnes = items.every((e) => examensSelectionnes.has(e.id));
    setExamensSelectionnes((prev) => {
      const next = new Set(prev);
      if (tousSelectionnes) {
        items.forEach((e) => next.delete(e.id));
      } else {
        items.forEach((e) => next.add(e.id));
      }
      return next;
    });
    if (errors.examens) setErrors((p) => ({ ...p, examens: "" }));
  }

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!patientId) newErrors.patient = "Veuillez sélectionner un patient";
    if (!medecinId) newErrors.medecin = "Veuillez sélectionner un médecin";
    if (examensSelectionnes.size === 0)
      newErrors.examens = "Sélectionnez au moins un examen";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(false);
    setPatientId("");
    setMedecinId(medecinConnecteId);
    setExamensSelectionnes(new Set());
    setFamillesOuvertes(new Set());
    setNotes("");
    setUrgence(false);
    setErrors({});
    onOpenChange(false);
  }

  function handleCreer() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        await creerExamenLabo(hospitalId, medecinConnecteId, medecinConnecteNom, {
          patient_id:   patientId,
          medecin_id:   medecinId,
          examens_ids:  Array.from(examensSelectionnes),
          notes:        notes || undefined,
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

  // Rendu si catalogue vide
  const catalogueVide = catalogue.length === 0;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg! w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Nouvelle demande d'examen</DialogTitle>

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

            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                Nouvelle demande d'examen
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Laboratoire — Biologie médicale
              </p>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 max-h-[70vh]">

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

              {/* Médecin prescripteur */}
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

              {/* Sélection des examens */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    Examens demandés <span className="text-red-500">*</span>
                  </Label>
                  {examensSelectionnes.size > 0 && (
                    <span className="text-xs text-blue-600 font-medium">
                      {examensSelectionnes.size} sélectionné{examensSelectionnes.size > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Catalogue vide → message */}
                {catalogueVide ? (
                  <div className="flex flex-col items-center gap-2 p-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center">
                    <BookOpen className="h-6 w-6 text-gray-400" />
                    <p className="text-sm text-gray-600 font-medium">
                      Catalogue vide
                    </p>
                    <p className="text-xs text-gray-400">
                      Configurez d'abord le catalogue d'examens de votre structure.
                    </p>
                    <Link
                      href="/dashboard/laboratory/catalogue"
                      className="text-xs text-blue-600 hover:underline font-medium"
                      onClick={close}
                    >
                      Gérer le catalogue →
                    </Link>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "border rounded-lg overflow-hidden",
                      errors.examens ? "border-red-400" : "border-gray-200"
                    )}
                  >
                    {familles.map((famille, idx) => {
                      const items = famillesGroupees.get(famille)!;
                      const ouvert = famillesOuvertes.has(famille);
                      const nbSelectionnes = items.filter((e) =>
                        examensSelectionnes.has(e.id)
                      ).length;
                      const tousSelectionnes =
                        nbSelectionnes === items.length;

                      return (
                        <div
                          key={famille}
                          className={cn(
                            idx > 0 && "border-t border-gray-100"
                          )}
                        >
                          {/* En-tête famille */}
                          <div className="flex items-center">
                            {/* Toggle tout sélectionner */}
                            <button
                              type="button"
                              onClick={() => toggleFamilleSelectAll(famille)}
                              className="pl-3 pr-1 py-2.5"
                              title={
                                tousSelectionnes
                                  ? "Tout désélectionner"
                                  : "Tout sélectionner"
                              }
                            >
                              <div
                                className={cn(
                                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                                  nbSelectionnes === items.length
                                    ? "bg-blue-600 border-blue-600"
                                    : nbSelectionnes > 0
                                    ? "bg-blue-200 border-blue-400"
                                    : "border-gray-300"
                                )}
                              >
                                {nbSelectionnes > 0 && (
                                  <Check className="h-2.5 w-2.5 text-white" />
                                )}
                              </div>
                            </button>

                            {/* Clic → expand/collapse */}
                            <button
                              type="button"
                              className="flex-1 flex items-center gap-2 px-2 py-2.5 hover:bg-gray-50 transition-colors text-left"
                              onClick={() => toggleFamille(famille)}
                            >
                              <FlaskConical className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                              <span className="text-xs font-semibold text-gray-700 flex-1">
                                {famille}
                              </span>
                              {nbSelectionnes > 0 && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                                  {nbSelectionnes}
                                </span>
                              )}
                              {ouvert ? (
                                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                              )}
                            </button>
                          </div>

                          {/* Examens de la famille */}
                          {ouvert && (
                            <div className="border-t border-gray-100 bg-gray-50/50">
                              {items.map((examen) => {
                                const selectionne =
                                  examensSelectionnes.has(examen.id);
                                return (
                                  <button
                                    key={examen.id}
                                    type="button"
                                    onClick={() => toggleExamen(examen.id)}
                                    className={cn(
                                      "w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50/50 transition-colors text-left border-b border-gray-100 last:border-0",
                                      selectionne && "bg-blue-50"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                                        selectionne
                                          ? "bg-blue-600 border-blue-600"
                                          : "border-gray-300"
                                      )}
                                    >
                                      {selectionne && (
                                        <Check className="h-2.5 w-2.5 text-white" />
                                      )}
                                    </div>
                                    <span
                                      className={cn(
                                        "flex-1 text-sm",
                                        selectionne
                                          ? "text-blue-800 font-medium"
                                          : "text-gray-700"
                                      )}
                                    >
                                      {examen.nom}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500 shrink-0">
                                      {formatCurrency(examen.prix)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <FieldError message={errors.examens} />
              </div>

              {/* Total sélectionné */}
              {examensSelectionnes.size > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700">
                    Total ({examensSelectionnes.size} examen
                    {examensSelectionnes.size > 1 ? "s" : ""})
                  </span>
                  <span className="text-sm font-bold text-blue-800">
                    {formatCurrency(totalSelectionne)}
                  </span>
                </div>
              )}

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
                <div
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                    urgence ? "bg-red-600 border-red-600" : "border-gray-300"
                  )}
                >
                  {urgence && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      urgence ? "text-red-600" : "text-gray-400"
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        urgence ? "text-red-700" : "text-gray-700"
                      )}
                    >
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
                disabled={isPending || catalogueVide}
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
