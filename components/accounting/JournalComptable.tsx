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
  Plus, TrendingUp, TrendingDown,
  Check, Loader2, AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  TypeEcriture,
  CategorieDepense,
} from "@/app/generated/prisma/client";
import { creerEcriture } from "@/app/dashboard/accounting/actions";

const TYPE_CONFIG: Record<TypeEcriture, {
  label: string;
  color: string;
  icon: React.ElementType;
}> = {
  RECETTE:    { label: "Recette",    color: "bg-green-100 text-green-700", icon: TrendingUp },
  DEPENSE:    { label: "Dépense",    color: "bg-red-100 text-red-700",     icon: TrendingDown },
  AJUSTEMENT: { label: "Ajustement", color: "bg-blue-100 text-blue-700",   icon: TrendingUp },
};

const CATEGORIE_LABELS: Record<CategorieDepense, string> = {
  SALAIRES:    "Salaires",
  MEDICAMENTS: "Médicaments",
  EQUIPEMENT:  "Équipement",
  LOYER:       "Loyer",
  ELECTRICITE: "Électricité",
  EAU:         "Eau",
  TELEPHONE:   "Téléphone",
  FOURNITURES: "Fournitures",
  MAINTENANCE: "Maintenance",
  AUTRE:       "Autre",
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface Ecriture {
  id: string;
  type_ecriture: TypeEcriture;
  categorie: CategorieDepense | null;
  libelle: string;
  montant: number;
  date_ecriture: Date;
  reference: string | null;
  notes: string | null;
}

interface JournalComptableProps {
  ecritures: Ecriture[];
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string; // ← ajouté pour l'audit
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

export function JournalComptable({
  ecritures,
  hospitalId,
  utilisateurId,
  utilisateurNom, // ← ajouté pour l'audit
}: JournalComptableProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filtre, setFiltre] = useState<TypeEcriture | "">("");

  const [typeEcriture, setTypeEcriture] = useState<TypeEcriture>("DEPENSE");
  const [categorie, setCategorie] = useState<CategorieDepense | "">("");
  const [formData, setFormData] = useState({
    libelle:       "",
    montant:       "",
    reference:     "",
    notes:         "",
    date_ecriture: new Date().toISOString().split("T")[0],
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.libelle.trim()) {
      newErrors.libelle = "Le libellé est obligatoire";
    }
    if (!formData.montant || Number(formData.montant) <= 0) {
      newErrors.montant = "Le montant doit être supérieur à 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function closeDialog() {
    setSucces(false);
    setTypeEcriture("DEPENSE");
    setCategorie("");
    setFormData({
      libelle: "", montant: "", reference: "", notes: "",
      date_ecriture: new Date().toISOString().split("T")[0],
    });
    setErrors({});
    setDialogOpen(false);
  }

  function handleCreer() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        // ← utilisateurNom ajouté en 3ème argument
        await creerEcriture(hospitalId, utilisateurId, utilisateurNom, {
          type_ecriture: typeEcriture,
          libelle:       formData.libelle,
          montant:       Number(formData.montant),
          categorie:     categorie as CategorieDepense || undefined,
          reference:     formData.reference || undefined,
          notes:         formData.notes || undefined,
          date_ecriture: formData.date_ecriture,
        });
        setSucces(true);
        router.refresh();
        setTimeout(() => closeDialog(), 1200);
      } catch (error) {
        setErrors({ global: "Erreur lors de l'enregistrement." });
        console.error(error);
      }
    });
  }

  const ecrituresFiltrees = ecritures.filter((e) =>
    filtre ? e.type_ecriture === filtre : true
  );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Journal comptable
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Toutes les écritures du mois en cours
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle écriture
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {[
          { label: "Toutes",   value: "" },
          { label: "Recettes", value: "RECETTE" },
          { label: "Dépenses", value: "DEPENSE" },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltre(f.value as TypeEcriture | "")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              filtre === f.value
                ? "bg-blue-700 text-white border-blue-700"
                : "border-gray-200 text-gray-600 hover:border-blue-300 bg-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tableau journal */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {ecrituresFiltrees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-400 text-sm">
                Aucune écriture pour ce mois
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {ecrituresFiltrees.map((e) => {
                const config = TYPE_CONFIG[e.type_ecriture];
                const Icon = config.icon;

                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    {/* Icône type */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      config.color
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Libellé + catégorie */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {e.libelle}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {e.reference && (
                          <span className="text-xs text-gray-400">
                            {e.reference}
                          </span>
                        )}
                        {e.categorie && (
                          <span className="text-xs text-gray-400">
                            · {CATEGORIE_LABELS[e.categorie]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <p className="text-xs text-gray-400 hidden sm:block shrink-0">
                      {formatDate(e.date_ecriture)}
                    </p>

                    {/* Montant */}
                    <p className={cn(
                      "text-sm font-bold shrink-0 min-w-25 text-right",
                      e.type_ecriture === "RECETTE"
                        ? "text-green-600"
                        : "text-red-600"
                    )}>
                      {e.type_ecriture === "RECETTE" ? "+" : "-"}
                      {formatCurrency(e.montant)}
                    </p>

                    {/* Badge */}
                    <Badge className={cn(
                      "text-xs border-0 shrink-0 hidden sm:flex",
                      config.color
                    )}>
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog nouvelle écriture */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-lg! w-full p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">Nouvelle écriture</DialogTitle>

          {succes ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">
                Écriture enregistrée !
              </p>
            </div>
          ) : (
            <div className="flex flex-col">

              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-base font-semibold text-gray-900">
                  Nouvelle écriture comptable
                </h2>
              </div>

              <div className="overflow-y-auto p-6 space-y-4 max-h-[65vh]">

                {errors.global && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{errors.global}</p>
                  </div>
                )}

                {/* Type */}
                <div className="space-y-1.5">
                  <Label>Type d'écriture</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["RECETTE", "DEPENSE"] as TypeEcriture[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTypeEcriture(t)}
                        className={cn(
                          "py-2 rounded-lg border-2 text-sm font-medium transition-all",
                          typeEcriture === t
                            ? t === "RECETTE"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : "border-red-500 bg-red-50 text-red-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        )}
                      >
                        {t === "RECETTE" ? "✅ Recette" : "❌ Dépense"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Libellé */}
                <div className="space-y-1.5">
                  <Label>
                    Libellé <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    name="libelle"
                    placeholder="Ex: Salaires personnel Mars 2025"
                    value={formData.libelle}
                    onChange={handleChange}
                    className={cn(errors.libelle && "border-red-400")}
                  />
                  <FieldError message={errors.libelle} />
                </div>

                {/* Montant + Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>
                      Montant (XAF) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      name="montant"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formData.montant}
                      onChange={handleChange}
                      className={cn(errors.montant && "border-red-400")}
                    />
                    <FieldError message={errors.montant} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      name="date_ecriture"
                      type="date"
                      value={formData.date_ecriture}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Catégorie si dépense */}
                {typeEcriture === "DEPENSE" && (
                  <div className="space-y-1.5">
                    <Label>Catégorie</Label>
                    <select
                      value={categorie}
                      onChange={(e) =>
                        setCategorie(e.target.value as CategorieDepense)
                      }
                      className={selectClass}
                    >
                      <option value="">Sélectionner...</option>
                      {Object.entries(CATEGORIE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Référence */}
                <div className="space-y-1.5">
                  <Label>Référence</Label>
                  <Input
                    name="reference"
                    placeholder="N° facture, bon de commande..."
                    value={formData.reference}
                    onChange={handleChange}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Input
                    name="notes"
                    placeholder="Commentaire optionnel..."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeDialog}
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
                    typeEcriture === "RECETTE"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      Enregistrer
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