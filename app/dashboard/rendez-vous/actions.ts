// ============================================================
// ACTIONS RENDEZ-VOUS
//
// Répond à l'exigence §5.7 du cahier des charges KIMBA
// (« Prise de rendez-vous et calendrier médical »).
//
// Toutes les requêtes sont filtrées par hospital_id (multi-tenant).
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { enregistrerAudit } from "@/lib/audit";
import { verifierPermissionAction } from "@/lib/permissions.server";
import { StatutRendezVous } from "@/app/generated/prisma/client";

// ============================================================
// Liste des rendez-vous sur une plage de dates
//
// Le calendrier affiche toujours une période précise
// (une journée ou une semaine) : les bornes sont donc
// obligatoires pour éviter de charger tout l'historique.
// ============================================================
export async function getRendezVous(
  hospitalId: string,
  debut: Date,
  fin: Date,
  medecinId?: string
) {
  return prisma.rendezVous.findMany({
    where: {
      hospital_id: hospitalId,
      date_heure:  { gte: debut, lte: fin },
      ...(medecinId && { medecin_id: medecinId }),
    },
    include: {
      patient: true,
      medecin: true,
      service: true,
    },
    orderBy: { date_heure: "asc" },
  });
}

// ============================================================
// Rendez-vous du jour — utilisé par le badge du dashboard
//
// Les rendez-vous annulés sont exclus : ils ne représentent
// aucune charge de travail pour la journée.
// ============================================================
export async function getRendezVousDuJour(hospitalId: string) {
  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);

  const finJour = new Date();
  finJour.setHours(23, 59, 59, 999);

  return prisma.rendezVous.findMany({
    where: {
      hospital_id: hospitalId,
      date_heure:  { gte: debutJour, lte: finJour },
      statut:      { not: "ANNULE" },
    },
    include: {
      patient: true,
      medecin: true,
      service: true,
    },
    orderBy: { date_heure: "asc" },
  });
}

// ============================================================
// Rendez-vous d'un patient — utilisé dans sa fiche
// ============================================================
export async function getRendezVousPatient(
  hospitalId: string,
  patientId: string
) {
  return prisma.rendezVous.findMany({
    where:   { hospital_id: hospitalId, patient_id: patientId },
    include: { medecin: true, service: true },
    orderBy: { date_heure: "desc" },
  });
}

// ============================================================
// Vérifie qu'un médecin n'a pas déjà un rendez-vous
// qui chevauche le créneau demandé.
//
// Le calcul de chevauchement se fait en JavaScript : PostgreSQL
// ne peut pas comparer facilement « date_heure + duree_min »
// dans une clause WHERE. On ne charge que les rendez-vous du
// médecin sur la journée concernée, le volume reste minime.
//
// Retourne le rendez-vous en conflit, ou null s'il n'y en a pas.
// ============================================================
async function trouverConflit(
  hospitalId: string,
  medecinId: string,
  dateHeure: Date,
  dureeMin: number,
  rdvIdAExclure?: string
) {
  const debutJour = new Date(dateHeure);
  debutJour.setHours(0, 0, 0, 0);

  const finJour = new Date(dateHeure);
  finJour.setHours(23, 59, 59, 999);

  const rendezVousDuMedecin = await prisma.rendezVous.findMany({
    where: {
      hospital_id: hospitalId,
      medecin_id:  medecinId,
      date_heure:  { gte: debutJour, lte: finJour },
      // Un rendez-vous annulé ne bloque évidemment aucun créneau
      statut:      { not: "ANNULE" },
      // En modification, le rendez-vous ne doit pas entrer en conflit avec lui-même
      ...(rdvIdAExclure && { id: { not: rdvIdAExclure } }),
    },
    include: { patient: true },
  });

  const debutSouhaite = dateHeure.getTime();
  const finSouhaitee  = debutSouhaite + dureeMin * 60_000;

  return (
    rendezVousDuMedecin.find((rdv) => {
      const debutExistant = rdv.date_heure.getTime();
      const finExistante  = debutExistant + rdv.duree_min * 60_000;
      // Deux créneaux se chevauchent si chacun commence avant la fin de l'autre
      return debutSouhaite < finExistante && debutExistant < finSouhaitee;
    }) ?? null
  );
}

