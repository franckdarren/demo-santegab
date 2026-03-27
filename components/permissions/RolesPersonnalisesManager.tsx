// ============================================================
// RÔLES PERSONNALISÉS — Interface de gestion complète
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Users, Check,
  Loader2, AlertCircle, ShieldCheck, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULES, MODULE_LABELS, type Module } from "@/lib/permissions";
import {
  creerRolePersonnalise,
  updatePermissionsRolePersonnalise,
  supprimerRolePersonnalise,
  assignerRolePersonnalise,
} from "@/app/dashboard/permissions/actions";

// ============================================================
// Types
// ============================================================
interface PermissionRole {
  module:         string;
  peut_voir:      boolean;
  peut_creer:     boolean;
  peut_modifier:  boolean;
  peut_supprimer: boolean;
}

interface RolePersonnalise {
  id:           string;
  nom:          string;
  description:  string | null;
  couleur:      string;
  permissions:  PermissionRole[];
  utilisateurs: Array<{ id: string; nom: string; prenom: string }>;
}

interface Utilisateur {
  id:                   string;
  nom:                  string;
  prenom:               string;
  role:                 string;
  role_personnalise_id: string | null;
}

interface RolesPersonnalisesManagerProps {
  rolesPersonnalises: RolePersonnalise[];
  utilisateurs:       Utilisateur[];
  hospitalId:         string;
  adminId:            string;
  adminNom:           string;
}

// ============================================================
// Actions disponibles
// ============================================================
const ACTIONS = [
  { key: "peut_voir",      label: "Voir" },
  { key: "peut_creer",     label: "Créer" },
  { key: "peut_modifier",  label: "Modifier" },
  { key: "peut_supprimer", label: "Supprimer" },
] as const;

type ActionKey = typeof ACTIONS[number]["key"];

// ============================================================
// Couleurs prédéfinies
// ============================================================
const COULEURS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#0ea5e9", "#3b82f6", "#64748b", "#78716c",
];

// ============================================================
// Permissions vides par défaut
// ============================================================
function permissionsVides(): PermissionRole[] {
  return MODULES.map((module) => ({
    module,
    peut_voir:      false,
    peut_creer:     false,
    peut_modifier:  false,
    peut_supprimer: false,
  }));
}

// ============================================================
// TableauPermissions — DÉCLARÉ EN DEHORS du composant principal
// Reçoit permsForm et onToggle en props pour éviter
// la recréation du composant à chaque render.
// ============================================================
interface TableauPermissionsProps {
  permsForm: PermissionRole[];
  onToggle:  (module: string, action: ActionKey) => void;
}

