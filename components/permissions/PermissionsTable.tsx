// ============================================================
// PERMISSIONS TABLE — Interface de configuration Admin
//
// Tableau interactif : chaque cellule est un toggle.
// Sauvegarde automatique à chaque changement (pas de bouton).
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check, X, RotateCcw, Loader2, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updatePermission, reinitialiserPermissions } from "@/app/dashboard/permissions/actions";
import { MODULES, MODULE_LABELS, type Module } from "@/lib/permissions";
import { Role } from "@/app/generated/prisma/client";

// ============================================================
// Rôles configurables (ADMIN et SUPER_ADMIN sont exclus)
// ============================================================
const ROLES_CONFIGURABLES: { value: Role; label: string; couleur: string }[] = [
  { value: "MEDECIN",       label: "Médecin",       couleur: "bg-green-100 text-green-700" },
  { value: "INFIRMIER",     label: "Infirmier(e)",  couleur: "bg-cyan-100 text-cyan-700" },
  { value: "LABORANTIN",    label: "Laborantin",    couleur: "bg-yellow-100 text-yellow-700" },
  { value: "RADIOLOGUE",    label: "Radiologue",    couleur: "bg-violet-100 text-violet-700" },
  { value: "PHARMACIEN",    label: "Pharmacien",    couleur: "bg-pink-100 text-pink-700" },
  { value: "COMPTABLE",     label: "Comptable",     couleur: "bg-orange-100 text-orange-700" },
  { value: "ADMINISTRATIF", label: "Administratif", couleur: "bg-gray-100 text-gray-700" },
];

// Actions disponibles
const ACTIONS = [
  { key: "peut_voir",      label: "Voir",      short: "V" },
  { key: "peut_creer",     label: "Créer",     short: "C" },
  { key: "peut_modifier",  label: "Modifier",  short: "M" },
  { key: "peut_supprimer", label: "Supprimer", short: "S" },
] as const;

type ActionKey = typeof ACTIONS[number]["key"];

interface Permission {
  id:            string;
  role:           Role | null;
  module:        string;
  peut_voir:     boolean;
  peut_creer:    boolean;
  peut_modifier: boolean;
  peut_supprimer: boolean;
}

interface PermissionsTableProps {
  permissions: Permission[];
  hospitalId:  string;
  adminId:     string;
  adminNom:    string;
}

// ============================================================
// Construit un index des permissions pour accès rapide
// ============================================================
function buildIndex(
  permissions: Permission[]
): Record<string, Record<string, boolean>> {
  const index: Record<string, Record<string, boolean>> = {};
  for (const p of permissions) {
    const key = `${p.role}__${p.module}`;
    index[key] = {
      peut_voir:      p.peut_voir,
      peut_creer:     p.peut_creer,
      peut_modifier:  p.peut_modifier,
      peut_supprimer: p.peut_supprimer,
    };
  }
  return index;
}

