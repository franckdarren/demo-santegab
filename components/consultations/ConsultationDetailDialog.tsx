"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Check, Loader2, Pencil, Pill,
    Thermometer, Weight, Activity, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/utils";
import { updateConsultation } from "@/app/dashboard/consultations/actions";
import { StatutConsultation } from "@/app/generated/prisma/client";

const STATUT_CONFIG: Record<StatutConsultation, { label: string; color: string }> = {
    EN_ATTENTE: { label: "En attente", color: "bg-orange-100 text-orange-700" },
    EN_COURS: { label: "En cours", color: "bg-blue-100 text-blue-700" },
    TERMINEE: { label: "Terminée", color: "bg-green-100 text-green-700" },
    ANNULEE: { label: "Annulée", color: "bg-red-100 text-red-700" },
};

const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface Prescription {
    medicament: string;
    dosage: string;
    frequence: string;
    duree: string;
}

interface Consultation {
    id: string;
    statut: StatutConsultation;
    motif: string | null;
    diagnostic: string | null;
    notes: string | null;
    date_consultation: Date;
    tension: string | null;
    poids_kg: number | null;
    taille_cm: number | null;
    temperature: number | null;
    patient: { id: string; nom: string; prenom: string; numero_dossier: string };
    medecin: { id: string; nom: string; prenom: string };
    prescriptions: Array<{
        id: string;
        medicament: string;
        dosage: string | null;
        frequence: string | null;
        duree: string | null;
    }>;
    facture: { id: string } | null;
}

