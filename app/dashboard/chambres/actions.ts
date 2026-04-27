// ============================================================
// ACTIONS CHAMBRES
// Gestion des chambres et de leurs lits par établissement
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
      lits: {
        orderBy: { nom: "asc" },
      },
      hospitalisations: {
        where:   { statut: "EN_COURS" },
        include: { patient: true, lit: true },
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
    service?:        string;
    type_chambre:    string;
    prix_journalier: number;
    description?:    string;
    noms_lits?:      string[]; // noms des lits à créer (ex: ["Lit A", "Lit B"])
  }
) {
  const chambre = await prisma.chambre.create({
    data: {
      hospital_id:     hospitalId,
      numero:          data.numero,
      service:         data.service      ?? null,
      type_chambre:    data.type_chambre,
      prix_journalier: data.prix_journalier,
      description:     data.description ?? null,
      est_disponible:  true,
    },
  });

  // Crée les lits associés si fournis
  if (data.noms_lits && data.noms_lits.length > 0) {
    await prisma.lit.createMany({
      data: data.noms_lits.map((nom) => ({
        hospital_id:    hospitalId,
        chambre_id:     chambre.id,
        nom,
        est_disponible: true,
      })),
    });
  }

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "HOSPITALISATION",
    description: `Chambre créée — N°${data.numero} (${data.type_chambre}) — ${data.prix_journalier.toLocaleString("fr-FR")} XAF/jour${data.noms_lits?.length ? ` — ${data.noms_lits.length} lit(s)` : ""}`,
    entiteId:    chambre.id,
    entiteNom:   `Chambre ${data.numero}`,
    metadonnees: {
      type_chambre:    data.type_chambre,
      prix_journalier: data.prix_journalier,
      service:         data.service,
      nb_lits:         data.noms_lits?.length ?? 0,
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
    service?:         string | null;
    type_chambre?:    string;
    prix_journalier?: number;
    description?:     string | null;
  }
) {
  const chambre = await prisma.chambre.update({
    where: { id: chambreId },
    data: {
      numero:          data.numero          ?? undefined,
      service:         data.service         !== undefined ? data.service         : undefined,
      type_chambre:    data.type_chambre    ?? undefined,
      prix_journalier: data.prix_journalier ?? undefined,
      description:     data.description    !== undefined ? data.description     : undefined,
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

  // Les lits sont supprimés en cascade (onDelete: Cascade dans le schéma)
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

// ============================================================
// GESTION DES LITS
// ============================================================

export async function creerLit(
  chambreId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  nom: string
) {
  const chambre = await prisma.chambre.findFirst({
    where: { id: chambreId, hospital_id: hospitalId },
  });
  if (!chambre) throw new Error("Chambre introuvable");

  const lit = await prisma.lit.create({
    data: {
      hospital_id:    hospitalId,
      chambre_id:     chambreId,
      nom,
      est_disponible: true,
    },
  });

  // La chambre a maintenant au moins un lit libre
  await prisma.chambre.update({
    where: { id: chambreId },
    data:  { est_disponible: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "HOSPITALISATION",
    description: `Lit ajouté — ${nom} — Chambre ${chambre.numero}`,
    entiteId:    lit.id,
    entiteNom:   `${nom} (Chambre ${chambre.numero})`,
  });

  return lit;
}

export async function supprimerLit(
  litId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  const lit = await prisma.lit.findFirst({
    where:   { id: litId, hospital_id: hospitalId },
    include: { chambre: true },
  });
  if (!lit) throw new Error("Lit introuvable");

  // Vérifie qu'aucun patient n'est sur ce lit
  const hospitalisationEnCours = await prisma.hospitalisation.findFirst({
    where: { lit_id: litId, statut: "EN_COURS" },
  });
  if (hospitalisationEnCours) {
    throw new Error("Impossible de supprimer — un patient occupe ce lit");
  }

  await prisma.lit.delete({ where: { id: litId } });

  // Recalcule la disponibilité de la chambre
  const litsRestants = await prisma.lit.findMany({
    where: { chambre_id: lit.chambre_id },
  });
  const chambreDisponible = litsRestants.length === 0 || litsRestants.some((l) => l.est_disponible);
  await prisma.chambre.update({
    where: { id: lit.chambre_id },
    data:  { est_disponible: chambreDisponible },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "SUPPRESSION",
    module:      "HOSPITALISATION",
    description: `Lit supprimé — ${lit.nom} — Chambre ${lit.chambre.numero}`,
    entiteId:    litId,
    entiteNom:   `${lit.nom} (Chambre ${lit.chambre.numero})`,
  });

  return lit;
}