// ============================================================
// Créer un rendez-vous
// ============================================================
export async function creerRendezVous(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    patient_id: string;
    medecin_id: string;
    service_id?: string;
    date_heure: Date;
    duree_min?: number;
    motif?: string;
    notes?: string;
  }
) {
  await verifierPermissionAction(hospitalId, "RENDEZ_VOUS", "peut_creer");

  const dureeMin = data.duree_min ?? 30;

  // Le patient doit être rattaché à cet établissement (multi-tenant)
  const patientHospital = await prisma.patientHospital.findFirst({
    where:   { hospital_id: hospitalId, patient_id: data.patient_id },
    include: { patient: true },
  });
  if (!patientHospital) {
    throw new Error("Patient introuvable dans cet établissement");
  }

  // Le médecin doit lui aussi appartenir à cet établissement
  const medecin = await prisma.utilisateur.findFirst({
    where: { id: data.medecin_id, hospital_id: hospitalId },
  });
  if (!medecin) {
    throw new Error("Médecin introuvable dans cet établissement");
  }

  const conflit = await trouverConflit(
    hospitalId,
    data.medecin_id,
    data.date_heure,
    dureeMin
  );
  if (conflit) {
    const heure = conflit.date_heure.toLocaleTimeString("fr-FR", {
      hour:   "2-digit",
      minute: "2-digit",
    });
    throw new Error(
      `Ce médecin a déjà un rendez-vous à ${heure} ` +
      `(${conflit.patient.prenom} ${conflit.patient.nom})`
    );
  }

  const rendezVous = await prisma.rendezVous.create({
    data: {
      hospital_id: hospitalId,
      patient_id:  data.patient_id,
      medecin_id:  data.medecin_id,
      service_id:  data.service_id ?? null,
      date_heure:  data.date_heure,
      duree_min:   dureeMin,
      motif:       data.motif ?? null,
      notes:       data.notes ?? null,
    },
  });

  const nomPatient = `${patientHospital.patient.prenom} ${patientHospital.patient.nom}`;

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "RENDEZ_VOUS",
    description: `Création rendez-vous — ${nomPatient} avec Dr. ${medecin.nom} le ${data.date_heure.toLocaleString("fr-FR")}`,
    entiteId:    rendezVous.id,
    entiteNom:   nomPatient,
    metadonnees: {
      date_heure: data.date_heure.toISOString(),
      duree_min:  dureeMin,
      medecin:    `${medecin.prenom} ${medecin.nom}`,
      motif:      data.motif ?? null,
    },
  });

  return rendezVous;
}

// ============================================================
// Modifier un rendez-vous (report, changement de médecin...)
// ============================================================
export async function modifierRendezVous(
  rendezVousId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    medecin_id?: string;
    service_id?: string | null;
    date_heure?: Date;
    duree_min?: number;
    motif?: string;
    notes?: string;
  }
) {
  await verifierPermissionAction(hospitalId, "RENDEZ_VOUS", "peut_modifier");

  // Double filtre id + hospital_id (multi-tenant)
  const existant = await prisma.rendezVous.findFirst({
    where:   { id: rendezVousId, hospital_id: hospitalId },
    include: { patient: true },
  });
  if (!existant) {
    throw new Error("Rendez-vous introuvable");
  }

  // Valeurs finales après modification, pour vérifier le chevauchement
  const medecinFinal = data.medecin_id ?? existant.medecin_id;
  const dateFinale   = data.date_heure ?? existant.date_heure;
  const dureeFinale  = data.duree_min  ?? existant.duree_min;

  const conflit = await trouverConflit(
    hospitalId,
    medecinFinal,
    dateFinale,
    dureeFinale,
    rendezVousId
  );
  if (conflit) {
    const heure = conflit.date_heure.toLocaleTimeString("fr-FR", {
      hour:   "2-digit",
      minute: "2-digit",
    });
    throw new Error(
      `Ce médecin a déjà un rendez-vous à ${heure} ` +
      `(${conflit.patient.prenom} ${conflit.patient.nom})`
    );
  }

  const rendezVous = await prisma.rendezVous.update({
    where: { id: rendezVousId },
    data: {
      ...(data.medecin_id !== undefined && { medecin_id: data.medecin_id }),
      ...(data.service_id !== undefined && { service_id: data.service_id }),
      ...(data.date_heure !== undefined && { date_heure: data.date_heure }),
      ...(data.duree_min  !== undefined && { duree_min:  data.duree_min }),
      ...(data.motif      !== undefined && { motif:      data.motif }),
      ...(data.notes      !== undefined && { notes:      data.notes }),
    },
  });

  const nomPatient = `${existant.patient.prenom} ${existant.patient.nom}`;

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "RENDEZ_VOUS",
    description: `Modification rendez-vous — ${nomPatient}`,
    entiteId:    rendezVousId,
    entiteNom:   nomPatient,
    metadonnees: {
      ancienne_date: existant.date_heure.toISOString(),
      nouvelle_date: dateFinale.toISOString(),
      duree_min:     dureeFinale,
    },
  });

  return rendezVous;
}