interface ConsultationDetailDialogProps {
    consultation: Consultation;
    hospitalId: string;
    utilisateurId: string;
    utilisateurNom: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ConsultationDetailDialog({
    consultation,
    hospitalId,
    utilisateurId,
    utilisateurNom,
    open,
    onOpenChange,
}: ConsultationDetailDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [modeEdition, setModeEdition] = useState(false);
    const [succes, setSucces] = useState(false);
    const [statut, setStatut] = useState(consultation.statut);

    const [formData, setFormData] = useState({
        diagnostic: consultation.diagnostic ?? "",
        notes: consultation.notes ?? "",
        tension: consultation.tension ?? "",
        poids_kg: consultation.poids_kg?.toString() ?? "",
        taille_cm: consultation.taille_cm?.toString() ?? "",
        temperature: consultation.temperature?.toString() ?? "",
    });

    const [prescriptions, setPrescriptions] = useState<Prescription[]>(
        consultation.prescriptions.map((p) => ({
            medicament: p.medicament,
            dosage: p.dosage ?? "",
            frequence: p.frequence ?? "",
            duree: p.duree ?? "",
        }))
    );

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    function handleSave() {
        startTransition(async () => {
            try {
                await updateConsultation(
                    consultation.id,
                    hospitalId,
                    utilisateurId,
                    utilisateurNom,
                    {
                        ...formData,
                        poids_kg: formData.poids_kg ? Number(formData.poids_kg) : undefined,
                        taille_cm: formData.taille_cm ? Number(formData.taille_cm) : undefined,
                        temperature: formData.temperature ? Number(formData.temperature) : undefined,
                        statut,
                        prescriptions: prescriptions.filter((p) => p.medicament.trim()),
                    });
                setSucces(true);
                router.refresh();
                setTimeout(() => {
                    setSucces(false);
                    setModeEdition(false);
                    onOpenChange(false);
                }, 1200);
            } catch (error) {
                console.error(error);
            }
        });
    }

    const statutConfig = STATUT_CONFIG[consultation.statut];
    const nomPatient = `${consultation.patient.prenom} ${consultation.patient.nom}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* ============================================================
          !max-w-4xl  : override le max-w-lg par défaut de Shadcn
          [&>button:first-of-type]:hidden : masque le bouton × natif
          de Shadcn — on gère notre propre bouton de fermeture
          dans le header pour un meilleur contrôle du positionnement
          ============================================================ */}
            <DialogContent className="max-w-4xl! w-full p-0 overflow-hidden gap-0 h-[85vh] flex flex-col [&>button:first-of-type]:hidden">
                <DialogTitle className="sr-only">Détail consultation</DialogTitle>

                {succes ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                            Consultation mise à jour !
                        </p>
                    </div>
                ) : (
                    <>
                        {/* -------------------------------------------------- */}
                        {/* HEADER — avec bouton × custom bien positionné       */}
                        {/* -------------------------------------------------- */}
                        <div className="shrink-0 border-b px-6 py-4 flex items-center justify-between bg-gray-50">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">
                                    {nomPatient}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {formatDate(consultation.date_consultation)} à{" "}
                                    {formatTime(consultation.date_consultation)} · Dr.{" "}
                                    {consultation.medecin.nom}
                                </p>
                            </div>

                            {/* Actions header */}
                            <div className="flex items-center gap-2">
                                <Badge className={cn("text-xs border-0", statutConfig.color)}>
                                    {statutConfig.label}
                                </Badge>

                                {!modeEdition && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setModeEdition(true)}
                                        className="text-xs"
                                    >
                                        <Pencil className="h-3.5 w-3.5 mr-1" />
                                        Modifier
                                    </Button>
                                )}

                                {/* Bouton fermeture custom — remplace le × natif Shadcn */}
                                <button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors ml-1"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* -------------------------------------------------- */}
                        {/* BODY — 2 colonnes                                   */}
                        {/* -------------------------------------------------- */}
                        <div className="flex-1 overflow-hidden flex">

                            {/* Colonne gauche — patient + constantes */}
                            <div className="w-64 shrink-0 border-r bg-gray-50 overflow-y-auto p-5 space-y-5">

                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                        Patient
                                    </p>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {nomPatient}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {consultation.patient.numero_dossier}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                        Motif
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        {consultation.motif ?? "Non renseigné"}
                                    </p>
                                </div>

                                <Separator />

                                {/* Constantes vitales */}
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                                        Constantes vitales
                                    </p>

                                    {modeEdition ? (
                                        <div className="space-y-2">
                                            {[
                                                { name: "tension", label: "Tension", placeholder: "12/8" },
                                                { name: "temperature", label: "Température (°C)", placeholder: "37.2" },
                                                { name: "poids_kg", label: "Poids (kg)", placeholder: "70" },
                                                { name: "taille_cm", label: "Taille (cm)", placeholder: "170" },
                                            ].map((f) => (
                                                <div key={f.name} className="space-y-1">
                                                    <Label className="text-xs">{f.label}</Label>
                                                    <Input
                                                        name={f.name}
                                                        placeholder={f.placeholder}
                                                        value={formData[f.name as keyof typeof formData]}
                                                        onChange={handleChange}
                                                        className="text-sm h-8"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {consultation.tension && (
                                                <div className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm">
                                                    <Activity className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-gray-400">Tension</p>
                                                        <p className="text-sm font-semibold">{consultation.tension}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {consultation.temperature && (
                                                <div className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm">
                                                    <Thermometer className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-gray-400">Température</p>
                                                        <p className="text-sm font-semibold">{consultation.temperature}°C</p>
                                                    </div>
                                                </div>
                                            )}
                                            {consultation.poids_kg && (
                                                <div className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm">
                                                    <Weight className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <div>
                                                        <p className="text-xs text-gray-400">Poids</p>
                                                        <p className="text-sm font-semibold">{consultation.poids_kg} kg</p>
                                                    </div>
                                                </div>
                                            )}
                                            {consultation.taille_cm && (
                                                <div className="bg-white rounded-lg p-3 flex items-center gap-3 shadow-sm">
                                                    <div>
                                                        <p className="text-xs text-gray-400">Taille</p>
                                                        <p className="text-sm font-semibold">{consultation.taille_cm} cm</p>
                                                    </div>
                                                </div>
                                            )}
                                            {!consultation.tension && !consultation.temperature &&
                                                !consultation.poids_kg && !consultation.taille_cm && (
                                                    <p className="text-xs text-gray-400 italic">
                                                        Aucune constante enregistrée
                                                    </p>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Colonne droite — diagnostic + prescriptions */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                {/* Statut en mode édition */}
                                {modeEdition && (
                                    <div className="space-y-1.5">
                                        <Label>Statut</Label>
                                        <select
                                            value={statut}
                                            onChange={(e) =>
                                                setStatut(e.target.value as StatutConsultation)
                                            }
                                            className={selectClass}
                                        >
                                            <option value="EN_ATTENTE">En attente</option>
                                            <option value="EN_COURS">En cours</option>
                                            <option value="TERMINEE">Terminée</option>
                                            <option value="ANNULEE">Annulée</option>
                                        </select>
                                    </div>
                                )}

                                {/* Diagnostic */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Diagnostic
                                    </p>
                                    {modeEdition ? (
                                        <Textarea
                                            name="diagnostic"
                                            value={formData.diagnostic}
                                            onChange={handleChange}
                                            rows={3}
                                            className="resize-none"
                                            placeholder="Diagnostic médical..."
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-800">
                                            {consultation.diagnostic ?? (
                                                <span className="text-gray-400 italic">Non renseigné</span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Notes
                                    </p>
                                    {modeEdition ? (
                                        <Textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            rows={3}
                                            className="resize-none"
                                            placeholder="Observations, recommandations..."
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-800">
                                            {consultation.notes ?? (
                                                <span className="text-gray-400 italic">Aucune note</span>
                                            )}
                                        </p>
                                    )}
                                </div>

                                <Separator />

                                {/* Prescriptions */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Prescriptions ({prescriptions.length})
                                        </p>
                                        {modeEdition && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPrescriptions((prev) => [
                                                        ...prev,
                                                        { medicament: "", dosage: "", frequence: "", duree: "" },
                                                    ])
                                                }
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                + Ajouter un médicament
                                            </button>
                                        )}
                                    </div>

                                    {prescriptions.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">
                                            Aucune prescription
                                        </p>
                                    ) : modeEdition ? (
                                        <div className="space-y-3">
                                            {prescriptions.map((p, index) => (
                                                <div
                                                    key={index}
                                                    className="p-3 bg-blue-50 rounded-lg border border-blue-100 space-y-2"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs font-medium text-blue-700">
                                                            Médicament {index + 1}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPrescriptions((prev) =>
                                                                    prev.filter((_, i) => i !== index)
                                                                )
                                                            }
                                                            className="text-xs text-red-400 hover:text-red-600"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                    <Input
                                                        placeholder="Nom du médicament *"
                                                        value={p.medicament}
                                                        onChange={(e) =>
                                                            setPrescriptions((prev) =>
                                                                prev.map((item, i) =>
                                                                    i === index
                                                                        ? { ...item, medicament: e.target.value }
                                                                        : item
                                                                )
                                                            )
                                                        }
                                                        className="bg-white text-sm"
                                                    />
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <Input
                                                            placeholder="Dosage"
                                                            value={p.dosage}
                                                            onChange={(e) =>
                                                                setPrescriptions((prev) =>
                                                                    prev.map((item, i) =>
                                                                        i === index
                                                                            ? { ...item, dosage: e.target.value }
                                                                            : item
                                                                    )
                                                                )
                                                            }
                                                            className="bg-white text-sm"
                                                        />
                                                        <Input
                                                            placeholder="Fréquence"
                                                            value={p.frequence}
                                                            onChange={(e) =>
                                                                setPrescriptions((prev) =>
                                                                    prev.map((item, i) =>
                                                                        i === index
                                                                            ? { ...item, frequence: e.target.value }
                                                                            : item
                                                                    )
                                                                )
                                                            }
                                                            className="bg-white text-sm"
                                                        />
                                                        <Input
                                                            placeholder="Durée"
                                                            value={p.duree}
                                                            onChange={(e) =>
                                                                setPrescriptions((prev) =>
                                                                    prev.map((item, i) =>
                                                                        i === index
                                                                            ? { ...item, duree: e.target.value }
                                                                            : item
                                                                    )
                                                                )
                                                            }
                                                            className="bg-white text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {prescriptions.map((p, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                                >
                                                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                        <Pill className="h-3.5 w-3.5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {p.medicament}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {[p.dosage, p.frequence, p.duree]
                                                                .filter(Boolean)
                                                                .join(" · ")}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* -------------------------------------------------- */}
                        {/* FOOTER                                              */}
                        {/* -------------------------------------------------- */}
                        <div className="shrink-0 border-t px-6 py-4 flex justify-between items-center bg-gray-50">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                    modeEdition ? setModeEdition(false) : onOpenChange(false)
                                }
                                className="text-gray-500"
                            >
                                {modeEdition ? "Annuler les modifications" : "Fermer"}
                            </Button>

                            {modeEdition && (
                                <Button
                                    type="button"
                                    disabled={isPending}
                                    onClick={handleSave}
                                    className="bg-blue-700 hover:bg-blue-800 text-white"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sauvegarde...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-1.5" />
                                            Sauvegarder
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}