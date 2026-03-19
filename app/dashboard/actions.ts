// ============================================================
// ACTIONS DASHBOARD — Récupération des KPIs
//
// Toutes les données sont filtrées par hospital_id pour
// respecter l'isolation multi-tenant.
// Ces fonctions tournent côté serveur (pas d'exposition API).
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, startOfMonth } from "date-fns";

// ============================================================
// KPIs principaux du dashboard
// ============================================================
export async function getDashboardStats(hospitalId: string) {
  const aujourdhui = new Date();
  const debutJour = startOfDay(aujourdhui);
  const finJour = endOfDay(aujourdhui);
  const debutMois = startOfMonth(aujourdhui);

  // Toutes les requêtes en parallèle pour la performance
  const [
    totalPatients,
    consultationsAujourdhui,
    consultationsMois,
    facturesMois,
    consultationsEnAttente,
    consultationsEnCours,
  ] = await Promise.all([
    // Total patients de l'hôpital
    prisma.patientHospital.count({
      where: { hospital_id: hospitalId },
    }),

    // Consultations du jour
    prisma.consultation.count({
      where: {
        hospital_id: hospitalId,
        date_consultation: { gte: debutJour, lte: finJour },
      },
    }),

    // Consultations du mois
    prisma.consultation.count({
      where: {
        hospital_id: hospitalId,
        date_consultation: { gte: debutMois },
      },
    }),

    // Revenus du mois (factures payées)
    prisma.facture.aggregate({
      where: {
        hospital_id: hospitalId,
        statut: "PAYEE",
        created_at: { gte: debutMois },
      },
      _sum: { montant_patient: true },
    }),

    // Patients en attente
    prisma.consultation.count({
      where: {
        hospital_id: hospitalId,
        statut: "EN_ATTENTE",
        date_consultation: { gte: debutJour },
      },
    }),

    // Consultations en cours
    prisma.consultation.count({
      where: {
        hospital_id: hospitalId,
        statut: "EN_COURS",
      },
    }),
  ]);

  return {
    totalPatients,
    consultationsAujourdhui,
    consultationsMois,
    revenusMois: facturesMois._sum.montant_patient ?? 0,
    consultationsEnAttente,
    consultationsEnCours,
  };
}

// ============================================================
// Données graphique — Consultations des 7 derniers jours
// ============================================================
export async function getConsultationsParJour(hospitalId: string) {
  const jours = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date,
      debut: startOfDay(date),
      fin: endOfDay(date),
    };
  });

  const data = await Promise.all(
    jours.map(async ({ date, debut, fin }) => {
      const count = await prisma.consultation.count({
        where: {
          hospital_id: hospitalId,
          date_consultation: { gte: debut, lte: fin },
        },
      });

      return {
        // Format court pour l'axe X : "Lun", "Mar"...
        jour: date.toLocaleDateString("fr-FR", { weekday: "short" }),
        consultations: count,
      };
    })
  );

  return data;
}

// ============================================================
// Données graphique — Répartition revenus par assurance
// ============================================================
export async function getRevenusParAssurance(hospitalId: string) {
  const debutMois = startOfMonth(new Date());

  const factures = await prisma.facture.findMany({
    where: {
      hospital_id: hospitalId,
      statut: "PAYEE",
      created_at: { gte: debutMois },
    },
    include: {
      patient: {
        include: {
          hospitalisations: {
            where: { hospital_id: hospitalId },
          },
        },
      },
    },
  });

  // Groupe par assurance
  const grouped: Record<string, number> = {};

  for (const facture of factures) {
    const assurance =
      facture.patient.hospitalisations[0]?.assurance_nom ?? "Sans assurance";
    grouped[assurance] = (grouped[assurance] ?? 0) + facture.montant_patient;
  }

  return Object.entries(grouped).map(([nom, montant]) => ({
    nom,
    montant,
  }));
}

// ============================================================
// Dernières consultations pour le tableau d'activité
// ============================================================
export async function getDerniersConsultations(hospitalId: string) {
  return prisma.consultation.findMany({
    where: { hospital_id: hospitalId },
    orderBy: { date_consultation: "desc" },
    take: 5,
    include: {
      patient: true,
      medecin: true,
    },
  });
}