// ============================================================
// Changer le statut d'un rendez-vous
//
// Couvre la confirmation, l'annulation, la présence (HONORE)
// et l'absence du patient (ABSENT). Une seule action plutôt que
// quatre quasi identiques — même approche que
// updateStatutConsultation dans le module Consultations.
// ============================================================
export async function changerStatutRendezVous(
  rendezVousId: string,
  hospitalId: string,
  statut: StatutRendezVous,
  utilisateurId: string,
  utilisateurNom: string
) {
  await verifierPermissionAction(hospitalId, "RENDEZ_VOUS", "peut_modifier");

  const existant = await prisma.rendezVous.findFirst({
    where:   { id: rendezVousId, hospital_id: hospitalId },
    include: { patient: true },
  });
  if (!existant) {
    throw new Error("Rendez-vous introuvable");
  }

  const rendezVous = await prisma.rendezVous.update({
    where: { id: rendezVousId },
    data:  { statut },
  });

  const nomPatient = `${existant.patient.prenom} ${existant.patient.nom}`;

  // Libellés lisibles dans le journal d'audit
  const LIBELLES: Record<StatutRendezVous, string> = {
    PLANIFIE: "replanifié",
    CONFIRME: "confirmé",
    HONORE:   "honoré",
    ANNULE:   "annulé",
    ABSENT:   "marqué absent",
  };

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "RENDEZ_VOUS",
    description: `Rendez-vous ${LIBELLES[statut]} — ${nomPatient}`,
    entiteId:    rendezVousId,
    entiteNom:   nomPatient,
    metadonnees: {
      ancien_statut:   existant.statut,
      nouveau_statut:  statut,
      date_rendez_vous: existant.date_heure.toISOString(),
    },
  });

  return rendezVous;
}

// ============================================================
// Supprimer un rendez-vous
//
// Réservé aux erreurs de saisie : dans le fonctionnement normal
// on passe le statut à ANNULE pour conserver la trace.
// ============================================================
export async function supprimerRendezVous(
  rendezVousId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  await verifierPermissionAction(hospitalId, "RENDEZ_VOUS", "peut_supprimer");

  const existant = await prisma.rendezVous.findFirst({
    where:   { id: rendezVousId, hospital_id: hospitalId },
    include: { patient: true },
  });
  if (!existant) {
    throw new Error("Rendez-vous introuvable");
  }

  await prisma.rendezVous.delete({ where: { id: rendezVousId } });

  const nomPatient = `${existant.patient.prenom} ${existant.patient.nom}`;

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "SUPPRESSION",
    module:      "RENDEZ_VOUS",
    description: `Suppression rendez-vous — ${nomPatient}`,
    entiteId:    rendezVousId,
    entiteNom:   nomPatient,
    metadonnees: {
      date_rendez_vous: existant.date_heure.toISOString(),
    },
  });
}
