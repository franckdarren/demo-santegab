// ============================================================
// CHAMBRES GRID — Gestion des chambres et de leurs lits
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BedDouble, Plus, Check, Loader2,
  Pencil, Trash2, AlertCircle, X,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import {
  creerChambre,
  modifierChambre,
  supprimerChambre,
  creerLit,
  supprimerLit,
} from "@/app/dashboard/chambres/actions";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const TYPES_CHAMBRE = [
  { value: "COMMUNE",     label: "Commune",     couleur: "bg-gray-100 text-gray-700" },
  { value: "PRIVEE",      label: "Privée",      couleur: "bg-blue-100 text-blue-700" },
  { value: "VIP",         label: "VIP",         couleur: "bg-purple-100 text-purple-700" },
  { value: "REANIMATION", label: "Réanimation", couleur: "bg-red-100 text-red-700" },
];

interface Lit {
  id:             string;
  nom:            string;
  est_disponible: boolean;
}

interface Chambre {
  id:              string;
  numero:          string;
  service:         string | null;
  type_chambre:    string;
  prix_journalier: number;
  est_disponible:  boolean;
  description:     string | null;
  lits:            Lit[];
  hospitalisations: Array<{
    patient: { nom: string; prenom: string };
    lit:     { nom: string } | null;
  }>;
}