function TableauPermissions({ permsForm, onToggle }: TableauPermissionsProps) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* En-tête */}
      <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-200">
        <div className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Module
        </div>
        {ACTIONS.map((a) => (
          <div
            key={a.key}
            className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center"
          >
            {a.label}
          </div>
        ))}
      </div>

      {/* Lignes */}
      {permsForm.map((perm, idx) => (
        <div
          key={perm.module}
          className={cn(
            "grid grid-cols-5 border-b border-gray-100 last:border-0",
            idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
          )}
        >
          <div className="px-3 py-2.5 flex items-center">
            <span className="text-sm font-medium text-gray-800">
              {MODULE_LABELS[perm.module as Module]}
            </span>
          </div>
          {ACTIONS.map((action) => (
            <div
              key={action.key}
              className="px-3 py-2.5 flex items-center justify-center"
            >
              <button
                type="button"
                onClick={() => onToggle(perm.module, action.key)}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all border-2",
                  perm[action.key]
                    ? "bg-blue-700 border-blue-700 text-white"
                    : "bg-white border-gray-300 text-gray-300 hover:border-gray-400"
                )}
              >
                {perm[action.key]
                  ? <Check className="h-3 w-3" />
                  : <X className="h-3 w-3" />
                }
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Composant principal
// ============================================================
export function RolesPersonnalisesManager({
  rolesPersonnalises,
  utilisateurs,
  hospitalId,
  adminId,
  adminNom,
}: RolesPersonnalisesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // État des dialogs
  const [dialogCreer,     setDialogCreer]     = useState(false);
  const [roleEdition,     setRoleEdition]     = useState<RolePersonnalise | null>(null);
  const [roleAssignation, setRoleAssignation] = useState<RolePersonnalise | null>(null);
  const [succes,          setSucces]          = useState(false);
  const [erreur,          setErreur]          = useState<string | null>(null);

  // Formulaire
  const [nom,         setNom]         = useState("");
  const [description, setDescription] = useState("");
  const [couleur,     setCouleur]     = useState(COULEURS[0]);
  const [permsForm,   setPermsForm]   = useState<PermissionRole[]>(permissionsVides());

  function resetForm() {
    setNom("");
    setDescription("");
    setCouleur(COULEURS[0]);
    setPermsForm(permissionsVides());
    setSucces(false);
    setErreur(null);
  }

  // ============================================================
  // Toggle permission
  // ============================================================
  function togglePerm(module: string, action: ActionKey) {
    setPermsForm((prev) =>
      prev.map((p) => {
        if (p.module !== module) return p;
        const nouvelle = { ...p, [action]: !p[action] };

        // Désactiver voir → tout désactiver
        if (action === "peut_voir" && !nouvelle.peut_voir) {
          nouvelle.peut_creer     = false;
          nouvelle.peut_modifier  = false;
          nouvelle.peut_supprimer = false;
        }
        // Activer créer/modifier/supprimer → activer voir
        if (
          (action === "peut_creer" || action === "peut_modifier" || action === "peut_supprimer")
          && nouvelle[action]
        ) {
          nouvelle.peut_voir = true;
        }
        return nouvelle;
      })
    );
  }

  // ============================================================
  // Créer un rôle
  // ============================================================
  function handleCreer() {
    if (!nom.trim()) {
      setErreur("Le nom du rôle est obligatoire");
      return;
    }
    startTransition(async () => {
      try {
        await creerRolePersonnalise(hospitalId, adminId, adminNom, {
          nom,
          description: description || undefined,
          couleur,
          permissions: permsForm,
        });
        setSucces(true);
        router.refresh();
        setTimeout(() => { setDialogCreer(false); resetForm(); }, 1500);
      } catch (error: unknown) {
        setErreur(error instanceof Error ? error.message : "Erreur lors de la création");
      }
    });
  }

  // ============================================================
  // Sauvegarder les modifications
  // ============================================================
  function handleSauvegarder() {
    if (!roleEdition) return;
    startTransition(async () => {
      try {
        await updatePermissionsRolePersonnalise(
          roleEdition.id,
          hospitalId,
          adminId,
          adminNom,
          permsForm
        );
        setSucces(true);
        router.refresh();
        setTimeout(() => { setRoleEdition(null); resetForm(); }, 1500);
      } catch (error: unknown) {
        setErreur(error instanceof Error ? error.message : "Erreur lors de la modification");
      }
    });
  }

  // ============================================================
  // Supprimer un rôle
  // ============================================================
  function handleSupprimer(role: RolePersonnalise) {
    if (!confirm(`Supprimer le rôle "${role.nom}" ?`)) return;
    startTransition(async () => {
      try {
        await supprimerRolePersonnalise(role.id, hospitalId, adminId, adminNom);
        router.refresh();
      } catch (error: unknown) {
        alert(error instanceof Error ? error.message : "Erreur lors de la suppression");
      }
    });
  }

  // ============================================================
  // Ouvrir l'édition
  // ============================================================
  function ouvrirEdition(role: RolePersonnalise) {
    const permsExistantes = MODULES.map((module) => {
      const existante = role.permissions.find((p) => p.module === module);
      return {
        module,
        peut_voir:      existante?.peut_voir      ?? false,
        peut_creer:     existante?.peut_creer     ?? false,
        peut_modifier:  existante?.peut_modifier  ?? false,
        peut_supprimer: existante?.peut_supprimer ?? false,
      };
    });
    setPermsForm(permsExistantes);
    setRoleEdition(role);
    setSucces(false);
    setErreur(null);
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Rôles personnalisés
          </h2>
          <p className="text-sm text-gray-500">
            Créez des rôles métier spécifiques à votre établissement
          </p>
        </div>
        <Button
          type="button"
          onClick={() => { resetForm(); setDialogCreer(true); }}
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rôle
        </Button>
      </div>

      {/* Liste des rôles */}
      {rolesPersonnalises.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
          <ShieldCheck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun rôle personnalisé</p>
          <p className="text-gray-400 text-sm mt-1">
            Créez des rôles pour adapter les accès aux besoins de votre structure
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rolesPersonnalises.map((role) => (
            <Card
              key={role.id}
              className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 space-y-3">

                {/* Header carte */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                    style={{ backgroundColor: role.couleur }}
                  >
                    {role.nom.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {role.nom}
                    </p>
                    {role.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {role.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Badges stats */}
                <div className="flex items-center gap-2 flex-wrap">
                  {role.permissions.filter((p) => p.peut_voir).length > 0 ? (
                    <Badge className="text-[10px] bg-blue-50 text-blue-700 border-0">
                      {role.permissions.filter((p) => p.peut_voir).length} modules accessibles
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] bg-gray-100 text-gray-500 border-0">
                      Aucun accès configuré
                    </Badge>
                  )}
                  <Badge className="text-[10px] bg-gray-100 text-gray-600 border-0 flex items-center gap-1">
                    <Users className="h-2.5 w-2.5" />
                    {role.utilisateurs.length} utilisateur{role.utilisateurs.length > 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Utilisateurs assignés */}
                {role.utilisateurs.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {role.utilisateurs.slice(0, 3).map((u) => (
                      <span
                        key={u.id}
                        className="text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full text-gray-600"
                      >
                        {u.prenom} {u.nom}
                      </span>
                    ))}
                    {role.utilisateurs.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{role.utilisateurs.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-gray-100">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => ouvrirEdition(role)}
                    className="flex-1 text-xs h-8 border-gray-200"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Permissions
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setRoleAssignation(role)}
                    className="flex-1 text-xs h-8 border-gray-200 text-blue-700"
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Assigner
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={role.utilisateurs.length > 0 || isPending}
                    onClick={() => handleSupprimer(role)}
                    className="h-8 w-8 p-0 border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* DIALOG CRÉER UN RÔLE                              */}
      {/* -------------------------------------------------- */}
      <Dialog
        open={dialogCreer}
        onOpenChange={(open) => { if (!open) { setDialogCreer(false); resetForm(); } }}
      >
        <DialogContent className="!max-w-2xl w-full p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">Créer un rôle personnalisé</DialogTitle>

          {succes ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">Rôle créé !</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-base font-semibold text-gray-900">
                  Nouveau rôle personnalisé
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Définissez le nom, l&apos;apparence et les permissions
                </p>
              </div>

              <div className="overflow-y-auto p-6 space-y-5 max-h-[70vh]">
                {erreur && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{erreur}</p>
                  </div>
                )}

                {/* Nom + Description */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nom du rôle <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Ex : Sage-femme, Aide-soignant..."
                      value={nom}
                      onChange={(e) => { setNom(e.target.value); setErreur(null); }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Input
                      placeholder="Description courte..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                {/* Couleur */}
                <div className="space-y-2">
                  <Label>Couleur du rôle</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COULEURS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCouleur(c)}
                        className={cn(
                          "w-8 h-8 rounded-lg transition-all border-2",
                          couleur === c ? "border-gray-900 scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: couleur }}
                    >
                      {nom ? nom.slice(0, 2).toUpperCase() : "??"}
                    </div>
                    <span className="text-sm text-gray-600">
                      {nom || "Nom du rôle"}
                    </span>
                  </div>
                </div>

                {/* Permissions — TableauPermissions reçoit les props */}
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <TableauPermissions
                    permsForm={permsForm}
                    onToggle={togglePerm}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setDialogCreer(false); resetForm(); }}
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
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-1.5" />Créer le rôle</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------- */}
      {/* DIALOG ÉDITER LES PERMISSIONS D'UN RÔLE           */}
      {/* -------------------------------------------------- */}
      <Dialog
        open={!!roleEdition}
        onOpenChange={(open) => { if (!open) { setRoleEdition(null); resetForm(); } }}
      >
        <DialogContent className="!max-w-2xl w-full p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">Modifier les permissions</DialogTitle>

          {succes ? (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">
                Permissions mises à jour !
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: roleEdition?.couleur }}
                >
                  {roleEdition?.nom.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {roleEdition?.nom}
                  </h2>
                  <p className="text-xs text-gray-400">Modifier les permissions</p>
                </div>
              </div>

              <div className="overflow-y-auto p-6 max-h-[65vh]">
                {erreur && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{erreur}</p>
                  </div>
                )}
                {/* TableauPermissions reçoit les props */}
                <TableauPermissions
                  permsForm={permsForm}
                  onToggle={togglePerm}
                />
              </div>

              <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setRoleEdition(null); resetForm(); }}
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
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sauvegarde...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-1.5" />Sauvegarder</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* -------------------------------------------------- */}
      {/* DIALOG ASSIGNER UN RÔLE AUX UTILISATEURS          */}
      {/* -------------------------------------------------- */}
      <Dialog
        open={!!roleAssignation}
        onOpenChange={(open) => { if (!open) setRoleAssignation(null); }}
      >
        <DialogContent className="!max-w-md w-full p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">Assigner le rôle</DialogTitle>

          <div className="flex flex-col">
            <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: roleAssignation?.couleur }}
              >
                {roleAssignation?.nom.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Assigner — {roleAssignation?.nom}
                </h2>
                <p className="text-xs text-gray-400">
                  Cochez les utilisateurs à qui attribuer ce rôle
                </p>
              </div>
            </div>

            <div className="overflow-y-auto p-5 space-y-2 max-h-[60vh]">
              {utilisateurs.map((u) => {
                const aDejaLeRole = u.role_personnalise_id === roleAssignation?.id;
                return (
                  <div
                    key={u.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                      aDejaLeRole
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => {
                      if (!roleAssignation) return;
                      startTransition(async () => {
                        await assignerRolePersonnalise(
                          u.id,
                          aDejaLeRole ? null : roleAssignation.id,
                          hospitalId,
                          adminId,
                          adminNom
                        );
                        router.refresh();
                      });
                    }}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {u.prenom} {u.nom}
                      </p>
                      <p className="text-xs text-gray-400">{u.role}</p>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      aDejaLeRole
                        ? "bg-blue-700 border-blue-700"
                        : "bg-white border-gray-300"
                    )}>
                      {aDejaLeRole && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end px-5 py-4 border-t bg-gray-50">
              <Button
                type="button"
                onClick={() => setRoleAssignation(null)}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}