// ============================================================
// ACTIONS CONSULTATIONS
// Toutes les requêtes filtrées par hospital_id (multi-tenant)
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { enregistrerAudit } from "@/lib/audit";

// ============================================================
// Liste des consultations de l'hôpital
// ============================================================
export async function getConsultations(
  hospitalId: string,
  search?: string
) {
  return prisma.consultation.findMany({
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
          { motif: { contains: search, mode: "insensitive" } },
          { diagnostic: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      patient:      true,
      medecin:      true,
      prescriptions: true,
      facture:      true,
    },
    orderBy: { date_consultation: "desc" },
  });
}

// ============================================================
// Récupère les médecins de l'hôpital pour le formulaire
// ============================================================
export async function getMedecins(hospitalId: string) {
  return prisma.utilisateur.findMany({
    where: {
      hospital_id: hospitalId,
      role:        { in: ["MEDECIN", "ADMIN"] },
      est_actif:   true,
    },
    orderBy: { nom: "asc" },
  });
}

// ============================================================
// Récupère les patients de l'hôpital pour le formulaire
// ============================================================
export async function getPatientsHospital(hospitalId: string) {
  return prisma.patientHospital.findMany({
    where:   { hospital_id: hospitalId },
    include: { patient: true },
    orderBy: { created_at: "desc" },
  });
}

// ============================================================
// Créer une consultation
// ============================================================
export async function creerConsultation(
  hospitalId: string,
  medecinId: string,
  medecinNom: string,
  data: {
    patient_id: string;
    motif?: string;
    diagnostic?: string;
    notes?: string;
    tension?: string;
    poids_kg?: number;
    taille_cm?: number;
    temperature?: number;
    statut?: "EN_ATTENTE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
    prescriptions?: Array<{
      medicament: string;
      dosage?: string;
      frequence?: string;
      duree?: string;
      instructions?: string;
    }>;
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

  const consultation = await prisma.consultation.create({
    data: {
      hospital_id:  hospitalId,
      patient_id:   data.patient_id,
      medecin_id:   medecinId,
      statut:       data.statut ?? "EN_ATTENTE",
      motif:        data.motif ?? null,
      diagnostic:   data.diagnostic ?? null,
      notes:        data.notes ?? null,
      tension:      data.tension ?? null,
      poids_kg:     data.poids_kg ?? null,
      taille_cm:    data.taille_cm ?? null,
      temperature:  data.temperature ?? null,
      prescriptions: {
        create: data.prescriptions ?? [],
      },
    },
    include: {
      patient:       true,
      medecin:       true,
      prescriptions: true,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId:  medecinId,
    utilisateurNom: medecinNom,
    typeAction:     "CREATION",
    module:         "CONSULTATION",
    description:    `Création consultation — ${nomPatient}${data.motif ? ` — ${data.motif}` : ""}`,
    entiteId:       consultation.id,
    entiteNom:      nomPatient,
    metadonnees: {
      motif:      data.motif ?? null,
      statut:     data.statut ?? "EN_ATTENTE",
      nb_prescriptions: (data.prescriptions ?? []).length,
    },
  });

  return consultation;
}

// ============================================================
// Mettre à jour le statut d'une consultation
// ============================================================
export async function updateStatutConsultation(
  consultationId: string,
  hospitalId: string,
  statut: "EN_ATTENTE" | "EN_COURS" | "TERMINEE" | "ANNULEE",
  utilisateurId: string,
  utilisateurNom: string
) {
  const consultation = await prisma.consultation.update({
    where: { id: consultationId, hospital_id: hospitalId },
    data:  { statut },
    include: { patient: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "CONSULTATION",
    description: `Statut consultation mis à jour — ${consultation.patient.prenom} ${consultation.patient.nom} → ${statut}`,
    entiteId:    consultationId,
    entiteNom:   `${consultation.patient.prenom} ${consultation.patient.nom}`,
    metadonnees: { nouveau_statut: statut },
  });

  return consultation;
}

// ============================================================
// Mettre à jour une consultation (diagnostic + prescriptions)
// ============================================================
export async function updateConsultation(
  consultationId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    diagnostic?: string;
    notes?: string;
    tension?: string;
    poids_kg?: number;
    taille_cm?: number;
    temperature?: number;
    statut?: "EN_ATTENTE" | "EN_COURS" | "TERMINEE" | "ANNULEE";
    prescriptions?: Array<{
      medicament: string;
      dosage?: string;
      frequence?: string;
      duree?: string;
    }>;
  }
) {
  // Supprime les anciennes prescriptions et recrée les nouvelles
  await prisma.prescription.deleteMany({
    where: { consultation_id: consultationId },
  });

  const consultation = await prisma.consultation.update({
    where: { id: consultationId, hospital_id: hospitalId },
    data: {
      diagnostic:  data.diagnostic ?? null,
      notes:       data.notes ?? null,
      tension:     data.tension ?? null,
      poids_kg:    data.poids_kg ?? null,
      taille_cm:   data.taille_cm ?? null,
      temperature: data.temperature ?? null,
      statut:      data.statut ?? "TERMINEE",
      prescriptions: {
        create: data.prescriptions ?? [],
      },
    },
    include: {
      patient:       true,
      medecin:       true,
      prescriptions: true,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "CONSULTATION",
    description: `Modification consultation — ${consultation.patient.prenom} ${consultation.patient.nom}${data.diagnostic ? ` — ${data.diagnostic.slice(0, 50)}` : ""}`,
    entiteId:    consultationId,
    entiteNom:   `${consultation.patient.prenom} ${consultation.patient.nom}`,
    metadonnees: {
      statut:           data.statut ?? "TERMINEE",
      nb_prescriptions: (data.prescriptions ?? []).length,
      a_diagnostic:     !!data.diagnostic,
    },
  });

  return consultation;
}