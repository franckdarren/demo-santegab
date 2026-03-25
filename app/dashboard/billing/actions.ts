// ============================================================
// ACTIONS FACTURATION
// Toutes les requêtes filtrées par hospital_id (multi-tenant)
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { enregistrerAudit } from "@/lib/audit";

// ============================================================
// Liste des factures de l'hôpital
// ============================================================
export async function getFactures(hospitalId: string, search?: string) {
  return prisma.facture.findMany({
    where: {
      hospital_id: hospitalId,
      ...(search && {
        OR: [
          { numero_facture: { contains: search, mode: "insensitive" } },
          {
            patient: {
              OR: [
                { nom:    { contains: search, mode: "insensitive" } },
                { prenom: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
    },
    include: {
      patient:      true,
      lignes:       true,
      consultation: { include: { medecin: true } },
    },
    orderBy: { created_at: "desc" },
  });
}

// ============================================================
// Créer une facture manuelle (sans consultation associée)
// ============================================================
export async function creerFacture(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    patient_id:      string;
    lignes:          Array<{ description: string; quantite: number; prix_unitaire: number }>;
    mode_paiement?:  string;
    notes?:          string;
    taux_assurance?: number;
  }
) {
  const montantTotal     = data.lignes.reduce((sum, l) => sum + l.quantite * l.prix_unitaire, 0);
  const montantAssurance = Math.round(montantTotal * ((data.taux_assurance ?? 0) / 100));
  const montantPatient   = montantTotal - montantAssurance;

  const count = await prisma.facture.count({ where: { hospital_id: hospitalId } });
  const numeroFacture = `FAC-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  const patientHospital = await prisma.patientHospital.findFirst({
    where:   { hospital_id: hospitalId, patient_id: data.patient_id },
    include: { patient: true },
  });
  const nomPatient = patientHospital
    ? `${patientHospital.patient.prenom} ${patientHospital.patient.nom}`
    : "Patient inconnu";

  const facture = await prisma.facture.create({
    data: {
      hospital_id:       hospitalId,
      patient_id:        data.patient_id,
      numero_facture:    numeroFacture,
      statut:            "EN_ATTENTE",
      montant_total:     montantTotal,
      montant_assurance: montantAssurance,
      montant_patient:   montantPatient,
      notes:             data.notes ?? null,
      lignes: {
        create: data.lignes.map((l) => ({
          description:   l.description,
          quantite:      l.quantite,
          prix_unitaire: l.prix_unitaire,
          montant_total: l.quantite * l.prix_unitaire,
        })),
      },
    },
    include: { patient: true, lignes: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "FACTURATION",
    description: `Création facture ${numeroFacture} — ${nomPatient} (${montantPatient.toLocaleString("fr-FR")} XAF)`,
    entiteId:    facture.id,
    entiteNom:   numeroFacture,
    metadonnees: {
      numero_facture:    numeroFacture,
      montant_total:     montantTotal,
      montant_assurance: montantAssurance,
      montant_patient:   montantPatient,
      patient_id:        data.patient_id,
    },
  });

  return facture;
}

// ============================================================
// Payer une facture + générer écriture comptable automatique
//
// C'est LA pièce manquante : chaque paiement accepté crée
// automatiquement une écriture de type RECETTE dans le
// journal comptable.
//
// Sans cette étape, la comptabilité ne reflète pas la
// réalité financière de l'établissement — c'est un bug
// critique pour tout SIH en production.
// ============================================================
export async function payerFacture(
  factureId: string,
  hospitalId: string,
  modePaiement: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  // 1. Met à jour la facture en PAYEE
  const facture = await prisma.facture.update({
    where: { id: factureId, hospital_id: hospitalId },
    data: {
      statut:        "PAYEE",
      mode_paiement: modePaiement as any,
      date_paiement: new Date(),
    },
    include: {
      patient: true,
      lignes:  true,
    },
  });

  // --------------------------------------------------------
  // 2. Crée l'écriture comptable automatiquement
  //
  // Chaque paiement de facture = une recette dans le journal.
  // Le libellé inclut le numéro de facture et le nom du
  // patient pour faciliter les rapprochements comptables.
  // La référence pointe vers le numéro de facture.
  // --------------------------------------------------------
  const descriptionLignes = facture.lignes
    .map((l) => l.description)
    .join(", ");

  await prisma.ecritureComptable.create({
    data: {
      hospital_id:    hospitalId,
      utilisateur_id: utilisateurId,
      type_ecriture:  "RECETTE",
      libelle:        `Paiement ${facture.numero_facture} — ${facture.patient.prenom} ${facture.patient.nom}`,
      montant:        facture.montant_patient,
      date_ecriture:  new Date(),
      reference:      facture.numero_facture,
      facture_id:     facture.id,
      notes:          descriptionLignes,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "FACTURATION",
    description: `Paiement facture ${facture.numero_facture} — ${facture.patient.prenom} ${facture.patient.nom} — ${modePaiement} — ${facture.montant_patient.toLocaleString("fr-FR")} XAF`,
    entiteId:    factureId,
    entiteNom:   facture.numero_facture,
    metadonnees: {
      mode_paiement:     modePaiement,
      montant_patient:   facture.montant_patient,
      montant_assurance: facture.montant_assurance,
      ecriture_generee:  true,
    },
  });

  return facture;
}

// ============================================================
// Annuler une facture
// ============================================================
export async function annulerFacture(
  factureId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  const facture = await prisma.facture.update({
    where:   { id: factureId, hospital_id: hospitalId },
    data:    { statut: "ANNULEE" },
    include: { patient: true },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "FACTURATION",
    description: `Annulation facture ${facture.numero_facture} — ${facture.patient.prenom} ${facture.patient.nom}`,
    entiteId:    factureId,
    entiteNom:   facture.numero_facture,
  });

  return facture;
}

// ============================================================
// Stats facturation pour le résumé en haut de page
// ============================================================
export async function getStatsFacturation(hospitalId: string) {
  const { startOfMonth } = await import("date-fns");
  const debutMois = startOfMonth(new Date());

  const [totalEnAttente, totalPayeeMois, totalFacturesMois] = await Promise.all([
    prisma.facture.aggregate({
      where: { hospital_id: hospitalId, statut: "EN_ATTENTE" },
      _sum:  { montant_patient: true },
      _count: true,
    }),
    prisma.facture.aggregate({
      where: {
        hospital_id:   hospitalId,
        statut:        "PAYEE",
        date_paiement: { gte: debutMois },
      },
      _sum: { montant_patient: true },
    }),
    prisma.facture.count({
      where: {
        hospital_id: hospitalId,
        created_at:  { gte: debutMois },
      },
    }),
  ]);

  return {
    montantEnAttente:  totalEnAttente._sum.montant_patient ?? 0,
    nombreEnAttente:   totalEnAttente._count,
    encaisseMois:      totalPayeeMois._sum.montant_patient ?? 0,
    totalFacturesMois,
  };
}

// ============================================================
// Récupère les patients pour le formulaire de création
// ============================================================
export async function getPatientsHospital(hospitalId: string) {
  return prisma.patientHospital.findMany({
    where:   { hospital_id: hospitalId },
    include: { patient: true },
    orderBy: { created_at: "desc" },
  });
}