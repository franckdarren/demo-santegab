// ============================================================
// MODIFIER PATIENT — Dialog pré-rempli
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { modifierPatient } from "@/app/dashboard/patients/actions";
import { Sexe } from "@/app/generated/prisma/client";
import { format } from "date-fns";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ASSURANCES = [
  "CNAMGS", "ASCOMA", "AXA", "Sunu",
  "OGAR", "Gras Savoye", "OLEA", "Allianz", "Sanlam", "ACR",
];

interface ModifierPatientDialogProps {
  patient: {
    id: string;
    nom: string;
    prenom: string;
    date_naissance: Date | null;
    sexe: Sexe | null;
    telephone: string | null;
    email: string | null;
    adresse: string | null;
    groupe_sanguin: string | null;
    allergies: string | null;
    antecedents: string | null;
    assurance_nom: string | null;
    assurance_numero: string | null;
    taux_couverture: number | null;
  };
  hospitalId: string;
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

export function ModifierPatientDialog({
  patient,
  hospitalId,
}: ModifierPatientDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pré-remplit avec les données actuelles du patient
  const [sexe, setSexe] = useState(patient.sexe ?? "");
  const [groupeSanguin, setGroupeSanguin] = useState(patient.groupe_sanguin ?? "");
  const [assurance, setAssurance] = useState(patient.assurance_nom ?? "");
  const [formData, setFormData] = useState({
    nom: patient.nom,
    prenom: patient.prenom,
    date_naissance: patient.date_naissance
      ? format(new Date(patient.date_naissance), "yyyy-MM-dd")
      : "",
    adresse: patient.adresse ?? "",
    telephone: patient.telephone ?? "",
    email: patient.email ?? "",
    allergies: patient.allergies ?? "",
    antecedents: patient.antecedents ?? "",
    taux_couverture: patient.taux_couverture?.toString() ?? "",
    assurance_numero: patient.assurance_numero ?? "",
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
    if (!formData.nom.trim()) newErrors.nom = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (formData.taux_couverture) {
      const t = Number(formData.taux_couverture);
      if (isNaN(t) || t < 0 || t > 100) {
        newErrors.taux_couverture = "Le taux doit être entre 0 et 100";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSauvegarder() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        await modifierPatient(patient.id, hospitalId, {
          ...formData,
          sexe: sexe as "MASCULIN" | "FEMININ" | undefined,
          groupe_sanguin: groupeSanguin || undefined,
          assurance_nom: assurance || undefined,
          taux_couverture: formData.taux_couverture
            ? Number(formData.taux_couverture)
            : undefined,
        });
        setSucces(true);
        router.refresh();
        setTimeout(() => {
          setSucces(false);
          setOpen(false);
        }, 1500);
      } catch (error) {
        setErrors({ global: "Erreur lors de la sauvegarde. Réessayez." });
        console.error(error);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-300"
      >
        <Pencil className="h-4 w-4 mr-1.5" />
        Modifier
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="!max-w-2xl w-full p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">Modifier le patient</DialogTitle>

          {succes ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  Modifications enregistrées !
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">

              {/* Header du dialog */}
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-base font-semibold text-gray-900">
                  Modifier le dossier patient
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {patient.prenom} {patient.nom} · {patient.id.slice(0, 8)}
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

                {/* Identité */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Identité
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Nom <span className="text-red-500">*</span></Label>
                      <Input
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        className={cn(
                          "uppercase",
                          errors.nom && "border-red-400"
                        )}
                      />
                      <FieldError message={errors.nom} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Prénom <span className="text-red-500">*</span></Label>
                      <Input
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        className={cn(errors.prenom && "border-red-400")}
                      />
                      <FieldError message={errors.prenom} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Sexe</Label>
                      <select
                        value={sexe}
                        onChange={(e) => setSexe(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Sélectionner</option>
                        <option value="MASCULIN">Masculin</option>
                        <option value="FEMININ">Féminin</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date de naissance</Label>
                      <Input
                        name="date_naissance"
                        type="date"
                        value={formData.date_naissance}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Contact
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Téléphone</Label>
                      <Input
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleChange}
                        placeholder="+241 07 XX XX XX"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={cn(errors.email && "border-red-400")}
                      />
                      <FieldError message={errors.email} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Adresse</Label>
                    <Input
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      placeholder="Quartier, ville..."
                    />
                  </div>
                </div>

                {/* Médical */}
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Informations médicales
                  </p>

                  <div className="space-y-2">
                    <Label>Groupe sanguin</Label>
                    <div className="flex flex-wrap gap-2">
                      {GROUPES_SANGUINS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() =>
                            setGroupeSanguin(groupeSanguin === g ? "" : g)
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                            groupeSanguin === g
                              ? "bg-red-600 text-white border-red-600"
                              : "border-gray-200 text-gray-600 hover:border-red-300"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Allergies</Label>
                    <Input
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="Pénicilline, Aspirine..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Antécédents médicaux</Label>
                    <Textarea
                      name="antecedents"
                      value={formData.antecedents}
                      onChange={handleChange}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Assurance */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Assurance maladie
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Organisme</Label>
                      <select
                        value={assurance}
                        onChange={(e) => setAssurance(e.target.value)}
                        className={cn(selectClass, "bg-white")}
                      >
                        <option value="">Choisir...</option>
                        {ASSURANCES.map((a) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Taux (%)</Label>
                      <Input
                        name="taux_couverture"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.taux_couverture}
                        onChange={handleChange}
                        className={cn(
                          "bg-white",
                          errors.taux_couverture && "border-red-400"
                        )}
                      />
                      <FieldError message={errors.taux_couverture} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Numéro de carte</Label>
                    <Input
                      name="assurance_numero"
                      value={formData.assurance_numero}
                      onChange={handleChange}
                      className="bg-white"
                      placeholder="N° adhérent"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="text-gray-500"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={handleSauvegarder}
                  className="bg-blue-700 hover:bg-blue-800 text-white items-center"
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}