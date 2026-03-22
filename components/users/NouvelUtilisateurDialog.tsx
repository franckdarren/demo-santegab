// ============================================================
// NOUVEL UTILISATEUR — Création avec compte Supabase Auth
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { creerUtilisateur } from "@/app/dashboard/users/actions";
import { Role } from "@/app/generated/prisma/client";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const ROLES: { value: Role; label: string }[] = [
  { value: "ADMIN",         label: "Administrateur" },
  { value: "MEDECIN",       label: "Médecin" },
  { value: "INFIRMIER",     label: "Infirmier(e)" },
  { value: "LABORANTIN",    label: "Laborantin" },
  { value: "RADIOLOGUE",    label: "Radiologue" },
  { value: "PHARMACIEN",    label: "Pharmacien" },
  { value: "COMPTABLE",     label: "Comptable" },
  { value: "ADMINISTRATIF", label: "Administratif" },
];

interface NouvelUtilisateurDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalId: string;
  adminId: string;  // ← ajouté pour l'audit
  adminNom: string; // ← ajouté pour l'audit
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

export function NouvelUtilisateurDialog({
  open,
  onOpenChange,
  hospitalId,
  adminId,  // ← ajouté
  adminNom, // ← ajouté
}: NouvelUtilisateurDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [role, setRole] = useState<Role>("MEDECIN");

  const [formData, setFormData] = useState({
    nom:          "",
    prenom:       "",
    email:        "",
    telephone:    "",
    mot_de_passe: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.nom.trim())    newErrors.nom    = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    if (!formData.email.trim())  newErrors.email  = "L'email est obligatoire";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.mot_de_passe) {
      newErrors.mot_de_passe = "Le mot de passe est obligatoire";
    } else if (formData.mot_de_passe.length < 8) {
      newErrors.mot_de_passe = "Minimum 8 caractères";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(false);
    setRole("MEDECIN");
    setFormData({ nom: "", prenom: "", email: "", telephone: "", mot_de_passe: "" });
    setErrors({});
    onOpenChange(false);
  }

  function handleCreer() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        // ← adminId + adminNom ajoutés
        await creerUtilisateur(
          hospitalId,
          adminId,
          adminNom,
          {
            nom:          formData.nom,
            prenom:       formData.prenom,
            email:        formData.email,
            telephone:    formData.telephone || undefined,
            role,
            mot_de_passe: formData.mot_de_passe,
          }
        );
        setSucces(true);
        router.refresh();
        setTimeout(() => close(), 1500);
      } catch (error: any) {
        setErrors({
          global: error.message ?? "Erreur lors de la création. Vérifiez que l'email n'est pas déjà utilisé.",
        });
        console.error(error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg! w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Nouvel utilisateur</DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">
                Utilisateur créé !
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Le compte est actif et prêt à être utilisé.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">

            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                Nouvel utilisateur
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Crée un compte et un accès à la plateforme
              </p>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 max-h-[65vh]">

              {errors.global && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{errors.global}</p>
                </div>
              )}

              {/* Nom + Prénom */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nom <span className="text-red-500">*</span></Label>
                  <Input
                    name="nom"
                    placeholder="NGUEMA"
                    value={formData.nom}
                    onChange={handleChange}
                    className={cn("uppercase", errors.nom && "border-red-400")}
                  />
                  <FieldError message={errors.nom} />
                </div>
                <div className="space-y-1.5">
                  <Label>Prénom <span className="text-red-500">*</span></Label>
                  <Input
                    name="prenom"
                    placeholder="Pierre"
                    value={formData.prenom}
                    onChange={handleChange}
                    className={cn(errors.prenom && "border-red-400")}
                  />
                  <FieldError message={errors.prenom} />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="p.nguema@elrapha.ga"
                  value={formData.email}
                  onChange={handleChange}
                  className={cn(errors.email && "border-red-400")}
                />
                <FieldError message={errors.email} />
              </div>

              {/* Téléphone + Rôle */}
              <div className="grid grid-cols-2 gap-3">
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
                  <Label>Rôle <span className="text-red-500">*</span></Label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className={selectClass}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <Label>Mot de passe <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    name="mot_de_passe"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 caractères"
                    value={formData.mot_de_passe}
                    onChange={handleChange}
                    className={cn("pr-10", errors.mot_de_passe && "border-red-400")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FieldError message={errors.mot_de_passe} />
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  💡 Le compte sera immédiatement actif. L'utilisateur peut
                  se connecter avec cet email et ce mot de passe.
                </p>
              </div>
            </div>

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
                disabled={isPending}
                onClick={handleCreer}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Créer l'utilisateur
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