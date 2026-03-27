"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { creerPatient } from "@/app/dashboard/patients/actions";

const STEPS = [
  { id: 1, title: "Identité", desc: "Informations personnelles" },
  { id: 2, title: "Contact", desc: "Coordonnées du patient" },
  { id: 3, title: "Médical", desc: "Santé & assurance" },
];

const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ASSURANCES = [
  "CNAMGS", "ASCOMA", "AXA", "Sunu",
  "OGAR", "Gras Savoye", "OLEA", "Allianz", "Sanlam", "ACR",
];

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

// ============================================================
// Types pour les champs du formulaire et les erreurs
// ============================================================
interface FormData {
  nom: string;
  prenom: string;
  date_naissance: string;
  adresse: string;
  telephone: string;
  email: string;
  allergies: string;
  antecedents: string;
  taux_couverture: string;
  assurance_numero: string;
}

interface FormErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  taux_couverture?: string;
  global?: string;
}

interface NouveauPatientDialogProps {
  hospitalId: string;
  open: boolean;
  utilisateurId: string;
  utilisateurNom: string;
  onOpenChange: (open: boolean) => void;
}

// ============================================================
// Composant réutilisable — champ avec message d'erreur
// ============================================================
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
      <p className="text-xs text-red-500">{message}</p>
    </div>
  );
}

