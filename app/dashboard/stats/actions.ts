"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";

// ============================================================
// Stats générales — KPIs principaux
// ============================================================
export async function getStatsGenerales(hospitalId: string) {
  const aujourd_hui = new Date();
  const debutMois = startOfMonth(aujourd_hui);
  const debutMoisPrecedent = startOfMonth(subMonths(aujourd_hui, 1));
  const finMoisPrecedent = startOfMonth(aujourd_hui);

  const [
    totalPatients,
    nouveauxPatientsMois,
    totalConsultationsMois,
    totalConsultationsMoisPrecedent,
    totalExamensLabo,
    totalExamensImagerie,
  ] = await Promise.all([
    prisma.patientHospital.count({
      where: { hospital_id: hospitalId },
    }),
    prisma.patientHospital.count({
      where: {
        hospital_id: hospitalId,
        created_at: { gte: debutMois },
      },
    }),
    prisma.consultation.count({
      where: {
        hospital_id: hospitalId,
        created_at: { gte: debutMois },
      },
    }),
    prisma.consultation.count({
      where: {
        hospital_id: hospitalId,
        created_at: {
          gte: debutMoisPrecedent,
          lt: finMoisPrecedent,
        },
      },
    }),
    prisma.examenLabo.count({
      where: {
        hospital_id: hospitalId,
        created_at: { gte: debutMois },
      },
    }),
    prisma.examenImagerie.count({
      where: {
        hospital_id: hospitalId,
        created_at: { gte: debutMois },
      },
    }),
  ]);

  // Calcule l'évolution des consultations vs mois précédent
  const evolutionConsultations =
    totalConsultationsMoisPrecedent > 0
      ? Math.round(
          ((totalConsultationsMois - totalConsultationsMoisPrecedent) /
            totalConsultationsMoisPrecedent) *
            100
        )
      : 0;

  return {
    totalPatients,
    nouveauxPatientsMois,
    totalConsultationsMois,
    evolutionConsultations,
    totalExamensLabo,
    totalExamensImagerie,
  };
}

// ============================================================
// Stats activité — consultations par jour sur 30 jours
// ============================================================
export async function getStatsActivite(hospitalId: string) {
  const jours = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  const data = await Promise.all(
    jours.map(async (date) => {
      const debut = startOfDay(date);
      const fin = endOfDay(date);

      const [consultations, examens] = await Promise.all([
        prisma.consultation.count({
          where: {
            hospital_id: hospitalId,
            created_at: { gte: debut, lte: fin },
          },
        }),
        prisma.examenLabo.count({
          where: {
            hospital_id: hospitalId,
            created_at: { gte: debut, lte: fin },
          },
        }),
      ]);

      return {
        date: date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        }),
        consultations,
        examens,
      };
    })
  );

  return data;
}

// ============================================================
// Stats financières — revenus et factures
// ============================================================
export async function getStatsFinancieres(hospitalId: string) {
  const aujourd_hui = new Date();
  const debutMois = startOfMonth(aujourd_hui);

  // Revenus des 6 derniers mois
  const revenusMensuels = await Promise.all(
    Array.from({ length: 6 }, async (_, i) => {
      const mois = subMonths(aujourd_hui, 5 - i);
      const debut = startOfMonth(mois);
      const fin = startOfMonth(subMonths(mois, -1));

      const result = await prisma.facture.aggregate({
        where: {
          hospital_id: hospitalId,
          statut: "PAYEE",
          created_at: { gte: debut, lt: fin },
        },
        _sum: { montant_patient: true },
      });

      return {
        mois: mois.toLocaleDateString("fr-FR", { month: "short" }),
        revenus: result._sum.montant_patient ?? 0,
      };
    })
  );

  // Stats du mois en cours
  const [facturesMois, facturesEnAttente, revenusMois] = await Promise.all([
    prisma.facture.count({
      where: {
        hospital_id: hospitalId,
        created_at: { gte: debutMois },
      },
    }),
    prisma.facture.count({
      where: {
        hospital_id: hospitalId,
        statut: "EN_ATTENTE",
      },
    }),
    prisma.facture.aggregate({
      where: {
        hospital_id: hospitalId,
        statut: "PAYEE",
        created_at: { gte: debutMois },
      },
      _sum: { montant_patient: true },
    }),
  ]);

  return {
    revenusMensuels,
    facturesMois,
    facturesEnAttente,
    revenusMois: revenusMois._sum.montant_patient ?? 0,
  };
}

// ============================================================
// Stats stock — articles en alerte
// ============================================================
export async function getStatsStock(hospitalId: string) {
  const articles = await prisma.articleStock.findMany({
    where: { hospital_id: hospitalId, est_actif: true },
    orderBy: { quantite_stock: "asc" },
    take: 10,
  });

  const totalArticles = articles.length;
  const articlesEnAlerte = articles.filter(
    (a) => a.quantite_stock <= a.seuil_alerte
  ).length;
  const articlesRupture = articles.filter(
    (a) => a.quantite_stock === 0
  ).length;

  return {
    articles,
    totalArticles,
    articlesEnAlerte,
    articlesRupture,
  };
}