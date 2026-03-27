// ============================================================
// LIB PERMISSIONS SERVEUR — Fonctions avec accès BDD
//
// ⚠️  CE FICHIER NE DOIT JAMAIS ÊTRE IMPORTÉ DANS UN
//     COMPOSANT CLIENT ("use client").
//     Il utilise Prisma qui dépend de modules Node.js (pg/dns).
// ============================================================

import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import {
  MODULES,
  ROLES_ADMIN,
  type Module,
  type PermissionModule,
} from "@/lib/permissions";

// ============================================================
// Récupère les permissions d'un rôle système
// ============================================================
export async function getPermissionsUtilisateur(
  hospitalId: string,
  role: Role
): Promise<Record<string, PermissionModule>> {
  // ADMIN et SUPER_ADMIN ont tous les droits
  if (ROLES_ADMIN.includes(role)) {
    return MODULES.reduce((acc, module) => {
      acc[module] = {
        peut_voir:      true,
        peut_creer:     true,
        peut_modifier:  true,
        peut_supprimer: true,
      };
      return acc;
    }, {} as Record<string, PermissionModule>);
  }

  const permissions = await prisma.permission.findMany({
    where: { hospital_id: hospitalId, role },
  });

  return MODULES.reduce((acc, module) => {
    const perm = permissions.find((p) => p.module === module);
    acc[module] = {
      peut_voir:      perm?.peut_voir      ?? false,
      peut_creer:     perm?.peut_creer     ?? false,
      peut_modifier:  perm?.peut_modifier  ?? false,
      peut_supprimer: perm?.peut_supprimer ?? false,
    };
    return acc;
  }, {} as Record<string, PermissionModule>);
}

// ============================================================
// Résout les permissions effectives d'un utilisateur
//
// Priorité :
//   1. ADMIN/SUPER_ADMIN → tout à true
//   2. Rôle personnalisé → permissions du rôle perso
//   3. Rôle système → permissions configurées en BDD
// ============================================================
export async function getPermissionsEffectives(
  hospitalId: string,
  role: Role,
  rolePersonnaliseId?: string | null
): Promise<Record<string, PermissionModule>> {
  // ADMIN/SUPER_ADMIN → bypass total
  if (ROLES_ADMIN.includes(role)) {
    return MODULES.reduce((acc, module) => {
      acc[module] = {
        peut_voir:      true,
        peut_creer:     true,
        peut_modifier:  true,
        peut_supprimer: true,
      };
      return acc;
    }, {} as Record<string, PermissionModule>);
  }

  // Rôle personnalisé → utilise ses permissions
  if (rolePersonnaliseId) {
    const permissions = await prisma.permission.findMany({
      where: {
        hospital_id:          hospitalId,
        role_personnalise_id: rolePersonnaliseId,
      },
    });

    return MODULES.reduce((acc, module) => {
      const perm = permissions.find((p) => p.module === module);
      acc[module] = {
        peut_voir:      perm?.peut_voir      ?? false,
        peut_creer:     perm?.peut_creer     ?? false,
        peut_modifier:  perm?.peut_modifier  ?? false,
        peut_supprimer: perm?.peut_supprimer ?? false,
      };
      return acc;
    }, {} as Record<string, PermissionModule>);
  }

  // Rôle système → permissions configurées
  return getPermissionsUtilisateur(hospitalId, role);
}

// ============================================================
// Vérifie une permission spécifique
// ============================================================
export async function peutFaire(
  hospitalId: string,
  role: Role,
  module: Module,
  action: keyof PermissionModule,
  rolePersonnaliseId?: string | null
): Promise<boolean> {
  if (ROLES_ADMIN.includes(role)) return true;

  // Rôle personnalisé
  if (rolePersonnaliseId) {
    const permission = await prisma.permission.findFirst({
      where: {
        hospital_id:          hospitalId,
        role_personnalise_id: rolePersonnaliseId,
        module,
      },
    });
    if (!permission) return false;
    return permission[action];
  }

  // Rôle système
  const permission = await prisma.permission.findUnique({
    where: {
      hospital_id_role_module: {
        hospital_id: hospitalId,
        role,
        module,
      },
    },
  });

  if (!permission) return false;
  return permission[action];
}

