"use server";

import { prisma } from "@/lib/prisma";
import { TypeAction, ModuleAction } from "@/app/generated/prisma/client";
import { startOfDay, endOfDay, subDays } from "date-fns";

// ============================================================
// Récupère les logs d'audit avec filtres
// ============================================================
export async function getAuditLogs(
  hospitalId: string,
  filters: {
    utilisateurId?: string;
    typeAction?: TypeAction;
    module?: ModuleAction;
    dateDebut?: string;
    dateFin?: string;
    search?: string;
  } = {}
) {
  const where: Record<string, unknown> = {
    hospital_id: hospitalId,
  };

  if (filters.utilisateurId) {
    where.utilisateur_id = filters.utilisateurId;
  }
  if (filters.typeAction) {
    where.type_action = filters.typeAction;
  }
  if (filters.module) {
    where.module = filters.module;
  }
  if (filters.dateDebut || filters.dateFin) {
    where.created_at = {
      ...(filters.dateDebut && {
        gte: startOfDay(new Date(filters.dateDebut)),
      }),
      ...(filters.dateFin && {
        lte: endOfDay(new Date(filters.dateFin)),
      }),
    };
  }
  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: "insensitive" } },
      { utilisateur_nom: { contains: filters.search, mode: "insensitive" } },
      { entite_nom: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.auditTrail.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: 200,
  });
}

// ============================================================
// Stats audit pour le header
// ============================================================
export async function getStatsAudit(hospitalId: string) {
  const aujourd_hui = new Date();
  const hier = subDays(aujourd_hui, 1);

  const [
    totalAujourdhui,
    connexionsAujourdhui,
    actionsCarnet,
    utilisateursActifs,
  ] = await Promise.all([
    prisma.auditTrail.count({
      where: {
        hospital_id: hospitalId,
        created_at: { gte: startOfDay(aujourd_hui) },
      },
    }),
    prisma.auditTrail.count({
      where: {
        hospital_id: hospitalId,
        type_action: "CONNEXION",
        created_at: { gte: startOfDay(aujourd_hui) },
      },
    }),
    prisma.auditTrail.count({
      where: {
        hospital_id: hospitalId,
        module: "CARNET_SANTE",
        created_at: { gte: startOfDay(hier) },
      },
    }),
    prisma.auditTrail.groupBy({
      by: ["utilisateur_id"],
      where: {
        hospital_id: hospitalId,
        created_at: { gte: startOfDay(aujourd_hui) },
        utilisateur_id: { not: null },
      },
    }),
  ]);

  return {
    totalAujourdhui,
    connexionsAujourdhui,
    actionsCarnet,
    utilisateursActifsAujourdhui: utilisateursActifs.length,
  };
}

// ============================================================
// Liste des utilisateurs pour le filtre
// ============================================================
export async function getUtilisateursPourFiltre(hospitalId: string) {
  return prisma.utilisateur.findMany({
    where: { hospital_id: hospitalId },
    select: { id: true, nom: true, prenom: true, role: true },
    orderBy: { nom: "asc" },
  });
}