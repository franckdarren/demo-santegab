// ============================================================
// ACTIONS SERVICES
// Gestion des services médicaux par l'Admin
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { enregistrerAudit } from "@/lib/audit";

// ============================================================
// Liste des services actifs de l'hôpital
// ============================================================
export async function getServices(hospitalId: string) {
  return prisma.service.findMany({
    where:   { hospital_id: hospitalId },
    include: { _count: { select: { consultations: true } } },
    orderBy: { nom: "asc" },
  });
}

// ============================================================
// Créer un service
// ============================================================
export async function creerService(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    nom:         string;
    description?: string;
    couleur?:     string;
  }
) {
  const service = await prisma.service.create({
    data: {
      hospital_id: hospitalId,
      nom:         data.nom.trim(),
      description: data.description ?? null,
      couleur:     data.couleur ?? "#3b82f6",
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "CONSULTATION",
    description: `Création du service — ${service.nom}`,
    entiteId:    service.id,
    entiteNom:   service.nom,
    metadonnees: { couleur: service.couleur },
  });

  return service;
}

// ============================================================
// Modifier un service
// ============================================================
export async function modifierService(
  serviceId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    nom:         string;
    description?: string;
    couleur?:     string;
    est_actif?:   boolean;
  }
) {
  const service = await prisma.service.update({
    where: { id: serviceId, hospital_id: hospitalId },
    data: {
      nom:         data.nom.trim(),
      description: data.description ?? null,
      couleur:     data.couleur ?? "#3b82f6",
      est_actif:   data.est_actif ?? true,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "CONSULTATION",
    description: `Modification du service — ${service.nom}`,
    entiteId:    service.id,
    entiteNom:   service.nom,
    metadonnees: { est_actif: service.est_actif },
  });

  return service;
}

// ============================================================
// Supprimer un service (uniquement si aucune consultation liée)
// ============================================================
export async function supprimerService(
  serviceId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  // Vérifie qu'aucune consultation n'utilise ce service
  const nbConsultations = await prisma.consultation.count({
    where: { service_id: serviceId, hospital_id: hospitalId },
  });

  if (nbConsultations > 0) {
    throw new Error(
      `Impossible de supprimer : ${nbConsultations} consultation(s) utilisent ce service.`
    );
  }

  const service = await prisma.service.delete({
    where: { id: serviceId, hospital_id: hospitalId },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "SUPPRESSION",
    module:      "CONSULTATION",
    description: `Suppression du service — ${service.nom}`,
    entiteId:    service.id,
    entiteNom:   service.nom,
    metadonnees: {},
  });

  return service;
}
