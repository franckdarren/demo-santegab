// ============================================================
// ACTIONS CHAMBRES
// Gestion des chambres et tarifs par établissement
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { enregistrerAudit } from "@/lib/audit";

export async function getChambres(
  hospitalId: string,
  disponibleSeulement?: boolean
) {
  return prisma.chambre.findMany({
    where: {
      hospital_id: hospitalId,
      ...(disponibleSeulement && { est_disponible: true }),
    },
    include: {
      hospitalisations: {
        where:   { statut: "EN_COURS" },
        include: { patient: true },
        take:    1,
      },
    },
    orderBy: { numero: "asc" },
  });
}

export async function creerChambre(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    numero:          string;
    type_chambre:    string;
    prix_journalier: number;
    description?:    string;
  }
) {
  const chambre = await prisma.chambre.create({
    data: {
      hospital_id:     hospitalId,
      numero:          data.numero,
      type_chambre:    data.type_chambre,
      prix_journalier: data.prix_journalier,
      description:     data.description ?? null,
      est_disponible:  true,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "HOSPITALISATION",
    description: `Chambre créée — N°${data.numero} (${data.type_chambre}) — ${data.prix_journalier.toLocaleString("fr-FR")} XAF/jour`,
    entiteId:    chambre.id,
    entiteNom:   `Chambre ${data.numero}`,
    metadonnees: {
      type_chambre:    data.type_chambre,
      prix_journalier: data.prix_journalier,
    },
  });

  return chambre;
}

export async function modifierChambre(
  chambreId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    numero?:          string;
    type_chambre?:    string;
    prix_journalier?: number;
    description?:     string;
  }
) {
  const chambre = await prisma.chambre.update({
    where: { id: chambreId },
    data: {
      numero:          data.numero          ?? undefined,
      type_chambre:    data.type_chambre    ?? undefined,
      prix_journalier: data.prix_journalier ?? undefined,
      description:     data.description    ?? undefined,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "HOSPITALISATION",
    description: `Chambre modifiée — N°${chambre.numero}`,
    entiteId:    chambreId,
    entiteNom:   `Chambre ${chambre.numero}`,
  });

  return chambre;
}

export async function supprimerChambre(
  chambreId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  // Vérifie qu'aucun patient n'est actuellement dans la chambre
  const hospitalisationEnCours = await prisma.hospitalisation.findFirst({
    where: { chambre_id: chambreId, statut: "EN_COURS" },
  });

  if (hospitalisationEnCours) {
    throw new Error("Impossible de supprimer — un patient est actuellement dans cette chambre");
  }

  const chambre = await prisma.chambre.delete({
    where: { id: chambreId },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "SUPPRESSION",
    module:      "HOSPITALISATION",
    description: `Chambre supprimée — N°${chambre.numero}`,
    entiteId:    chambreId,
    entiteNom:   `Chambre ${chambre.numero}`,
  });

  return chambre;
}