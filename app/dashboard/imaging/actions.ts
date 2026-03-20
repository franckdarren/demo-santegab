// ============================================================
// ACTIONS IMAGERIE — Identique au labo avec types spécifiques
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { TypeExamenImagerie, StatutExamen } from "@/app/generated/prisma/client";

export async function getExamensImagerie(
  hospitalId: string,
  search?: string
) {
  return prisma.examenImagerie.findMany({
    where: {
      hospital_id: hospitalId,
      ...(search && {
        OR: [
          {
            patient: {
              OR: [
                { nom: { contains: search, mode: "insensitive" } },
                { prenom: { contains: search, mode: "insensitive" } },
              ],
            },
          },
          { zone_anatomique: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      patient: true,
      medecin: true,
    },
    orderBy: [
      { urgence: "desc" },
      { created_at: "desc" },
    ],
  });
}

export async function creerExamenImagerie(
  hospitalId: string,
  data: {
    patient_id: string;
    medecin_id: string;
    type_examen: TypeExamenImagerie;
    zone_anatomique?: string;
    notes?: string;
    urgence?: boolean;
  }
) {
  return prisma.examenImagerie.create({
    data: {
      hospital_id: hospitalId,
      patient_id: data.patient_id,
      medecin_id: data.medecin_id,
      type_examen: data.type_examen,
      zone_anatomique: data.zone_anatomique ?? null,
      notes: data.notes ?? null,
      urgence: data.urgence ?? false,
      statut: "EN_ATTENTE",
    },
    include: { patient: true, medecin: true },
  });
}

export async function saisirResultatsImagerie(
  examenId: string,
  hospitalId: string,
  data: {
    resultats: string;
    zone_anatomique?: string;
    statut?: StatutExamen;
  }
) {
  return prisma.examenImagerie.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      resultats: data.resultats,
      zone_anatomique: data.zone_anatomique ?? undefined,
      statut: data.statut ?? "RESULTAT_SAISI",
    },
  });
}

export async function uploadResultatImagerie(
  examenId: string,
  hospitalId: string,
  formData: FormData
) {
  const file = formData.get("fichier") as File;
  if (!file) throw new Error("Aucun fichier fourni");

  const supabase = await createClient();
  const cheminFichier = `imagerie/${hospitalId}/${examenId}/${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from("resultats-examens")
    .upload(cheminFichier, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) throw new Error(`Upload échoué : ${error.message}`);

  const { data: signedUrl } = await supabase.storage
    .from("resultats-examens")
    .createSignedUrl(cheminFichier, 365 * 24 * 60 * 60);

  await prisma.examenImagerie.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      fichier_url: signedUrl?.signedUrl ?? null,
      fichier_nom: file.name,
      statut: "RESULTAT_SAISI",
    },
  });

  return signedUrl?.signedUrl;
}

export async function validerExamenImagerie(
  examenId: string,
  hospitalId: string,
  validateurId: string
) {
  return prisma.examenImagerie.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      statut: "VALIDE",
      valide_par: validateurId,
      valide_le: new Date(),
    },
  });
}

export async function getStatsImagerie(hospitalId: string) {
  const [enAttente, enCours, valides, urgents] = await Promise.all([
    prisma.examenImagerie.count({
      where: { hospital_id: hospitalId, statut: "EN_ATTENTE" },
    }),
    prisma.examenImagerie.count({
      where: { hospital_id: hospitalId, statut: "EN_COURS" },
    }),
    prisma.examenImagerie.count({
      where: { hospital_id: hospitalId, statut: "VALIDE" },
    }),
    prisma.examenImagerie.count({
      where: {
        hospital_id: hospitalId,
        urgence: true,
        statut: { not: "VALIDE" },
      },
    }),
  ]);

  return { enAttente, enCours, valides, urgents };
}