// ============================================================
// Initialise les permissions par défaut pour un hôpital
// ============================================================
export async function initialiserPermissionsDefaut(
  hospitalId: string
): Promise<void> {
  const permissionsDefaut: Array<{
    role:           Role;
    module:         string;
    peut_voir:      boolean;
    peut_creer:     boolean;
    peut_modifier:  boolean;
    peut_supprimer: boolean;
  }> = [
    // MÉDECIN
    { role: "MEDECIN", module: "PATIENT",         peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
    { role: "MEDECIN", module: "CONSULTATION",    peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
    { role: "MEDECIN", module: "LABORATOIRE",     peut_voir: true,  peut_creer: true,  peut_modifier: false, peut_supprimer: false },
    { role: "MEDECIN", module: "IMAGERIE",        peut_voir: true,  peut_creer: true,  peut_modifier: false, peut_supprimer: false },
    { role: "MEDECIN", module: "HOSPITALISATION", peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
    { role: "MEDECIN", module: "PHARMACIE",       peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "MEDECIN", module: "FACTURATION",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "MEDECIN", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "MEDECIN", module: "STATISTIQUES",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "MEDECIN", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "MEDECIN", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    // INFIRMIER
    { role: "INFIRMIER", module: "PATIENT",         peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "INFIRMIER", module: "CONSULTATION",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "INFIRMIER", module: "LABORATOIRE",     peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "INFIRMIER", module: "IMAGERIE",        peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "INFIRMIER", module: "HOSPITALISATION", peut_voir: true,  peut_creer: false, peut_modifier: true,  peut_supprimer: false },
    { role: "INFIRMIER", module: "PHARMACIE",       peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "INFIRMIER", module: "FACTURATION",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "INFIRMIER", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "INFIRMIER", module: "STATISTIQUES",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "INFIRMIER", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "INFIRMIER", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    // LABORANTIN
    { role: "LABORANTIN", module: "PATIENT",         peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "LABORANTIN", module: "CONSULTATION",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "LABORANTIN", module: "LABORATOIRE",     peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
    { role: "LABORANTIN", module: "IMAGERIE",        peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "LABORANTIN", module: "HOSPITALISATION", peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "LABORANTIN", module: "PHARMACIE",       peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "LABORANTIN", module: "FACTURATION",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "LABORANTIN", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "LABORANTIN", module: "STATISTIQUES",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "LABORANTIN", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "LABORANTIN", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    // RADIOLOGUE
    { role: "RADIOLOGUE", module: "PATIENT",         peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "RADIOLOGUE", module: "CONSULTATION",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "RADIOLOGUE", module: "LABORATOIRE",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "RADIOLOGUE", module: "IMAGERIE",        peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
    { role: "RADIOLOGUE", module: "HOSPITALISATION", peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "RADIOLOGUE", module: "PHARMACIE",       peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "RADIOLOGUE", module: "FACTURATION",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "RADIOLOGUE", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "RADIOLOGUE", module: "STATISTIQUES",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "RADIOLOGUE", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "RADIOLOGUE", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    // PHARMACIEN
    { role: "PHARMACIEN", module: "PATIENT",         peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "PHARMACIEN", module: "CONSULTATION",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "PHARMACIEN", module: "LABORATOIRE",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "PHARMACIEN", module: "IMAGERIE",        peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "PHARMACIEN", module: "HOSPITALISATION", peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "PHARMACIEN", module: "PHARMACIE",       peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: true  },
    { role: "PHARMACIEN", module: "FACTURATION",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "PHARMACIEN", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "PHARMACIEN", module: "STATISTIQUES",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "PHARMACIEN", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "PHARMACIEN", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    // COMPTABLE
    { role: "COMPTABLE", module: "PATIENT",         peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "COMPTABLE", module: "CONSULTATION",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "COMPTABLE", module: "LABORATOIRE",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "COMPTABLE", module: "IMAGERIE",        peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "COMPTABLE", module: "HOSPITALISATION", peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "COMPTABLE", module: "PHARMACIE",       peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "COMPTABLE", module: "FACTURATION",     peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
    { role: "COMPTABLE", module: "COMPTABILITE",    peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
    { role: "COMPTABLE", module: "STATISTIQUES",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "COMPTABLE", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "COMPTABLE", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    // ADMINISTRATIF
    { role: "ADMINISTRATIF", module: "PATIENT",         peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
    { role: "ADMINISTRATIF", module: "CONSULTATION",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "ADMINISTRATIF", module: "LABORATOIRE",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "ADMINISTRATIF", module: "IMAGERIE",        peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "ADMINISTRATIF", module: "HOSPITALISATION", peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "ADMINISTRATIF", module: "PHARMACIE",       peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "ADMINISTRATIF", module: "FACTURATION",     peut_voir: true,  peut_creer: true,  peut_modifier: false, peut_supprimer: false },
    { role: "ADMINISTRATIF", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "ADMINISTRATIF", module: "STATISTIQUES",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "ADMINISTRATIF", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
    { role: "ADMINISTRATIF", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  ];

  await Promise.all(
    permissionsDefaut.map((p) =>
      prisma.permission.upsert({
        where: {
          hospital_id_role_module: {
            hospital_id: hospitalId,
            role:        p.role,
            module:      p.module,
          },
        },
        update: {
          peut_voir:      p.peut_voir,
          peut_creer:     p.peut_creer,
          peut_modifier:  p.peut_modifier,
          peut_supprimer: p.peut_supprimer,
        },
        create: {
          hospital_id:    hospitalId,
          role:           p.role,
          module:         p.module,
          peut_voir:      p.peut_voir,
          peut_creer:     p.peut_creer,
          peut_modifier:  p.peut_modifier,
          peut_supprimer: p.peut_supprimer,
        },
      })
    )
  );
}