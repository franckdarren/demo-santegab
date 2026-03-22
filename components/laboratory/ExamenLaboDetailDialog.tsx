"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Check, Loader2, X, Pencil,
    Upload, FileText, CheckCircle, AlertTriangle,
} from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import {
    saisirResultatsLabo,
    uploadResultatPDF,
    validerExamenLabo,
} from "@/app/dashboard/laboratory/actions";
import { StatutExamen } from "@/app/generated/prisma/client";

const STATUT_CONFIG: Record<StatutExamen, { label: string; color: string }> = {
    EN_ATTENTE: { label: "En attente", color: "bg-orange-100 text-orange-700" },
    EN_COURS: { label: "En cours", color: "bg-blue-100 text-blue-700" },
    RESULTAT_SAISI: { label: "À valider", color: "bg-purple-100 text-purple-700" },
    VALIDE: { label: "Validé", color: "bg-green-100 text-green-700" },
    ANNULE: { label: "Annulé", color: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<string, string> = {
    BILAN_SANGUIN: "Bilan sanguin",
    BILAN_URINAIRE: "Bilan urinaire",
    BACTERIOLOGIE: "Bactériologie",
    PARASITOLOGIE: "Parasitologie",
    SEROLOGIE: "Sérologie",
    BIOCHIMIE: "Biochimie",
    HEMATOLOGIE: "Hématologie",
    AUTRE: "Autre",
};

const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface ExamenLabo {
    id: string;
    statut: StatutExamen;
    type_examen: string;
    urgence: boolean;
    resultats: string | null;
    fichier_url: string | null;
    fichier_nom: string | null;
    valide_par: string | null;
    valide_le: Date | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
    patient: { id: string; nom: string; prenom: string; numero_dossier: string };
    medecin: { id: string; nom: string; prenom: string };
}

interface ExamenLaboDetailDialogProps {
    examen: ExamenLabo;
    hospitalId: string;
    utilisateurId: string;
    utilisateurNom: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExamenLaboDetailDialog({
    examen,
    hospitalId,
    utilisateurId,
    utilisateurNom,
    open,
    onOpenChange,
}: ExamenLaboDetailDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [modeEdition, setModeEdition] = useState(false);
    const [succes, setSucces] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [resultats, setResultats] = useState(examen.resultats ?? "");
    const [statut, setStatut] = useState(examen.statut);
    const [fichierSelectionne, setFichierSelectionne] = useState<File | null>(null);

    const statutConfig = STATUT_CONFIG[examen.statut];
    const nomPatient = `${examen.patient.prenom} ${examen.patient.nom}`;
    const peutSaisir = examen.statut !== "VALIDE" && examen.statut !== "ANNULE";
    const peutValider = examen.statut === "RESULTAT_SAISI";

    function handleSauvegarder() {
        startTransition(async () => {
            try {
                await saisirResultatsLabo(
                    examen.id,
                    hospitalId,
                    utilisateurId,
                    utilisateurNom,
                    {
                        resultats,
                        statut: statut as StatutExamen,
                    });
                setSucces("Résultats enregistrés !");
                router.refresh();
                setTimeout(() => {
                    setSucces(null);
                    setModeEdition(false);
                    onOpenChange(false);
                }, 1200);
            } catch (error) {
                console.error(error);
            }
        });
    }

    async function handleUploadPDF() {
        if (!fichierSelectionne) return;
        setUploadProgress(true);
        try {
            const formData = new FormData();
            formData.append("fichier", fichierSelectionne);
            await uploadResultatPDF(examen.id, hospitalId, utilisateurId,
                utilisateurNom, formData);
            setSucces("PDF uploadé avec succès !");
            router.refresh();
            setTimeout(() => {
                setSucces(null);
                onOpenChange(false);
            }, 1200);
        } catch (error) {
            console.error(error);
        } finally {
            setUploadProgress(false);
        }
    }

    function handleValider() {
        startTransition(async () => {
            try {
                await validerExamenLabo(examen.id, hospitalId, utilisateurId,
                    utilisateurNom,);
                setSucces("Examen validé !");
                router.refresh();
                setTimeout(() => {
                    setSucces(null);
                    onOpenChange(false);
                }, 1200);
            } catch (error) {
                console.error(error);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl! w-full p-0 overflow-hidden gap-0 [&>button:first-of-type]:hidden">
                <DialogTitle className="sr-only">Détail examen labo</DialogTitle>

                {succes ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-12">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{succes}</p>
                    </div>
                ) : (
                    <div className="flex flex-col">

                        {/* ------------------------------------------------ */}
                        {/* HEADER                                            */}
                        {/* ------------------------------------------------ */}
                        <div className="shrink-0 px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-semibold text-gray-900">
                                        {TYPE_LABELS[examen.type_examen] ?? examen.type_examen}
                                    </h2>
                                    {examen.urgence && (
                                        <Badge className="text-[10px] bg-red-100 text-red-700 border-0 py-0 px-1.5 flex items-center gap-0.5">
                                            <AlertTriangle className="h-2.5 w-2.5" />
                                            URGENT
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {nomPatient} · Dr. {examen.medecin.nom} ·{" "}
                                    {formatDate(examen.created_at)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className={cn("text-xs border-0", statutConfig.color)}>
                                    {statutConfig.label}
                                </Badge>
                                {peutSaisir && !modeEdition && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setModeEdition(true)}
                                        className="text-xs"
                                    >
                                        <Pencil className="h-3.5 w-3.5 mr-1" />
                                        Saisir résultats
                                    </Button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* ------------------------------------------------ */}
                        {/* CONTENU                                           */}
                        {/* ------------------------------------------------ */}
                        <div className="overflow-y-auto p-6 space-y-5 max-h-[60vh]">

                            {/* Infos générales */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1">Patient</p>
                                    <p className="text-sm font-semibold text-gray-800">{nomPatient}</p>
                                    <p className="text-xs text-gray-400">{examen.patient.numero_dossier}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1">Prescripteur</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                        Dr. {examen.medecin.nom}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-400 mb-1">Date demande</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {formatDate(examen.created_at)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {formatTime(examen.created_at)}
                                    </p>
                                </div>
                            </div>

                            {/* Notes cliniques */}
                            {examen.notes && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs font-semibold text-blue-700 mb-1">
                                        Notes cliniques
                                    </p>
                                    <p className="text-sm text-blue-800">{examen.notes}</p>
                                </div>
                            )}

                            {/* Résultats */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Résultats
                                </p>

                                {modeEdition ? (
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label>Statut</Label>
                                            <select
                                                value={statut}
                                                onChange={(e) => setStatut(e.target.value as StatutExamen)}
                                                className={selectClass}
                                            >
                                                <option value="EN_COURS">En cours</option>
                                                <option value="RESULTAT_SAISI">Résultats saisis</option>
                                                <option value="ANNULE">Annuler</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>Résultats (texte)</Label>
                                            <Textarea
                                                placeholder={`Saisissez les résultats ici...\nEx:\nHémoglobine : 12.5 g/dL (N: 13-17)\nGlobules blancs : 8500/mm³\n...`}
                                                rows={6}
                                                className="resize-none font-mono text-sm"
                                                value={resultats}
                                                onChange={(e) => setResultats(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    examen.resultats ? (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                                                {examen.resultats}
                                            </pre>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">
                                            Aucun résultat saisi
                                        </p>
                                    )
                                )}
                            </div>

                            {/* Upload PDF */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Fichier PDF des résultats
                                </p>

                                {examen.fichier_url ? (
                                    // ============================================================
                                    // Fichier déjà uploadé — affiche le lien d'ouverture
                                    // ============================================================
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <FileText className="h-5 w-5 text-green-600 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-green-800 truncate">
                                                {examen.fichier_nom ?? "Résultats.pdf"}
                                            </p>
                                            <p className="text-xs text-green-600">Fichier disponible</p>
                                        </div>
                                        {/* Balise <a> complète — ouvre le PDF dans un nouvel onglet */}
                                        <a
                                            href={examen.fichier_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0"
                                        >
                                            Ouvrir
                                        </a>
                                    </div>
                                ) : (
                                    // ============================================================
                                    // Pas encore de fichier — zone d'upload
                                    // ============================================================
                                    <div className="space-y-2">
                                        <div
                                            className={cn(
                                                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                                                fichierSelectionne
                                                    ? "border-blue-400 bg-blue-50"
                                                    : "border-gray-200 hover:border-blue-300"
                                            )}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setFichierSelectionne(file);
                                                }}
                                            />
                                            <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                            {fichierSelectionne ? (
                                                <div>
                                                    <p className="text-sm font-medium text-blue-700">
                                                        {fichierSelectionne.name}
                                                    </p>
                                                    <p className="text-xs text-blue-500">
                                                        {(fichierSelectionne.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        Cliquez pour sélectionner un PDF
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Fichiers PDF uniquement — max 10 MB
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {fichierSelectionne && (
                                            <Button
                                                type="button"
                                                disabled={uploadProgress}
                                                onClick={handleUploadPDF}
                                                className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                                            >
                                                {uploadProgress ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Upload en cours...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4 mr-1.5" />
                                                        Uploader le PDF
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Info validation */}
                            {examen.statut === "VALIDE" && examen.valide_le && (
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-sm font-semibold text-green-700 mb-0.5">
                                        ✅ Validé
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Le {formatDate(examen.valide_le)} à{" "}
                                        {formatTime(examen.valide_le)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ------------------------------------------------ */}
                        {/* FOOTER                                            */}
                        {/* ------------------------------------------------ */}
                        <div className="shrink-0 flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                    modeEdition ? setModeEdition(false) : onOpenChange(false)
                                }
                                className="text-gray-500"
                            >
                                {modeEdition ? "Annuler" : "Fermer"}
                            </Button>

                            <div className="flex gap-2">
                                {peutValider && !modeEdition && (
                                    <Button
                                        type="button"
                                        disabled={isPending}
                                        onClick={handleValider}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Validation...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                                Valider l'examen
                                            </>
                                        )}
                                    </Button>
                                )}

                                {modeEdition && (
                                    <Button
                                        type="button"
                                        disabled={isPending}
                                        onClick={handleSauvegarder}
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
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog >
    );
}