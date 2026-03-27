"use server";

import { prisma } from "@/lib/prisma";
import { enregistrerAudit } from "@/lib/audit";
import { initialiserPermissionsDefaut } from "@/lib/permissions.server";
import { Role } from "@/app/generated/prisma/client";

// ============================================================
// Récupère toutes les permissions d'un hôpital
// ============================================================
export async function getPermissionsHospital(hospitalId: string) {
  return prisma.permission.findMany({
    where:   { hospital_id: hospitalId },
    orderBy: [{ role: "asc" }, { module: "asc" }],
  });
}

// ============================================================
// Récupère tous les rôles personnalisés de l'hôpital
// ============================================================
export async function getRolesPersonnalises(hospitalId: string) {
  return prisma.rolePersonnalise.findMany({
    where:   { hospital_id: hospitalId, est_actif: true },
    include: {
      permissions:  true,
      utilisateurs: { select: { id: true, nom: true, prenom: true } },
    },
    orderBy: { nom: "asc" },
  });
}

// ============================================================
// Crée un nouveau rôle personnalisé
//
// Les permissions sont créées SÉPARÉMENT après le rôle pour
// contrôler explicitement role = null.
// La création imbriquée ne permettait pas de passer null
// sur un champ qui avait une contrainte NOT NULL en BDD.
// ============================================================
export async function creerRolePersonnalise(
  hospitalId: string,
  adminId: string,
  adminNom: string,
  data: {
    nom:          string;
    description?: string;
    couleur:      string;
    permissions:  Array<{
      module:         string;
      peut_voir:      boolean;
      peut_creer:     boolean;
      peut_modifier:  boolean;
      peut_supprimer: boolean;
    }>;
  }
) {
  const existant = await prisma.rolePersonnalise.findFirst({
    where: { hospital_id: hospitalId, nom: data.nom },
  });
  if (existant) throw new Error(`Le rôle "${data.nom}" existe déjà`);

  // 1. Crée le rôle sans permissions imbriquées
  const role = await prisma.rolePersonnalise.create({
    data: {
      hospital_id: hospitalId,
      nom:         data.nom,
      description: data.description ?? null,
      couleur:     data.couleur,
    },
  });

  // 2. Crée les permissions séparément avec role = null explicite
  //    Un rôle personnalisé n'a pas de rôle système associé.
  await Promise.all(
    data.permissions.map((p) =>
      prisma.permission.create({
        data: {
          hospital_id:          hospitalId,
          role:                 null,    // ← null explicite — pas un rôle système
          role_personnalise_id: role.id, // ← lié au rôle personnalisé
          module:               p.module,
          peut_voir:            p.peut_voir,
          peut_creer:           p.peut_creer,
          peut_modifier:        p.peut_modifier,
          peut_supprimer:       p.peut_supprimer,
        },
      })
    )
  );

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "CREATION",
    module:         "UTILISATEUR",
    description:    `Rôle personnalisé créé — ${data.nom}`,
    entiteId:       role.id,
    entiteNom:      data.nom,
    metadonnees: {
      nom:            data.nom,
      nb_permissions: data.permissions.length,
    },
  });

  return role;
}

// ============================================================
// Modifie les permissions d'un rôle personnalisé
// ============================================================
export async function updatePermissionsRolePersonnalise(
  roleId: string,
  hospitalId: string,
  adminId: string,
  adminNom: string,
  permissions: Array<{
    module:         string;
    peut_voir:      boolean;
    peut_creer:     boolean;
    peut_modifier:  boolean;
    peut_supprimer: boolean;
  }>
) {
  const role = await prisma.rolePersonnalise.findFirst({
    where: { id: roleId, hospital_id: hospitalId },
  });
  if (!role) throw new Error("Rôle introuvable");

  await Promise.all(
    permissions.map((p) =>
      prisma.permission.upsert({
        where: {
          hospital_id_role_personnalise_id_module: {
            hospital_id:          hospitalId,
            role_personnalise_id: roleId,
            module:               p.module,
          },
        },
        update: {
          peut_voir:      p.peut_voir,
          peut_creer:     p.peut_creer,
          peut_modifier:  p.peut_modifier,
          peut_supprimer: p.peut_supprimer,
        },
        create: {
          hospital_id:          hospitalId,
          role:                 null,    // ← null explicite
          role_personnalise_id: roleId,
          module:               p.module,
          peut_voir:            p.peut_voir,
          peut_creer:           p.peut_creer,
          peut_modifier:        p.peut_modifier,
          peut_supprimer:       p.peut_supprimer,
        },
      })
    )
  );

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "MODIFICATION",
    module:         "UTILISATEUR",
    description:    `Permissions modifiées — rôle ${role.nom}`,
    entiteId:       roleId,
    entiteNom:      role.nom,
  });
}