export function PermissionsTable({
  permissions,
  hospitalId,
  adminId,
  adminNom,
}: PermissionsTableProps) {
  const router = useRouter();
  const [isPending, startTransition]       = useTransition();
  const [isPendingReset, startReset]       = useTransition();
  const [saving, setSaving]               = useState<string | null>(null);
  const [roleActif, setRoleActif]         = useState<Role>("MEDECIN");
  const [index, setIndex]                 = useState(() => buildIndex(permissions));

  // Récupère la valeur d'une permission depuis l'index local
  function getValeur(role: Role, module: string, action: ActionKey): boolean {
    return index[`${role}__${module}`]?.[action] ?? false;
  }

  // ============================================================
  // Toggle une permission — sauvegarde immédiate
  // ============================================================
  function handleToggle(role: Role, module: string, action: ActionKey) {
    const key       = `${role}__${module}`;
    const ancienne  = index[key] ?? {
      peut_voir: false, peut_creer: false,
      peut_modifier: false, peut_supprimer: false,
    };
    const nouvelle  = { ...ancienne, [action]: !ancienne[action] };

    // Règle métier : si on désactive "Voir", tout désactiver
    if (action === "peut_voir" && !nouvelle.peut_voir) {
      nouvelle.peut_creer     = false;
      nouvelle.peut_modifier  = false;
      nouvelle.peut_supprimer = false;
    }

    // Règle métier : si on active créer/modifier/supprimer, activer voir
    if (
      (action === "peut_creer" || action === "peut_modifier" || action === "peut_supprimer")
      && nouvelle[action]
    ) {
      nouvelle.peut_voir = true;
    }

    // Mise à jour optimiste de l'état local
    setIndex((prev) => ({ ...prev, [key]: nouvelle }));

    // Sauvegarde en BDD
    const savingKey = `${role}__${module}__${action}`;
    setSaving(savingKey);

    startTransition(async () => {
      try {
        await updatePermission(hospitalId, adminId, adminNom, {
          role,
          module,
          peut_voir:      nouvelle.peut_voir,
          peut_creer:     nouvelle.peut_creer,
          peut_modifier:  nouvelle.peut_modifier,
          peut_supprimer: nouvelle.peut_supprimer,
        });
      } catch (error) {
        // Rollback en cas d'erreur
        setIndex((prev) => ({ ...prev, [key]: ancienne }));
        console.error(error);
      } finally {
        setSaving(null);
      }
    });
  }

  // ============================================================
  // Réinitialisation aux valeurs par défaut
  // ============================================================
  function handleReset() {
    if (!confirm("Réinitialiser toutes les permissions aux valeurs par défaut ?")) return;

    startReset(async () => {
      await reinitialiserPermissions(hospitalId, adminId, adminNom);
      router.refresh();
    });
  }

  const roleConfig = ROLES_CONFIGURABLES.find((r) => r.value === roleActif);

  return (
    <div className="space-y-5">

      {/* -------------------------------------------------- */}
      {/* SÉLECTEUR DE RÔLE                                 */}
      {/* -------------------------------------------------- */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Sélectionner un rôle à configurer
        </p>
        <div className="flex flex-wrap gap-2">
          {ROLES_CONFIGURABLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRoleActif(r.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                roleActif === r.value
                  ? `${r.couleur} border-current`
                  : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* HEADER + BOUTON RESET                             */}
      {/* -------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={cn("text-sm border-0 px-3 py-1", roleConfig?.couleur)}>
            {roleConfig?.label}
          </Badge>
          <p className="text-sm text-gray-500">
            Cochez les permissions accordées à ce rôle
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPendingReset}
          onClick={handleReset}
          className="text-gray-500 border-gray-200 text-xs"
        >
          {isPendingReset ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          )}
          Réinitialiser
        </Button>
      </div>

      {/* -------------------------------------------------- */}
      {/* TABLEAU DES PERMISSIONS                           */}
      {/* -------------------------------------------------- */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        {/* En-tête colonnes */}
        <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-200">
          <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Module
          </div>
          {ACTIONS.map((action) => (
            <div
              key={action.key}
              className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center"
            >
              {action.label}
            </div>
          ))}
        </div>

        {/* Lignes par module */}
        {MODULES.map((module, idx) => (
          <div
            key={module}
            className={cn(
              "grid grid-cols-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors",
              idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
            )}
          >
            {/* Nom du module */}
            <div className="px-4 py-3.5 flex items-center">
              <span className="text-sm font-medium text-gray-800">
                {MODULE_LABELS[module as Module]}
              </span>
            </div>

            {/* Toggles pour chaque action */}
            {ACTIONS.map((action) => {
              const valeur     = getValeur(roleActif, module, action.key);
              const savingKey  = `${roleActif}__${module}__${action.key}`;
              const enSauvegarde = saving === savingKey;

              return (
                <div
                  key={action.key}
                  className="px-4 py-3.5 flex items-center justify-center"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(roleActif, module, action.key)}
                    disabled={enSauvegarde || isPending}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2",
                      valeur
                        ? "bg-blue-700 border-blue-700 text-white hover:bg-blue-800"
                        : "bg-white border-gray-300 text-gray-300 hover:border-gray-400",
                      (enSauvegarde || isPending) && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    {enSauvegarde ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : valeur ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-700 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
          <span>Autorisé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center">
            <X className="h-3 w-3 text-gray-300" />
          </div>
          <span>Refusé</span>
        </div>
        <p className="ml-4 text-gray-400">
          Les modifications sont sauvegardées automatiquement.
        </p>
      </div>
    </div>
  );
}