interface ChambresGridProps {
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

// ============================================================
// Carte individuelle d'une chambre
// ============================================================
interface ChambreCardProps {
  chambre:        Chambre;
  hospitalId:     string;
  utilisateurId:  string;
  utilisateurNom: string;
  onEdit:         (c: Chambre) => void;
  onDelete:       (c: Chambre) => void;
}

function ChambreCard({
  chambre,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  onEdit,
  onDelete,
}: ChambreCardProps) {
  const router = useRouter();
  const [isPendingLit, startLit] = useTransition();
  const [nouveauLit, setNouveauLit] = useState("");
  const [ajouterMode, setAjouterMode] = useState(false);

  const typeConfig      = TYPES_CHAMBRE.find((t) => t.value === chambre.type_chambre);
  const patientEnCours  = chambre.hospitalisations[0];
  const nbLits          = chambre.lits.length;
  const nbLibres        = chambre.lits.filter((l) => l.est_disponible).length;

  function handleAjouterLit() {
    if (!nouveauLit.trim()) return;
    startLit(async () => {
      try {
        await creerLit(chambre.id, hospitalId, utilisateurId, utilisateurNom, nouveauLit.trim());
        setNouveauLit("");
        setAjouterMode(false);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erreur");
      }
    });
  }

  function handleSupprimerLit(lit: Lit) {
    if (!confirm(`Supprimer le lit "${lit.nom}" ?`)) return;
    startLit(async () => {
      try {
        await supprimerLit(lit.id, hospitalId, utilisateurId, utilisateurNom);
        router.refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Erreur");
      }
    });
  }

  return (
    <Card className={cn(
      "border shadow-sm transition-shadow hover:shadow-md",
      chambre.est_disponible
        ? "border-gray-200"
        : "border-orange-200 bg-orange-50/30"
    )}>
      <CardContent className="p-4 space-y-3">

        {/* Header carte */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              typeConfig?.couleur ?? "bg-gray-100 text-gray-700"
            )}>
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                Chambre {chambre.numero}
              </p>
              <Badge className={cn(
                "text-[10px] border-0",
                typeConfig?.couleur ?? "bg-gray-100 text-gray-700"
              )}>
                {typeConfig?.label ?? chambre.type_chambre}
              </Badge>
            </div>
          </div>

          {/* Statut global */}
          <Badge className={cn(
            "text-[10px] border-0 shrink-0",
            chambre.est_disponible
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          )}>
            {chambre.est_disponible ? "Places libres" : "Complet"}
          </Badge>
        </div>

        {/* Service */}
        {chambre.service && (
          <p className="text-xs text-gray-500">🏥 {chambre.service}</p>
        )}

        {/* Liste des lits */}
        {nbLits > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Lits ({nbLibres}/{nbLits} libres)
            </p>
            <div className="space-y-1">
              {chambre.lits.map((lit) => (
                <div
                  key={lit.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      lit.est_disponible ? "bg-green-500" : "bg-orange-400"
                    )} />
                    <span className="text-xs text-gray-700">{lit.nom}</span>
                    {!lit.est_disponible && (
                      <span className="text-[10px] text-orange-600">Occupé</span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isPendingLit || !lit.est_disponible}
                    onClick={() => handleSupprimerLit(lit)}
                    className="text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                    title="Supprimer ce lit"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Aucun lit configuré</p>
        )}

        {/* Patient en cours */}
        {patientEnCours && (
          <p className="text-xs text-gray-500">
            👤 {patientEnCours.patient.prenom} {patientEnCours.patient.nom}
            {patientEnCours.lit && (
              <span className="text-gray-400"> — {patientEnCours.lit.nom}</span>
            )}
          </p>
        )}

        {/* Ajouter un lit */}
        {ajouterMode ? (
          <div className="flex gap-2">
            <Input
              placeholder="Nom du lit (ex: Lit A)"
              value={nouveauLit}
              onChange={(e) => setNouveauLit(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAjouterLit(); }}
              className="h-8 text-xs"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              disabled={isPendingLit || !nouveauLit.trim()}
              onClick={handleAjouterLit}
              className="h-8 px-2.5 bg-blue-700 hover:bg-blue-800 text-white"
            >
              {isPendingLit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setAjouterMode(false); setNouveauLit(""); }}
              className="h-8 px-2 text-gray-400"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAjouterMode(true)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Ajouter un lit
          </button>
        )}

        {/* Tarif */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Tarif journalier</span>
          <span className="text-base font-bold text-blue-700">
            {formatCurrency(chambre.prix_journalier)}/jour
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onEdit(chambre)}
            className="flex-1 border-gray-200 text-gray-600 hover:text-blue-700 text-xs h-8"
          >
            <Pencil className="h-3 w-3 mr-1" />
            Modifier
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!chambre.est_disponible || isPendingLit}
            onClick={() => onDelete(chambre)}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs h-8 disabled:opacity-30"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Composant principal
// ============================================================
export function ChambresGrid({
  chambres,
  hospitalId,
  utilisateurId,
  utilisateurNom,
}: ChambresGridProps) {
  const router  = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogCreer,    setDialogCreer]    = useState(false);
  const [chambreEdition, setChambreEdition] = useState<Chambre | null>(null);
  const [succes,         setSucces]         = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  // Champs du formulaire chambre
  const [numero,      setNumero]      = useState("");
  const [service,     setService]     = useState("");
  const [type,        setType]        = useState("COMMUNE");
  const [prix,        setPrix]        = useState("");
  const [description, setDescription] = useState("");

  // Lits à créer (uniquement en mode création)
  const [nomsLits,    setNomsLits]    = useState<string[]>([""]);

  function ouvrirEdition(chambre: Chambre) {
    setChambreEdition(chambre);
    setNumero(chambre.numero);
    setService(chambre.service ?? "");
    setType(chambre.type_chambre);
    setPrix(chambre.prix_journalier.toString());
    setDescription(chambre.description ?? "");
    setErrors({});
    setSucces(false);
  }

  function fermerDialog() {
    setDialogCreer(false);
    setChambreEdition(null);
    setSucces(false);
    setNumero("");
    setService("");
    setType("COMMUNE");
    setPrix("");
    setDescription("");
    setNomsLits([""]);
    setErrors({});
  }

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!numero.trim())     newErrors.numero = "Le numéro est obligatoire";
    if (!prix || Number(prix) <= 0) newErrors.prix = "Le prix doit être supérieur à 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSauvegarder() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        if (chambreEdition) {
          await modifierChambre(
            chambreEdition.id,
            hospitalId,
            utilisateurId,
            utilisateurNom,
            {
              numero,
              service:         service || null,
              type_chambre:    type,
              prix_journalier: Number(prix),
              description:     description || null,
            }
          );
        } else {
          const lits = nomsLits.map((n) => n.trim()).filter(Boolean);
          await creerChambre(
            hospitalId,
            utilisateurId,
            utilisateurNom,
            {
              numero,
              service:         service || undefined,
              type_chambre:    type,
              prix_journalier: Number(prix),
              description:     description || undefined,
              noms_lits:       lits.length > 0 ? lits : undefined,
            }
          );
        }
        setSucces(true);
        router.refresh();
        setTimeout(() => fermerDialog(), 1200);
      } catch (error) {
        setErrors({ global: "Erreur lors de la sauvegarde." });
        console.error(error);
      }
    });
  }

  function handleSupprimer(chambre: Chambre) {
    if (!confirm(`Supprimer la chambre ${chambre.numero} ?`)) return;

    startTransition(async () => {
      try {
        await supprimerChambre(
          chambre.id,
          hospitalId,
          utilisateurId,
          utilisateurNom
        );
        router.refresh();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erreur lors de la suppression.";
        alert(message);
        console.error(error);
      }
    });
  }

  const isDialogOpen = dialogCreer || chambreEdition !== null;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {chambres.length} chambre{chambres.length > 1 ? "s" : ""} configurée{chambres.length > 1 ? "s" : ""}
        </p>
        <Button
          type="button"
          onClick={() => { setDialogCreer(true); setErrors({}); setSucces(false); }}
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle chambre
        </Button>
      </div>

      {/* Grille */}
      {chambres.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
          <BedDouble className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune chambre configurée</p>
          <p className="text-gray-400 text-sm mt-1">
            Ajoutez des chambres pour gérer les hospitalisations
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {chambres.map((chambre) => (
            <ChambreCard
              key={chambre.id}
              chambre={chambre}
              hospitalId={hospitalId}
              utilisateurId={utilisateurId}
              utilisateurNom={utilisateurNom}
              onEdit={ouvrirEdition}
              onDelete={handleSupprimer}
            />
          ))}
        </div>
      )}

      {/* Dialog créer / modifier */}
      <Dialog open={isDialogOpen} onOpenChange={fermerDialog}>
        <DialogContent className="max-w-md! w-full p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">
            {chambreEdition ? "Modifier la chambre" : "Nouvelle chambre"}
          </DialogTitle>

          {succes ? (
            <div className="flex flex-col items-center justify-center gap-4 p-10">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-base font-semibold text-gray-900">
                {chambreEdition ? "Chambre modifiée !" : "Chambre créée !"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="px-5 py-4 border-b bg-gray-50">
                <h2 className="text-base font-semibold text-gray-900">
                  {chambreEdition
                    ? `Modifier la chambre ${chambreEdition.numero}`
                    : "Nouvelle chambre"}
                </h2>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {errors.global && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{errors.global}</p>
                  </div>
                )}

                {/* Numéro + Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Numéro <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="101, VIP-02..."
                      value={numero}
                      onChange={(e) => {
                        setNumero(e.target.value);
                        if (errors.numero) setErrors((p) => ({ ...p, numero: "" }));
                      }}
                      className={cn(errors.numero && "border-red-400")}
                    />
                    <FieldError message={errors.numero} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className={selectClass}
                    >
                      {TYPES_CHAMBRE.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Service */}
                <div className="space-y-1.5">
                  <Label>Service</Label>
                  <Input
                    placeholder="Chirurgie, Médecine..."
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                  />
                </div>

                {/* Prix journalier */}
                <div className="space-y-1.5">
                  <Label>Prix journalier (XAF) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="15000"
                    value={prix}
                    onChange={(e) => {
                      setPrix(e.target.value);
                      if (errors.prix) setErrors((p) => ({ ...p, prix: "" }));
                    }}
                    className={cn(errors.prix && "border-red-400")}
                  />
                  <FieldError message={errors.prix} />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input
                    placeholder="Climatisée, TV, salle de bain privée..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Lits — uniquement en mode création */}
                {!chambreEdition && (
                  <div className="space-y-2">
                    <Label>
                      Lits
                      <span className="text-gray-400 font-normal ml-1">(optionnel)</span>
                    </Label>
                    <p className="text-xs text-gray-400">
                      Vous pouvez ajouter les lits maintenant ou plus tard depuis la grille.
                    </p>
                    <div className="space-y-2">
                      {nomsLits.map((nom, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            placeholder={`Lit ${i + 1} (ex: Lit A)`}
                            value={nom}
                            onChange={(e) => {
                              const copy = [...nomsLits];
                              copy[i] = e.target.value;
                              setNomsLits(copy);
                            }}
                            className="h-8 text-sm"
                          />
                          {nomsLits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setNomsLits(nomsLits.filter((_, j) => j !== i))}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setNomsLits([...nomsLits, ""])}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Ajouter un lit
                    </button>
                  </div>
                )}

                {/* En mode édition : rappel que les lits se gèrent depuis la carte */}
                {chambreEdition && (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2.5">
                    💡 Pour gérer les lits, utilisez les boutons directement sur la carte de la chambre.
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center px-5 py-4 border-t bg-gray-50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={fermerDialog}
                  className="text-gray-500"
                >
                  Annuler
                </Button>
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
                      {chambreEdition ? "Sauvegarder" : "Créer la chambre"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
