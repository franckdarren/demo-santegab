// ============================================================
// ACTIONS LABORATOIRE
// Toutes les requêtes filtrées par hospital_id (multi-tenant)
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { TypeExamenLabo, StatutExamen } from "@/app/generated/prisma/client";
import { enregistrerAudit } from "@/lib/audit";

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
      { urgence: "desc" },
      { created_at: "desc" },
    ],
  });
}

// ============================================================
// Créer une demande d'examen labo
// ============================================================
export async function creerExamenLabo(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    patient_id: string;
    medecin_id: string;
    type_examen: TypeExamenLabo;
    notes?: string;
    urgence?: boolean;
  }
) {
  // Récupère le nom du patient pour l'audit
  const patientHospital = await prisma.patientHospital.findFirst({
    where: { hospital_id: hospitalId, patient_id: data.patient_id },
    include: { patient: true },
  });
  const nomPatient = patientHospital
    ? `${patientHospital.patient.prenom} ${patientHospital.patient.nom}`
    : "Patient inconnu";

  const examen = await prisma.examenLabo.create({
    data: {
      hospital_id: hospitalId,
      patient_id:  data.patient_id,
      medecin_id:  data.medecin_id,
      type_examen: data.type_examen,
      notes:       data.notes ?? null,
      urgence:     data.urgence ?? false,
      statut:      "EN_ATTENTE",
    },
    include: { patient: true, medecin: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "LABORATOIRE",
    description: `Demande examen labo — ${data.type_examen} — ${nomPatient}${data.urgence ? " 🔴 URGENT" : ""}`,
    entiteId:    examen.id,
    entiteNom:   nomPatient,
    metadonnees: {
      type_examen: data.type_examen,
      urgence:     data.urgence ?? false,
    },
  });

  return examen;
}

// ============================================================
// Saisir les résultats d'un examen (texte)
// ============================================================
export async function saisirResultatsLabo(
  examenId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    resultats: string;
    statut?: StatutExamen;
  }
) {
  const examen = await prisma.examenLabo.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      resultats: data.resultats,
      statut:    data.statut ?? "RESULTAT_SAISI",
    },
    include: { patient: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "LABORATOIRE",
    description: `Saisie résultats labo — ${examen.patient.prenom} ${examen.patient.nom}`,
    entiteId:    examenId,
    entiteNom:   `${examen.patient.prenom} ${examen.patient.nom}`,
    metadonnees: { statut: data.statut ?? "RESULTAT_SAISI" },
  });

  return examen;
}

// ============================================================
// Upload PDF résultats vers Supabase Storage
// ============================================================
export async function uploadResultatPDF(
  examenId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  formData: FormData
) {
  const file = formData.get("fichier") as File;
  if (!file) throw new Error("Aucun fichier fourni");

  const supabase = await createClient();

  const cheminFichier = `${hospitalId}/${examenId}/${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from("resultats-examens")
    .upload(cheminFichier, file, {
      contentType: file.type,
      upsert:      true,
    });

  if (error) throw new Error(`Upload échoué : ${error.message}`);

  const { data: signedUrl } = await supabase.storage
    .from("resultats-examens")
    .createSignedUrl(cheminFichier, 365 * 24 * 60 * 60);

  const examen = await prisma.examenLabo.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      fichier_url: signedUrl?.signedUrl ?? null,
      fichier_nom: file.name,
      statut:      "RESULTAT_SAISI",
    },
    include: { patient: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "LABORATOIRE",
    description: `Upload PDF résultats labo — ${examen.patient.prenom} ${examen.patient.nom} — ${file.name}`,
    entiteId:    examenId,
    entiteNom:   `${examen.patient.prenom} ${examen.patient.nom}`,
    metadonnees: {
      fichier_nom:  file.name,
      fichier_size: file.size,
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
  validateurId: string,
  validateurNom: string
) {
  const examen = await prisma.examenLabo.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      statut:     "VALIDE",
      valide_par: validateurId,
      valide_le:  new Date(),
    },
    include: { patient: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  validateurId,
    utilisateurNom: validateurNom,
    typeAction:     "MODIFICATION",
    module:         "LABORATOIRE",
    description:    `Validation examen labo — ${examen.patient.prenom} ${examen.patient.nom}`,
    entiteId:       examenId,
    entiteNom:      `${examen.patient.prenom} ${examen.patient.nom}`,
    metadonnees:    { statut: "VALIDE" },
  });

  return examen;
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
      where: {
        hospital_id: hospitalId,
        urgence:     true,
        statut:      { not: "VALIDE" },
      },
    }),
  ]);

  return { enAttente, enCours, valides, urgents };
}