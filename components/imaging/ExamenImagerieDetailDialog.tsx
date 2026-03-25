"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Check, Loader2, X, Pencil,
    Upload, FileText, CheckCircle, AlertTriangle, Receipt,
} from "lucide-react";
import { cn, formatDate, formatTime, formatCurrency } from "@/lib/utils";
import {
    saisirResultatsImagerie,
    uploadResultatImagerie,
    validerExamenImagerie,
} from "@/app/dashboard/imaging/actions";
import { StatutExamen } from "@/app/generated/prisma/client";
import { TARIFS_IMAGERIE } from "@/lib/tarifs";

const STATUT_CONFIG: Record<StatutExamen, { label: string; color: string }> = {
    EN_ATTENTE: { label: "En attente", color: "bg-orange-100 text-orange-700" },
    EN_COURS: { label: "En cours", color: "bg-blue-100 text-blue-700" },
    RESULTAT_SAISI: { label: "À valider", color: "bg-purple-100 text-purple-700" },
    VALIDE: { label: "Validé", color: "bg-green-100 text-green-700" },
    ANNULE: { label: "Annulé", color: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<string, string> = {
    RADIOGRAPHIE: "Radiographie",
    ECHOGRAPHIE: "Échographie",
    SCANNER: "Scanner",
    IRM: "IRM",
    MAMMOGRAPHIE: "Mammographie",
    AUTRE: "Autre",
};

const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface ExamenImagerie {
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
    zone_anatomique: string | null;
    prix_unitaire: number | null; // ← ajouté
    facture_id: string | null;   // ← ajouté
    created_at: Date;
    updated_at: Date;
    patient: { id: string; nom: string; prenom: string; numero_dossier: string };
    medecin: { id: string; nom: string; prenom: string };
}

interface ExamenImagerieDetailDialogProps {
    examen: ExamenImagerie;
    hospitalId: string;
    utilisateurId: string;
    utilisateurNom: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExamenImagerieDetailDialog({
    examen,
    hospitalId,
    utilisateurId,
    utilisateurNom,
    open,
    onOpenChange,
}: ExamenImagerieDetailDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [modeEdition, setModeEdition] = useState(false);
    const [succes, setSucces] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [resultats, setResultats] = useState(examen.resultats ?? "");
    const [zoneAnatomique, setZoneAnatomique] = useState(examen.zone_anatomique ?? "");
    const [statut, setStatut] = useState(examen.statut);
    const [fichierSelectionne, setFichierSelectionne] = useState<File | null>(null);

    // Tarif — pré-rempli avec la valeur existante ou le tarif suggéré
    const [prixUnitaire, setPrixUnitaire] = useState<string>(
        examen.prix_unitaire?.toString() ??
        TARIFS_IMAGERIE[examen.type_examen]?.toString() ??
        ""
    );

    const statutConfig = STATUT_CONFIG[examen.statut];
    const nomPatient = `${examen.patient.prenom} ${examen.patient.nom}`;
    const peutSaisir = examen.statut !== "VALIDE" && examen.statut !== "ANNULE";
    const peutValider = examen.statut === "RESULTAT_SAISI";
    const tarifSuggere = TARIFS_IMAGERIE[examen.type_examen];

    function handleSauvegarder() {
        startTransition(async () => {
            try {
                await saisirResultatsImagerie(
                    examen.id,
                    hospitalId,
                    utilisateurId,
                    utilisateurNom,
                    {
                        resultats,
                        zone_anatomique: zoneAnatomique || undefined,
                        statut: statut as StatutExamen,
                        prix_unitaire: prixUnitaire ? Number(prixUnitaire) : undefined,
                    }
                );
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
            await uploadResultatImagerie(
                examen.id, hospitalId, utilisateurId, utilisateurNom, formData
            );
            setSucces("PDF uploadé avec succès !");
            router.refresh();
            setTimeout(() => { setSucces(null); onOpenChange(false); }, 1200);
        } catch (error) {
            console.error(error);
        } finally {
            setUploadProgress(false);
        }
    }

    function handleValider() {
        startTransition(async () => {
            try {
                await validerExamenImagerie(
                    examen.id, hospitalId, utilisateurId, utilisateurNom
                );
                setSucces("Examen validé !");
                router.refresh();
                setTimeout(() => { setSucces(null); onOpenChange(false); }, 1200);
            } catch (error) {
                console.error(error);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl! w-full p-0 overflow-hidden gap-0 [&>button:first-of-type]:hidden">
                <DialogTitle className="sr-only">Détail examen imagerie</DialogTitle>

                {succes ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-12">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{succes}</p>
                    </div>
                ) : (
                    <div className="flex flex-col">

                        {/* Header */}
                        <div className="shrink-0 px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-semibold text-gray-900">
                                        {TYPE_LABELS[examen.type_examen] ?? examen.type_examen}
                                        {examen.zone_anatomique && (
                                            <span className="text-gray-400 font-normal">
                                                {" "}— {examen.zone_anatomique}
                                            </span>
                                        )}
                                    </h2>
                                    {examen.urgence && (
                                        <Badge className="text-[10px] bg-red-100 text-red-700 border-0 py-0 px-1.5 flex items-center gap-0.5">
                                            <AlertTriangle className="h-2.5 w-2.5" />
                                            URGENT
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {nomPatient} · Dr. {examen.medecin.nom} · {formatDate(examen.created_at)}
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

                        {/* Contenu */}
                        <div className="overflow-y-auto p-6 space-y-5 max-h-[60vh]">

                            {/* Infos */}
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
                                    <p className="text-xs text-gray-400">{formatTime(examen.created_at)}</p>
                                </div>
                            </div>

                            {/* Tarif + statut facturation */}
                            <div className={cn(
                                "p-3 rounded-lg border flex items-center justify-between gap-4",
                                examen.facture_id
                                    ? "bg-green-50 border-green-200"
                                    : "bg-amber-50 border-amber-200"
                            )}>
                                <div className="flex items-center gap-2">
                                    <Receipt className={cn(
                                        "h-4 w-4 shrink-0",
                                        examen.facture_id ? "text-green-600" : "text-amber-600"
                                    )} />
                                    <div>
                                        <p className={cn(
                                            "text-xs font-semibold",
                                            examen.facture_id ? "text-green-700" : "text-amber-700"
                                        )}>
                                            {examen.facture_id ? "✅ Facture générée" : "⏳ Pas encore facturé"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {examen.prix_unitaire
                                                ? `Tarif : ${formatCurrency(examen.prix_unitaire)}`
                                                : tarifSuggere
                                                    ? `Tarif suggéré : ${formatCurrency(tarifSuggere)}`
                                                    : "Aucun tarif défini"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {examen.notes && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs font-semibold text-blue-700 mb-1">Notes cliniques</p>
                                    <p className="text-sm text-blue-800">{examen.notes}</p>
                                </div>
                            )}

                            {/* Résultats */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Compte rendu
                                </p>

                                {modeEdition ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
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
                                                <Label>Zone anatomique</Label>
                                                <Input
                                                    value={zoneAnatomique}
                                                    onChange={(e) => setZoneAnatomique(e.target.value)}
                                                    placeholder="Ex: Thorax, Abdomen..."
                                                    className="text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* ---------------------------------------- */}
                                        {/* TARIF — génère la facture automatiquement */}
                                        {/* ---------------------------------------- */}
                                        {!examen.facture_id && (
                                            <div className="space-y-1.5">
                                                <Label className="flex items-center gap-2">
                                                    Tarif de l'examen (XAF)
                                                    {tarifSuggere && (
                                                        <span className="text-xs text-gray-400 font-normal">
                                                            — Suggéré : {formatCurrency(tarifSuggere)}
                                                        </span>
                                                    )}
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    placeholder={tarifSuggere?.toString() ?? "0"}
                                                    value={prixUnitaire}
                                                    onChange={(e) => setPrixUnitaire(e.target.value)}
                                                    className="text-sm"
                                                />
                                                <p className="text-xs text-gray-400">
                                                    💡 Une facture sera automatiquement créée à la sauvegarde.
                                                </p>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <Label>Compte rendu radiologique</Label>
                                            <Textarea
                                                placeholder={`Saisissez le compte rendu ici...\nEx:\nRadiographie du thorax de face :\n- Silhouette cardiaque normale\n- Parenchyme pulmonaire sans opacité\nConclusion : Normal`}
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
                                        <p className="text-sm text-gray-400 italic">Aucun compte rendu saisi</p>
                                    )
                                )}
                            </div>

                            {/* Upload PDF */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Fichier PDF / Image
                                </p>

                                {examen.fichier_url ? (
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <FileText className="h-5 w-5 text-green-600 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-green-800 truncate">
                                                {examen.fichier_nom ?? "Résultats.pdf"}
                                            </p>
                                            <p className="text-xs text-green-600">Fichier disponible</p>
                                        </div>
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
                                                accept=".pdf,.jpg,.jpeg,.png"
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
                                                        Cliquez pour sélectionner un fichier
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        PDF, JPG, PNG — max 10 MB
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
                                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Upload en cours...</>
                                                ) : (
                                                    <><Upload className="h-4 w-4 mr-1.5" />Uploader le fichier</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Validation */}
                            {examen.statut === "VALIDE" && examen.valide_le && (
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-sm font-semibold text-green-700 mb-0.5">✅ Validé</p>
                                    <p className="text-xs text-green-600">
                                        Le {formatDate(examen.valide_le)} à {formatTime(examen.valide_le)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="shrink-0 flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => modeEdition ? setModeEdition(false) : onOpenChange(false)}
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
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Validation...</>
                                        ) : (
                                            <><CheckCircle className="h-4 w-4 mr-1.5" />Valider l'examen</>
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
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sauvegarde...</>
                                        ) : (
                                            <><Check className="h-4 w-4 mr-1.5" />Sauvegarder</>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}