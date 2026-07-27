// ============================================================
// ACTIONS PATIENTS — Récupération et création
// Toutes les requêtes filtrées par hospital_id (multi-tenant)
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { enregistrerAudit } from "@/lib/audit";
import { verifierPermissionAction } from "@/lib/permissions.server";

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

  // ----------------------------------------------------------
  // Antécédents structurés (CDC §5.6)
  //
  // ⚠️ VOLONTAIREMENT filtrés sur patient_id SEUL, sans hospital_id.
  //
  // Une allergie ou un traitement chronique est une caractéristique
  // du PATIENT, pas un événement appartenant à l'établissement.
  // Ils suivent donc le patient d'une structure à l'autre, comme
  // le groupe sanguin et les allergies portés par le modèle Patient.
  //
  // hospital_id reste stocké sur chaque ligne : il indique QUI a
  // saisi l'antécédent (traçabilité) et conditionne le droit de le
  // modifier, mais pas celui de le lire.
  //
  // Les traitements en cours et pathologies actives remontent en premier.
  // ----------------------------------------------------------
  const antecedents = await prisma.antecedentMedical.findMany({
    where:   { patient_id: patientId },
    orderBy: [{ est_actif: "desc" }, { date_debut: "desc" }],
  });

  return {
    ...patientHospital.patient,
    assurance_nom:    patientHospital.assurance_nom,
    assurance_numero: patientHospital.assurance_numero,
    taux_couverture:  patientHospital.taux_couverture,
    medecin_traitant: patientHospital.medecin_traitant,
    consultations,
    factures,
    antecedents_structures: antecedents,
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
  await verifierPermissionAction(hospitalId, "PATIENT", "peut_creer");

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
  await verifierPermissionAction(hospitalId, "PATIENT", "peut_modifier");

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
  await verifierPermissionAction(hospitalId, "PATIENT", "peut_supprimer");

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
// ============================================================
// ANTÉCÉDENTS MÉDICAUX STRUCTURÉS (CDC KIMBA §5.6)
//
// Remplacent progressivement le champ texte libre
// Patient.antecedents, conservé comme repli.
//
// Le module d'audit utilisé est PATIENT : un antécédent fait
// partie du dossier patient, aucune valeur d'enum à ajouter.
// ============================================================

// Types d'antécédents acceptés — repris de l'enum Prisma
type TypeAntecedentSaisi =
  | "PATHOLOGIE"
  | "HOSPITALISATION"
  | "CHIRURGIE"
  | "ALLERGIE"
  | "TRAITEMENT_CHRONIQUE";

// ============================================================
// Ajouter un antécédent
// ============================================================
export async function creerAntecedent(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    patient_id: string;
    type:       TypeAntecedentSaisi;
    libelle:    string;
    date_debut?: Date | null;
    date_fin?:   Date | null;
    est_actif?:  boolean;
    notes?:      string;
  }
) {
  await verifierPermissionAction(hospitalId, "PATIENT", "peut_modifier");

  // Le patient doit être rattaché à cet établissement (multi-tenant)
  const patientHospital = await prisma.patientHospital.findFirst({
    where:   { hospital_id: hospitalId, patient_id: data.patient_id },
    include: { patient: true },
  });
  if (!patientHospital) {
    throw new Error("Patient introuvable dans cet établissement");
  }

  const antecedent = await prisma.antecedentMedical.create({
    data: {
      hospital_id: hospitalId,
      patient_id:  data.patient_id,
      type:        data.type,
      libelle:     data.libelle,
      date_debut:  data.date_debut ?? null,
      date_fin:    data.date_fin ?? null,
      est_actif:   data.est_actif ?? true,
      notes:       data.notes ?? null,
    },
  });

  const nomPatient = `${patientHospital.patient.prenom} ${patientHospital.patient.nom}`;

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "PATIENT",
    description: `Ajout antécédent (${data.type}) — ${nomPatient} : ${data.libelle}`,
    entiteId:    antecedent.id,
    entiteNom:   nomPatient,
    metadonnees: {
      type:      data.type,
      libelle:   data.libelle,
      est_actif: data.est_actif ?? true,
    },
  });

  return antecedent;
}

// ============================================================
// Modifier un antécédent
//
// Sert notamment à clôturer un traitement chronique :
// est_actif = false + date_fin renseignée.
// ============================================================
export async function modifierAntecedent(
  antecedentId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    type?:       TypeAntecedentSaisi;
    libelle?:    string;
    date_debut?: Date | null;
    date_fin?:   Date | null;
    est_actif?:  boolean;
    notes?:      string;
  }
) {
  await verifierPermissionAction(hospitalId, "PATIENT", "peut_modifier");

  // Double filtre id + hospital_id (multi-tenant)
  const existant = await prisma.antecedentMedical.findFirst({
    where:   { id: antecedentId, hospital_id: hospitalId },
    include: { patient: true },
  });
  if (!existant) {
    throw new Error("Antécédent introuvable");
  }

  const antecedent = await prisma.antecedentMedical.update({
    where: { id: antecedentId },
    data: {
      ...(data.type       !== undefined && { type:       data.type }),
      ...(data.libelle    !== undefined && { libelle:    data.libelle }),
      ...(data.date_debut !== undefined && { date_debut: data.date_debut }),
      ...(data.date_fin   !== undefined && { date_fin:   data.date_fin }),
      ...(data.est_actif  !== undefined && { est_actif:  data.est_actif }),
      ...(data.notes      !== undefined && { notes:      data.notes }),
    },
  });

  const nomPatient = `${existant.patient.prenom} ${existant.patient.nom}`;

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "PATIENT",
    description: `Modification antécédent — ${nomPatient} : ${antecedent.libelle}`,
    entiteId:    antecedentId,
    entiteNom:   nomPatient,
    metadonnees: {
      ancien_libelle:   existant.libelle,
      nouveau_libelle:  antecedent.libelle,
      ancien_est_actif: existant.est_actif,
      nouvel_est_actif: antecedent.est_actif,
    },
  });

  return antecedent;
}

// ============================================================
// Supprimer un antécédent (erreur de saisie)
// ============================================================
export async function supprimerAntecedent(
  antecedentId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  await verifierPermissionAction(hospitalId, "PATIENT", "peut_supprimer");

  const existant = await prisma.antecedentMedical.findFirst({
    where:   { id: antecedentId, hospital_id: hospitalId },
    include: { patient: true },
  });
  if (!existant) {
    throw new Error("Antécédent introuvable");
  }

  await prisma.antecedentMedical.delete({ where: { id: antecedentId } });

  const nomPatient = `${existant.patient.prenom} ${existant.patient.nom}`;

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "SUPPRESSION",
    module:      "PATIENT",
    description: `Suppression antécédent — ${nomPatient} : ${existant.libelle}`,
    entiteId:    antecedentId,
    entiteNom:   nomPatient,
    metadonnees: { type: existant.type, libelle: existant.libelle },
  });
}
