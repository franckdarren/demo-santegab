// ============================================================
// ACTIONS PATIENTS — Récupération et création
// Toutes les requêtes filtrées par hospital_id (multi-tenant)
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { enregistrerAudit } from "@/lib/audit";

// ============================================================
// Liste des patients de l'hôpital avec recherche
// ============================================================
export async function getPatients(hospitalId: string, search?: string) {
  return prisma.patientHospital.findMany({
    where: {
      hospital_id: hospitalId,
      ...(search && {
        patient: {
          OR: [
            { nom:            { contains: search, mode: "insensitive" } },
            { prenom:         { contains: search, mode: "insensitive" } },
            { numero_dossier: { contains: search, mode: "insensitive" } },
            { telephone:      { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    },
    include: { patient: true },
    orderBy: { created_at: "desc" },
  });
}

// ============================================================
// Fiche complète d'un patient
// ============================================================
export async function getPatientById(patientId: string, hospitalId: string) {
  const patientHospital = await prisma.patientHospital.findUnique({
    where: {
      patient_id_hospital_id: {
        patient_id:  patientId,
        hospital_id: hospitalId,
      },
    },
    include: { patient: true },
  });

  if (!patientHospital) return null;

  const consultations = await prisma.consultation.findMany({
    where: { patient_id: patientId, hospital_id: hospitalId },
    include: {
      medecin:       true,
      prescriptions: true,
      facture:       true,
    },
    orderBy: { date_consultation: "desc" },
  });

  const factures = await prisma.facture.findMany({
    where:   { patient_id: patientId, hospital_id: hospitalId },
    include: { lignes: true },
    orderBy: { created_at: "desc" },
  });

  return {
    ...patientHospital.patient,
    assurance_nom:    patientHospital.assurance_nom,
    assurance_numero: patientHospital.assurance_numero,
    taux_couverture:  patientHospital.taux_couverture,
    medecin_traitant: patientHospital.medecin_traitant,
    consultations,
    factures,
  };
}

// ============================================================
// Créer un nouveau patient
// ============================================================
export async function creerPatient(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    nom: string;
    prenom: string;
    date_naissance?: string;
    sexe?: "MASCULIN" | "FEMININ";
    telephone?: string;
    email?: string;
    adresse?: string;
    groupe_sanguin?: string;
    allergies?: string;
    antecedents?: string;
    assurance_nom?: string;
    assurance_numero?: string;
    taux_couverture?: number;
  }
) {
  const count = await prisma.patient.count();
  const numeroDossier = `PAT-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  const patient = await prisma.patient.create({
    data: {
      numero_dossier: numeroDossier,
      nom:            data.nom.trim().toUpperCase(),
      prenom:         data.prenom.trim(),
      date_naissance: data.date_naissance ? new Date(data.date_naissance) : null,
      sexe:           data.sexe ?? null,
      telephone:      data.telephone ?? null,
      email:          data.email ?? null,
      adresse:        data.adresse ?? null,
      groupe_sanguin: data.groupe_sanguin ?? null,
      allergies:      data.allergies ?? null,
      antecedents:    data.antecedents ?? null,
      hospitalisations: {
        create: {
          hospital_id:      hospitalId,
          assurance_nom:    data.assurance_nom ?? null,
          assurance_numero: data.assurance_numero ?? null,
          taux_couverture:  data.taux_couverture ?? 0,
        },
      },
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "PATIENT",
    description: `Création patient — ${data.prenom} ${data.nom} (${numeroDossier})`,
    entiteId:    patient.id,
    entiteNom:   `${data.prenom} ${data.nom}`,
    metadonnees: {
      numero_dossier: numeroDossier,
      assurance_nom:  data.assurance_nom ?? null,
      groupe_sanguin: data.groupe_sanguin ?? null,
    },
  });

  return patient;
}

// ============================================================
// Modifier un patient
// ============================================================
export async function modifierPatient(
  patientId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    nom: string;
    prenom: string;
    date_naissance?: string;
    sexe?: "MASCULIN" | "FEMININ";
    telephone?: string;
    email?: string;
    adresse?: string;
    groupe_sanguin?: string;
    allergies?: string;
    antecedents?: string;
    assurance_nom?: string;
    assurance_numero?: string;
    taux_couverture?: number;
  }
) {
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      nom:            data.nom.trim().toUpperCase(),
      prenom:         data.prenom.trim(),
      date_naissance: data.date_naissance ? new Date(data.date_naissance) : null,
      sexe:           data.sexe ?? null,
      telephone:      data.telephone ?? null,
      email:          data.email ?? null,
      adresse:        data.adresse ?? null,
      groupe_sanguin: data.groupe_sanguin ?? null,
      allergies:      data.allergies ?? null,
      antecedents:    data.antecedents ?? null,
    },
  });

  await prisma.patientHospital.update({
    where: {
      patient_id_hospital_id: {
        patient_id:  patientId,
        hospital_id: hospitalId,
      },
    },
    data: {
      assurance_nom:    data.assurance_nom ?? null,
      assurance_numero: data.assurance_numero ?? null,
      taux_couverture:  data.taux_couverture ?? 0,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "PATIENT",
    description: `Modification patient — ${data.prenom} ${data.nom}`,
    entiteId:    patientId,
    entiteNom:   `${data.prenom} ${data.nom}`,
    metadonnees: {
      assurance_nom:  data.assurance_nom ?? null,
      groupe_sanguin: data.groupe_sanguin ?? null,
    },
  });
}

// ============================================================
// Supprimer un patient
// Supprime dans l'ordre pour respecter les contraintes FK :
// 1. Lignes de factures
// 2. Factures
// 3. Prescriptions
// 4. Consultations
// 5. Lien patient ↔ hôpital
// ============================================================
export async function supprimerPatient(
  patientId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  nomPatient: string
) {
  const consultations = await prisma.consultation.findMany({
    where:  { patient_id: patientId, hospital_id: hospitalId },
    select: { id: true },
  });
  const consultationIds = consultations.map((c) => c.id);

  const factures = await prisma.facture.findMany({
    where:  { patient_id: patientId, hospital_id: hospitalId },
    select: { id: true },
  });
  const factureIds = factures.map((f) => f.id);

  // 1. Lignes de factures
  if (factureIds.length > 0) {
    await prisma.ligneFacture.deleteMany({
      where: { facture_id: { in: factureIds } },
    });
  }

  // 2. Factures
  await prisma.facture.deleteMany({
    where: { patient_id: patientId, hospital_id: hospitalId },
  });

  // 3. Prescriptions
  if (consultationIds.length > 0) {
    await prisma.prescription.deleteMany({
      where: { consultation_id: { in: consultationIds } },
    });
  }

  // 4. Consultations
  await prisma.consultation.deleteMany({
    where: { patient_id: patientId, hospital_id: hospitalId },
  });

  // 5. Lien patient ↔ hôpital
  await prisma.patientHospital.delete({
    where: {
      patient_id_hospital_id: {
        patient_id:  patientId,
        hospital_id: hospitalId,
      },
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "SUPPRESSION",
    module:      "PATIENT",
    description: `Suppression patient — ${nomPatient}`,
    entiteId:    patientId,
    entiteNom:   nomPatient,
    metadonnees: {
      nb_consultations_supprimees: consultationIds.length,
      nb_factures_supprimees:      factureIds.length,
    },
  });
}