export function NouveauPatientDialog({
  hospitalId,
  utilisateurId,
  utilisateurNom,
  open,
  onOpenChange,
}: NouveauPatientDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);

  // Valeurs du formulaire
  const [sexe, setSexe] = useState("");
  const [groupeSanguin, setGroupeSanguin] = useState("");
  const [assurance, setAssurance] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // ============================================================
  // Valeurs texte gérées en state pour pouvoir les valider
  // en temps réel et afficher les erreurs
  // ============================================================
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    date_naissance: "",
    adresse: "",
    telephone: "",
    email: "",
    allergies: "",
    antecedents: "",
    taux_couverture: "",
    assurance_numero: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Efface l'erreur du champ dès que l'utilisateur commence à corriger
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function close() {
    setStep(1);
    setSucces(false);
    setSexe("");
    setGroupeSanguin("");
    setAssurance("");
    setErrors({});
    setFormData({
      nom: "", prenom: "", date_naissance: "", adresse: "",
      telephone: "", email: "", allergies: "", antecedents: "",
      taux_couverture: "", assurance_numero: "",
    });
    onOpenChange(false);
  }

  // ============================================================
  // Validation par étape — retourne true si l'étape est valide
  // ============================================================
  function validerEtape(etape: number): boolean {
    const newErrors: FormErrors = {};

    if (etape === 1) {
      if (!formData.nom.trim()) {
        newErrors.nom = "Le nom est obligatoire";
      } else if (formData.nom.trim().length < 2) {
        newErrors.nom = "Le nom doit contenir au moins 2 caractères";
      }

      if (!formData.prenom.trim()) {
        newErrors.prenom = "Le prénom est obligatoire";
      } else if (formData.prenom.trim().length < 2) {
        newErrors.prenom = "Le prénom doit contenir au moins 2 caractères";
      }
    }

    if (etape === 2) {
      // Email optionnel mais doit être valide si renseigné
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "L'adresse email n'est pas valide";
      }
    }

    if (etape === 3) {
      // Taux de couverture doit être entre 0 et 100 si renseigné
      if (formData.taux_couverture) {
        const taux = Number(formData.taux_couverture);
        if (isNaN(taux) || taux < 0 || taux > 100) {
          newErrors.taux_couverture = "Le taux doit être compris entre 0 et 100";
        }
      }
    }

    setErrors(newErrors);

    // Retourne true si aucune erreur
    return Object.keys(newErrors).length === 0;
  }

  function handleContinuer() {
    if (validerEtape(step)) {
      setStep((s) => s + 1);
    }
  }

  function handleCreer() {
    if (!validerEtape(3)) return;

    startTransition(async () => {
      try {
        await creerPatient(hospitalId, utilisateurId,
          utilisateurNom, {
          nom: formData.nom,
          prenom: formData.prenom,
          date_naissance: formData.date_naissance || undefined,
          adresse: formData.adresse || undefined,
          telephone: formData.telephone || undefined,
          email: formData.email || undefined,
          allergies: formData.allergies || undefined,
          antecedents: formData.antecedents || undefined,
          sexe: sexe as "MASCULIN" | "FEMININ" | undefined,
          groupe_sanguin: groupeSanguin || undefined,
          assurance_nom: assurance || undefined,
          assurance_numero: formData.assurance_numero || undefined,
          taux_couverture: formData.taux_couverture
            ? Number(formData.taux_couverture)
            : undefined,
        });
        setSucces(true);
        router.refresh();
        setTimeout(() => close(), 1500);
      } catch (error) {
        // Affiche l'erreur dans le formulaire — pas seulement en console
        setErrors({
          global: "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
        });
        console.error("Erreur création patient :", error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl! w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Nouveau patient</DialogTitle>

        <div className="flex min-h-135">

          {/* -------------------------------------------------- */}
          {/* SIDEBAR GAUCHE                                      */}
          {/* -------------------------------------------------- */}
          <div className="w-56 shrink-0 bg-blue-950 text-white flex flex-col p-6">
            <div className="mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                <span className="text-xl">🏥</span>
              </div>
              <h2 className="text-base font-bold">Nouveau patient</h2>
              <p className="text-xs text-blue-300 mt-0.5">Enregistrement dossier</p>
            </div>

            <div className="space-y-2 flex-1">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex gap-3 items-start p-2.5 rounded-lg transition-colors",
                    step === s.id && "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors",
                    step > s.id && "bg-green-400 text-white",
                    step === s.id && "bg-cyan-400 text-blue-950",
                    step < s.id && "bg-white/10 text-white/40"
                  )}>
                    {step > s.id ? <Check size={13} /> : s.id}
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      step === s.id ? "text-white" : "text-white/40"
                    )}>
                      {s.title}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-white/10">
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>Progression</span>
                <span>{Math.round(((step - 1) / 3) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* ZONE DROITE — Pas de balise <form>                  */}
          {/* -------------------------------------------------- */}
          <div className="flex-1 flex flex-col">

            {succes ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    Patient créé avec succès !
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Le dossier a été enregistré.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">

                <div className="flex-1 overflow-y-auto p-8">

                  {/* Erreur globale (erreur serveur) */}
                  {errors.global && (
                    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <p className="text-sm text-red-600">{errors.global}</p>
                    </div>
                  )}

                  {/* ------------------------------------------ */}
                  {/* ÉTAPE 1 — IDENTITÉ                          */}
                  {/* ------------------------------------------ */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Identité du patient
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          Informations d&apos;état civil
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>
                            Nom <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="nom"
                            placeholder="NZIGOU"
                            value={formData.nom}
                            onChange={handleChange}
                            className={cn(
                              "uppercase",
                              errors.nom && "border-red-400 focus-visible:ring-red-400"
                            )}
                          />
                          <FieldError message={errors.nom} />
                        </div>

                        <div className="space-y-1.5">
                          <Label>
                            Prénom <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            name="prenom"
                            placeholder="Alphonse"
                            value={formData.prenom}
                            onChange={handleChange}
                            className={cn(
                              errors.prenom && "border-red-400 focus-visible:ring-red-400"
                            )}
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

                      <div className="space-y-1.5">
                        <Label>Adresse</Label>
                        <Input
                          name="adresse"
                          placeholder="Quartier, ville..."
                          value={formData.adresse}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------ */}
                  {/* ÉTAPE 2 — CONTACT                           */}
                  {/* ------------------------------------------ */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Coordonnées
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          Informations de contact du patient
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Téléphone</Label>
                        <Input
                          name="telephone"
                          placeholder="+241 07 XX XX XX"
                          value={formData.telephone}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input
                          name="email"
                          type="email"
                          placeholder="patient@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          className={cn(
                            errors.email && "border-red-400 focus-visible:ring-red-400"
                          )}
                        />
                        <FieldError message={errors.email} />
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------ */}
                  {/* ÉTAPE 3 — MÉDICAL + ASSURANCE               */}
                  {/* ------------------------------------------ */}
                  {step === 3 && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Informations médicales
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          Données de santé et couverture assurance
                        </p>
                      </div>

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
                                  ? "bg-red-600 text-white border-red-600 shadow-sm"
                                  : "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600"
                              )}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Allergies connues</Label>
                        <Input
                          name="allergies"
                          placeholder="Pénicilline, Aspirine..."
                          value={formData.allergies}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Antécédents médicaux</Label>
                        <Textarea
                          name="antecedents"
                          placeholder="Diabète, HTA, chirurgies antérieures..."
                          rows={3}
                          className="resize-none"
                          value={formData.antecedents}
                          onChange={handleChange}
                        />
                      </div>

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
                              <option value="">Aucun</option>
                              {ASSURANCES.map((a) => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <Label>Taux de couverture (%)</Label>
                            <Input
                              name="taux_couverture"
                              type="number"
                              min={0}
                              max={100}
                              placeholder="80"
                              className={cn(
                                "bg-white",
                                errors.taux_couverture && "border-red-400 focus-visible:ring-red-400"
                              )}
                              value={formData.taux_couverture}
                              onChange={handleChange}
                            />
                            <FieldError message={errors.taux_couverture} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label>Numéro de carte</Label>
                          <Input
                            name="assurance_numero"
                            placeholder="N° adhérent"
                            className="bg-white"
                            value={formData.assurance_numero}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ------------------------------------------ */}
                {/* FOOTER — Navigation                         */}
                {/* ------------------------------------------ */}
                <div className="flex justify-between items-center px-8 py-4 border-t bg-gray-50 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={step === 1 ? close : () => setStep((s) => s - 1)}
                    className="text-gray-500"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {step === 1 ? "Annuler" : "Précédent"}
                  </Button>

                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={handleContinuer}
                      className="bg-blue-700 hover:bg-blue-800 text-white"
                    >
                      Continuer
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
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
                          Créer le patient
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}