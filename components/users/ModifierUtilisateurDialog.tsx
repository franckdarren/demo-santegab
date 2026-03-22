// ============================================================
// MODIFIER UTILISATEUR — Rôle, infos, activation
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Check, Loader2, Pencil, AlertCircle,
  UserCheck, UserX, RefreshCw,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import {
  modifierUtilisateur,
  toggleActivationUtilisateur,
  reinitialiserMotDePasse,
} from "@/app/dashboard/users/actions";
import { Role } from "@/app/generated/prisma/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: Role;
  est_actif: boolean;
}

interface ModifierUtilisateurDialogProps {
  utilisateur: Utilisateur;
  hospitalId: string;
  adminId: string;
  adminNom: string;
}

export function ModifierUtilisateurDialog({
  utilisateur,
  hospitalId,
  adminId,
  adminNom,
}: ModifierUtilisateurDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isPendingToggle, startTransitionToggle] = useTransition();
  const [isPendingReset, startTransitionReset] = useTransition();
  const [succes, setSucces] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [role, setRole] = useState<Role>(utilisateur.role);
  const [formData, setFormData] = useState({
    nom:       utilisateur.nom,
    prenom:    utilisateur.prenom,
    telephone: utilisateur.telephone ?? "",
  });

  const nomComplet = `${utilisateur.prenom} ${utilisateur.nom}`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function valider(): boolean {
    const newErrors: Record<string, string> = {};
    if (!formData.nom.trim())    newErrors.nom    = "Le nom est obligatoire";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est obligatoire";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function close() {
    setSucces(null);
    setErrors({});
    setOpen(false);
  }

  function handleSauvegarder() {
    if (!valider()) return;

    startTransition(async () => {
      try {
        await modifierUtilisateur(
          utilisateur.id,
          hospitalId,
          adminId,
          adminNom,
          {
            nom:       formData.nom,
            prenom:    formData.prenom,
            telephone: formData.telephone || undefined,
            role,
          }
        );
        setSucces("Modifications enregistrées !");
        router.refresh();
        setTimeout(() => close(), 1200);
      } catch (error) {
        setErrors({ global: "Erreur lors de la modification." });
        console.error(error);
      }
    });
  }

  function handleToggleActivation() {
    startTransitionToggle(async () => {
      try {
        // ← adminId + adminNom ajoutés
        await toggleActivationUtilisateur(
          utilisateur.id,
          hospitalId,
          !utilisateur.est_actif,
          adminId,
          adminNom
        );
        router.refresh();
        close();
      } catch (error) {
        console.error(error);
      }
    });
  }

  function handleResetPassword() {
    startTransitionReset(async () => {
      try {
        // ← adminId + adminNom + hospitalId ajoutés
        await reinitialiserMotDePasse(
          utilisateur.email,
          adminId,
          adminNom,
          hospitalId
        );
        setSucces("Email de réinitialisation envoyé !");
        setTimeout(() => setSucces(null), 3000);
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-gray-200 text-gray-500 hover:text-blue-700 text-xs h-8 px-3"
      >
        <Pencil className="h-3 w-3 mr-1" />
        Modifier
      </Button>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-md! w-full p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">Modifier l'utilisateur</DialogTitle>

          {succes ? (
            <div className="flex flex-col items-center justify-center gap-4 p-10">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-base font-semibold text-gray-900">{succes}</p>
            </div>
          ) : (
            <div className="flex flex-col">

              {/* Header */}
              <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className={cn(
                    "font-semibold text-sm",
                    utilisateur.est_actif
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-400"
                  )}>
                    {getInitials(nomComplet)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {nomComplet}
                  </h2>
                  <p className="text-xs text-gray-400">{utilisateur.email}</p>
                </div>
                {!utilisateur.est_actif && (
                  <Badge className="ml-auto text-xs bg-gray-100 text-gray-500 border-0">
                    Désactivé
                  </Badge>
                )}
              </div>

              <div className="p-5 space-y-4">

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
                      value={formData.nom}
                      onChange={handleChange}
                      className={cn("uppercase", errors.nom && "border-red-400")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prénom <span className="text-red-500">*</span></Label>
                    <Input
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      className={cn(errors.prenom && "border-red-400")}
                    />
                  </div>
                </div>

                {/* Téléphone + Rôle */}
                <div className="grid grid-cols-2 gap-3">
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
                    <Label>Rôle</Label>
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

                {/* Actions secondaires */}
                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Actions
                  </p>

                  {/* Reset mot de passe */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPendingReset}
                    onClick={handleResetPassword}
                    className="w-full border-gray-200 text-gray-600 text-xs justify-start"
                  >
                    {isPendingReset ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    )}
                    Envoyer email de réinitialisation
                  </Button>

                  {/* Activer / désactiver */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPendingToggle}
                    onClick={handleToggleActivation}
                    className={cn(
                      "w-full text-xs justify-start",
                      utilisateur.est_actif
                        ? "border-red-200 text-red-600 hover:bg-red-50"
                        : "border-green-200 text-green-600 hover:bg-green-50"
                    )}
                  >
                    {isPendingToggle ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : utilisateur.est_actif ? (
                      <>
                        <UserX className="h-3.5 w-3.5 mr-2" />
                        Désactiver ce compte
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5 mr-2" />
                        Réactiver ce compte
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center px-5 py-4 border-t bg-gray-50">
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}