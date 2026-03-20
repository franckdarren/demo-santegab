// ============================================================
// ACTIONS LABORATOIRE
// Toutes les requêtes filtrées par hospital_id (multi-tenant)
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { TypeExamenLabo, StatutExamen } from "@/app/generated/prisma/client";

// ============================================================
// Liste des examens labo de l'hôpital
// ============================================================
export async function getExamensLabo(
  hospitalId: string,
  search?: string
) {
  return prisma.examenLabo.findMany({
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
          { notes: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      patient: true,
      medecin: true,
    },
    orderBy: [
      { urgence: "desc" },       // Urgents en premier
      { created_at: "desc" },
    ],
  });
}

// ============================================================
// Créer une demande d'examen labo
// ============================================================
export async function creerExamenLabo(
  hospitalId: string,
  data: {
    patient_id: string;
    medecin_id: string;
    type_examen: TypeExamenLabo;
    notes?: string;
    urgence?: boolean;
  }
) {
  return prisma.examenLabo.create({
    data: {
      hospital_id: hospitalId,
      patient_id: data.patient_id,
      medecin_id: data.medecin_id,
      type_examen: data.type_examen,
      notes: data.notes ?? null,
      urgence: data.urgence ?? false,
      statut: "EN_ATTENTE",
    },
    include: { patient: true, medecin: true },
  });
}

// ============================================================
// Saisir les résultats d'un examen (texte)
// ============================================================
export async function saisirResultatsLabo(
  examenId: string,
  hospitalId: string,
  data: {
    resultats: string;
    statut?: StatutExamen;
  }
) {
  return prisma.examenLabo.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      resultats: data.resultats,
      statut: data.statut ?? "RESULTAT_SAISI",
    },
  });
}

// ============================================================
// Upload PDF résultats vers Supabase Storage
// Retourne l'URL publique signée du fichier
// ============================================================
export async function uploadResultatPDF(
  examenId: string,
  hospitalId: string,
  formData: FormData
) {
  const file = formData.get("fichier") as File;
  if (!file) throw new Error("Aucun fichier fourni");

  const supabase = await createClient();

  // Chemin unique dans le bucket : hospital_id/examen_id/nom_fichier
  const cheminFichier = `${hospitalId}/${examenId}/${Date.now()}_${file.name}`;

  // Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from("resultats-examens")
    .upload(cheminFichier, file, {
      contentType: file.type,
      upsert: true,
    });

  if (error) throw new Error(`Upload échoué : ${error.message}`);

  // Génère une URL signée valable 1 an (pour la démo)
  const { data: signedUrl } = await supabase.storage
    .from("resultats-examens")
    .createSignedUrl(cheminFichier, 365 * 24 * 60 * 60);

  // Sauvegarde l'URL en base
  await prisma.examenLabo.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      fichier_url: signedUrl?.signedUrl ?? null,
      fichier_nom: file.name,
      statut: "RESULTAT_SAISI",
    },
  });

  return signedUrl?.signedUrl;
}

// ============================================================
// Valider un examen (responsable labo)
// ============================================================
export async function validerExamenLabo(
  examenId: string,
  hospitalId: string,
  validateurId: string
) {
  return prisma.examenLabo.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      statut: "VALIDE",
      valide_par: validateurId,
      valide_le: new Date(),
    },
  });
}

// ============================================================
// Stats pour le header de la page
// ============================================================
export async function getStatsLabo(hospitalId: string) {
  const [enAttente, enCours, valides, urgents] = await Promise.all([
    prisma.examenLabo.count({
      where: { hospital_id: hospitalId, statut: "EN_ATTENTE" },
    }),
    prisma.examenLabo.count({
      where: { hospital_id: hospitalId, statut: "EN_COURS" },
    }),
    prisma.examenLabo.count({
      where: { hospital_id: hospitalId, statut: "VALIDE" },
    }),
    prisma.examenLabo.count({
      where: { hospital_id: hospitalId, urgence: true, statut: { not: "VALIDE" } },
    }),
  ]);

  return { enAttente, enCours, valides, urgents };
}