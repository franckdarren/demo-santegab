"use server";

import { prisma } from "@/lib/prisma";
import { enregistrerAudit } from "@/lib/audit";

export interface CatalogueItem {
  id: string;
  famille: string;
  nom: string;
  description: string | null;
  prix: number;
  actif: boolean;
  ordre: number;
  created_at: Date;
}

// Récupère tout le catalogue (actif + inactif) — pour la page CRUD
export async function getCatalogue(hospitalId: string): Promise<CatalogueItem[]> {
  return prisma.examenCatalogue.findMany({
    where: { hospital_id: hospitalId },
    orderBy: [{ famille: "asc" }, { ordre: "asc" }, { nom: "asc" }],
  });
}

// Récupère uniquement les examens actifs — pour le dialog de demande
export async function getCatalogueActif(hospitalId: string): Promise<CatalogueItem[]> {
  return prisma.examenCatalogue.findMany({
    where: { hospital_id: hospitalId, actif: true },
    orderBy: [{ famille: "asc" }, { ordre: "asc" }, { nom: "asc" }],
  });
}

export async function creerExamenCatalogue(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    famille: string;
    nom: string;
    description?: string;
    prix: number;
    actif: boolean;
    ordre: number;
  }
) {
  const examen = await prisma.examenCatalogue.create({
    data: {
      hospital_id: hospitalId,
      famille:     data.famille.trim(),
      nom:         data.nom.trim(),
      description: data.description?.trim() || null,
      prix:        data.prix,
      actif:       data.actif,
      ordre:       data.ordre,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "LABORATOIRE",
    description: `Ajout catalogue — ${data.famille} — ${data.nom}`,
    entiteId:    examen.id,
    entiteNom:   examen.nom,
    metadonnees: { famille: data.famille, prix: data.prix },
  });

  return examen;
}

export async function modifierExamenCatalogue(
  id: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    famille: string;
    nom: string;
    description?: string;
    prix: number;
    actif: boolean;
    ordre: number;
  }
) {
  const examen = await prisma.examenCatalogue.update({
    where: { id, hospital_id: hospitalId },
    data: {
      famille:     data.famille.trim(),
      nom:         data.nom.trim(),
      description: data.description?.trim() || null,
      prix:        data.prix,
      actif:       data.actif,
      ordre:       data.ordre,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "LABORATOIRE",
    description: `Modification catalogue — ${examen.famille} — ${examen.nom}`,
    entiteId:    examen.id,
    entiteNom:   examen.nom,
    metadonnees: { famille: examen.famille, prix: examen.prix },
  });

  return examen;
}

export async function supprimerExamenCatalogue(
  id: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  const examen = await prisma.examenCatalogue.findFirst({
    where: { id, hospital_id: hospitalId },
  });
  if (!examen) throw new Error("Examen non trouvé");

  await prisma.examenCatalogue.delete({
    where: { id, hospital_id: hospitalId },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "SUPPRESSION",
    module:      "LABORATOIRE",
    description: `Suppression catalogue — ${examen.famille} — ${examen.nom}`,
    entiteId:    examen.id,
    entiteNom:   examen.nom,
    metadonnees: {},
  });
}

export async function toggleActifExamenCatalogue(
  id: string,
  hospitalId: string,
  actif: boolean,
  utilisateurId: string,
  utilisateurNom: string
) {
  const examen = await prisma.examenCatalogue.update({
    where: { id, hospital_id: hospitalId },
    data: { actif },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "LABORATOIRE",
    description: `${actif ? "Activation" : "Désactivation"} catalogue — ${examen.nom}`,
    entiteId:    examen.id,
    entiteNom:   examen.nom,
    metadonnees: { actif },
  });

  return examen;
}
