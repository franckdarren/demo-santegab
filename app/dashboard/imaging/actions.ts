// ============================================================
// ACTIONS IMAGERIE — Identique au labo avec types spécifiques
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { TypeExamenImagerie, StatutExamen } from "@/app/generated/prisma/client";
import { enregistrerAudit } from "@/lib/audit";

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

// ============================================================
// Créer une demande d'examen imagerie
// ============================================================
export async function creerExamenImagerie(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    patient_id: string;
    medecin_id: string;
    type_examen: TypeExamenImagerie;
    zone_anatomique?: string;
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

  const examen = await prisma.examenImagerie.create({
    data: {
      hospital_id:     hospitalId,
      patient_id:      data.patient_id,
      medecin_id:      data.medecin_id,
      type_examen:     data.type_examen,
      zone_anatomique: data.zone_anatomique ?? null,
      notes:           data.notes ?? null,
      urgence:         data.urgence ?? false,
      statut:          "EN_ATTENTE",
    },
    include: { patient: true, medecin: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "IMAGERIE",
    description: `Demande imagerie — ${data.type_examen}${data.zone_anatomique ? ` (${data.zone_anatomique})` : ""} — ${nomPatient}${data.urgence ? " 🔴 URGENT" : ""}`,
    entiteId:    examen.id,
    entiteNom:   nomPatient,
    metadonnees: {
      type_examen:     data.type_examen,
      zone_anatomique: data.zone_anatomique ?? null,
      urgence:         data.urgence ?? false,
    },
  });

  return examen;
}

// ============================================================
// Saisir les résultats d'un examen imagerie
// ============================================================
export async function saisirResultatsImagerie(
  examenId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    resultats: string;
    zone_anatomique?: string;
    statut?: StatutExamen;
  }
) {
  const examen = await prisma.examenImagerie.update({
    where: { id: examenId, hospital_id: hospitalId },
    data: {
      resultats:       data.resultats,
      zone_anatomique: data.zone_anatomique ?? undefined,
      statut:          data.statut ?? "RESULTAT_SAISI",
    },
    include: { patient: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "IMAGERIE",
    description: `Saisie résultats imagerie — ${examen.patient.prenom} ${examen.patient.nom}`,
    entiteId:    examenId,
    entiteNom:   `${examen.patient.prenom} ${examen.patient.nom}`,
    metadonnees: {
      statut:          data.statut ?? "RESULTAT_SAISI",
      zone_anatomique: data.zone_anatomique ?? null,
    },
  });

  return examen;
}

// ============================================================
// Upload fichier résultat imagerie
// ============================================================
export async function uploadResultatImagerie(
  examenId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
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
      upsert:      true,
    });

  if (error) throw new Error(`Upload échoué : ${error.message}`);

  const { data: signedUrl } = await supabase.storage
    .from("resultats-examens")
    .createSignedUrl(cheminFichier, 365 * 24 * 60 * 60);

  const examen = await prisma.examenImagerie.update({
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
    module:      "IMAGERIE",
    description: `Upload fichier imagerie — ${examen.patient.prenom} ${examen.patient.nom} — ${file.name}`,
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
// Valider un examen imagerie
// ============================================================
export async function validerExamenImagerie(
  examenId: string,
  hospitalId: string,
  validateurId: string,
  validateurNom: string
) {
  const examen = await prisma.examenImagerie.update({
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
    module:         "IMAGERIE",
    description:    `Validation examen imagerie — ${examen.patient.prenom} ${examen.patient.nom}`,
    entiteId:       examenId,
    entiteNom:      `${examen.patient.prenom} ${examen.patient.nom}`,
    metadonnees:    { statut: "VALIDE" },
  });

  return examen;
}

// ============================================================
// Stats imagerie
// ============================================================
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
        urgence:     true,
        statut:      { not: "VALIDE" },
      },
    }),
  ]);

  return { enAttente, enCours, valides, urgents };
}