// ============================================================
// Met à jour les infos d'un rôle personnalisé
// ============================================================
export async function updateRolePersonnalise(
  roleId: string,
  hospitalId: string,
  adminId: string,
  adminNom: string,
  data: {
    nom?:         string;
    description?: string;
    couleur?:     string;
  }
) {
  const role = await prisma.rolePersonnalise.update({
    where: { id: roleId },
    data: {
      nom:         data.nom         ?? undefined,
      description: data.description ?? undefined,
      couleur:     data.couleur     ?? undefined,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "MODIFICATION",
    module:         "UTILISATEUR",
    description:    `Rôle personnalisé modifié — ${role.nom}`,
    entiteId:       roleId,
    entiteNom:      role.nom,
  });

  return role;
}

// ============================================================
// Supprime un rôle personnalisé (désactivation logique)
//
// On ne supprime pas si des utilisateurs ont ce rôle.
// ============================================================
export async function supprimerRolePersonnalise(
  roleId: string,
  hospitalId: string,
  adminId: string,
  adminNom: string
) {
  const role = await prisma.rolePersonnalise.findFirst({
    where:   { id: roleId, hospital_id: hospitalId },
    include: { utilisateurs: true },
  });
  if (!role) throw new Error("Rôle introuvable");

  if (role.utilisateurs.length > 0) {
    throw new Error(
      `Impossible — ${role.utilisateurs.length} utilisateur(s) ont ce rôle. Réassignez-les d'abord.`
    );
  }

  await prisma.rolePersonnalise.update({
    where: { id: roleId },
    data:  { est_actif: false },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "SUPPRESSION",
    module:         "UTILISATEUR",
    description:    `Rôle personnalisé désactivé — ${role.nom}`,
    entiteId:       roleId,
    entiteNom:      role.nom,
  });
}

// ============================================================
// Assigne un rôle personnalisé à un utilisateur
// ============================================================
export async function assignerRolePersonnalise(
  utilisateurId: string,
  roleId: string | null,
  hospitalId: string,
  adminId: string,
  adminNom: string
) {
  const utilisateur = await prisma.utilisateur.update({
    where:   { id: utilisateurId, hospital_id: hospitalId },
    data:    { role_personnalise_id: roleId },
    include: { role_personnalise: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "MODIFICATION",
    module:         "UTILISATEUR",
    description:    roleId
      ? `Rôle personnalisé assigné — ${utilisateur.prenom} ${utilisateur.nom} → ${utilisateur.role_personnalise?.nom}`
      : `Rôle personnalisé retiré — ${utilisateur.prenom} ${utilisateur.nom}`,
    entiteId:  utilisateurId,
    entiteNom: `${utilisateur.prenom} ${utilisateur.nom}`,
  });

  return utilisateur;
}

// ============================================================
// Met à jour une permission rôle système
// ============================================================
export async function updatePermission(
  hospitalId: string,
  adminId: string,
  adminNom: string,
  data: {
    role:           Role;
    module:         string;
    peut_voir:      boolean;
    peut_creer:     boolean;
    peut_modifier:  boolean;
    peut_supprimer: boolean;
  }
) {
  const permission = await prisma.permission.upsert({
    where: {
      hospital_id_role_module: {
        hospital_id: hospitalId,
        role:        data.role,
        module:      data.module,
      },
    },
    update: {
      peut_voir:      data.peut_voir,
      peut_creer:     data.peut_creer,
      peut_modifier:  data.peut_modifier,
      peut_supprimer: data.peut_supprimer,
    },
    create: {
      hospital_id:    hospitalId,
      role:           data.role,
      module:         data.module,
      peut_voir:      data.peut_voir,
      peut_creer:     data.peut_creer,
      peut_modifier:  data.peut_modifier,
      peut_supprimer: data.peut_supprimer,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "MODIFICATION",
    module:         "UTILISATEUR",
    description:    `Permission modifiée — ${data.role} — ${data.module}`,
    metadonnees: {
      role:           data.role,
      module:         data.module,
      peut_voir:      data.peut_voir,
      peut_creer:     data.peut_creer,
      peut_modifier:  data.peut_modifier,
      peut_supprimer: data.peut_supprimer,
    },
  });

  return permission;
}

// ============================================================
// Réinitialise les permissions aux valeurs par défaut
// ============================================================
export async function reinitialiserPermissions(
  hospitalId: string,
  adminId: string,
  adminNom: string
) {
  await initialiserPermissionsDefaut(hospitalId);

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  adminId,
    utilisateurNom: adminNom,
    typeAction:     "MODIFICATION",
    module:         "UTILISATEUR",
    description:    "Réinitialisation permissions aux valeurs par défaut",
  });
}