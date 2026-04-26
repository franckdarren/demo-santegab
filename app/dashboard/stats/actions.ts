"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, startOfDay, endOfDay, differenceInDays } from "date-fns";

// Utilitaire : retourne le début/fin de période (défaut = mois courant)
function parsePeriode(debut?: string, fin?: string): { debut: Date; fin: Date } {
  if (debut && fin) {
    return {
      debut: startOfDay(new Date(debut)),
      fin: endOfDay(new Date(fin)),
    };
  }
  const aujourd_hui = new Date();
  return {
    debut: startOfMonth(aujourd_hui),
    fin: endOfDay(aujourd_hui),
  };
}

// ============================================================
// Stats générales — KPIs principaux
// ============================================================
export async function getStatsGenerales(
  hospitalId: string,
  debutStr?: string,
  finStr?: string
) {
  const { debut, fin } = parsePeriode(debutStr, finStr);
  // Période précédente = même durée juste avant la période sélectionnée
  const dureeMs = fin.getTime() - debut.getTime();
  const debutPrecedent = new Date(debut.getTime() - dureeMs - 1);
  const finPrecedent = new Date(debut.getTime() - 1);

  const [
    totalPatients,
    nouveauxPatientsPeriode,
    totalConsultationsPeriode,
    totalConsultationsPrecedent,
    totalExamensLabo,
    totalExamensImagerie,
  ] = await Promise.all([
    prisma.patientHospital.count({ where: { hospital_id: hospitalId } }),
    prisma.patientHospital.count({
      where: { hospital_id: hospitalId, created_at: { gte: debut, lte: fin } },
    }),
    prisma.consultation.count({
      where: { hospital_id: hospitalId, created_at: { gte: debut, lte: fin } },
    }),
    prisma.consultation.count({
      where: { hospital_id: hospitalId, created_at: { gte: debutPrecedent, lte: finPrecedent } },
    }),
    prisma.examenLabo.count({
      where: { hospital_id: hospitalId, created_at: { gte: debut, lte: fin } },
    }),
    prisma.examenImagerie.count({
      where: { hospital_id: hospitalId, created_at: { gte: debut, lte: fin } },
    }),
  ]);

  const evolutionConsultations =
    totalConsultationsPrecedent > 0
      ? Math.round(
          ((totalConsultationsPeriode - totalConsultationsPrecedent) /
            totalConsultationsPrecedent) *
            100
        )
      : 0;

  return {
    totalPatients,
    nouveauxPatientsMois: nouveauxPatientsPeriode,
    totalConsultationsMois: totalConsultationsPeriode,
    evolutionConsultations,
    totalExamensLabo,
    totalExamensImagerie,
  };
}

// ============================================================
// Stats activité — consultations/examens sur la période
// Génère au plus 30 points (échantillonnage si période longue)
// ============================================================
export async function getStatsActivite(
  hospitalId: string,
  debutStr?: string,
  finStr?: string
) {
  const { debut, fin } = parsePeriode(debutStr, finStr);
  const nbJours = differenceInDays(fin, debut) + 1;
  // Max 30 points affichés — pas = 1 jour si <= 30j, sinon N jours
  const pas = Math.max(1, Math.ceil(nbJours / 30));

  const jours: Date[] = [];
  for (let i = 0; i < nbJours; i += pas) {
    const d = new Date(debut);
    d.setDate(debut.getDate() + i);
    jours.push(d);
  }

  const data = await Promise.all(
    jours.map(async (date) => {
      const debutJour = startOfDay(date);
      // Couvre le pas de jours complet (ex: si pas=7, cumule une semaine)
      const finGroupe = new Date(debutJour);
      finGroupe.setDate(debutJour.getDate() + pas - 1);
      const finJour = endOfDay(finGroupe < fin ? finGroupe : fin);

      const [consultations, examens] = await Promise.all([
        prisma.consultation.count({
          where: { hospital_id: hospitalId, created_at: { gte: debutJour, lte: finJour } },
        }),
        prisma.examenLabo.count({
          where: { hospital_id: hospitalId, created_at: { gte: debutJour, lte: finJour } },
        }),
      ]);

      return {
        date: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
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
export async function getStatsFinancieres(
  hospitalId: string,
  debutStr?: string,
  finStr?: string
) {
  const { debut, fin } = parsePeriode(debutStr, finStr);

  // Nombre de mois couverts par la période (entre 1 et 12)
  const nbMois = Math.min(
    12,
    Math.max(
      1,
      (fin.getFullYear() - debut.getFullYear()) * 12 +
        fin.getMonth() -
        debut.getMonth() +
        1
    )
  );

  const revenusMensuels = await Promise.all(
    Array.from({ length: nbMois }, async (_, i) => {
      const moisDate = new Date(debut.getFullYear(), debut.getMonth() + i, 1);
      const debutMoisIt =
        i === 0 ? debut : new Date(moisDate.getFullYear(), moisDate.getMonth(), 1);
      const dernierJour = new Date(
        moisDate.getFullYear(),
        moisDate.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      const finMoisIt = i === nbMois - 1 ? fin : dernierJour;

      const result = await prisma.facture.aggregate({
        where: {
          hospital_id: hospitalId,
          statut: "PAYEE",
          created_at: { gte: debutMoisIt, lte: finMoisIt },
        },
        _sum: { montant_patient: true },
      });

      return {
        mois: moisDate.toLocaleDateString("fr-FR", { month: "short" }),
        revenus: result._sum.montant_patient ?? 0,
      };
    })
  );

  const [facturesMois, facturesEnAttente, revenusMois] = await Promise.all([
    prisma.facture.count({
      where: { hospital_id: hospitalId, created_at: { gte: debut, lte: fin } },
    }),
    prisma.facture.count({
      where: { hospital_id: hospitalId, statut: "EN_ATTENTE" },
    }),
    prisma.facture.aggregate({
      where: {
        hospital_id: hospitalId,
        statut: "PAYEE",
        created_at: { gte: debut, lte: fin },
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
// Stats stock — état actuel (pas de filtre par date)
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

  return { articles, totalArticles, articlesEnAlerte, articlesRupture };
}

// ============================================================
// Export CSV — rapport détaillé sur la période sélectionnée
// Retourne une chaîne CSV avec BOM UTF-8 (compatible Excel)
// ============================================================
export async function exporterRapportCSV(
  hospitalId: string,
  debutStr: string,
  finStr: string
): Promise<string> {
  const { debut, fin } = parsePeriode(debutStr, finStr);

  const [
    hopital,
    consultations,
    examensLabo,
    examensImagerie,
    factures,
    hospitalisations,
    stock,
  ] = await Promise.all([
    prisma.hospital.findUnique({
      where: { id: hospitalId },
      select: { nom: true },
    }),
    prisma.consultation.findMany({
      where: { hospital_id: hospitalId, created_at: { gte: debut, lte: fin } },
      include: {
        patient: { select: { nom: true, prenom: true } },
        medecin: { select: { prenom: true, nom: true } },
      },
      orderBy: { created_at: "asc" },
    }),
    prisma.examenLabo.findMany({
      where: { hospital_id: hospitalId, created_at: { gte: debut, lte: fin } },
      include: { patient: { select: { nom: true, prenom: true } } },
      orderBy: { created_at: "asc" },
    }),
    prisma.examenImagerie.findMany({
      where: { hospital_id: hospitalId, created_at: { gte: debut, lte: fin } },
      include: { patient: { select: { nom: true, prenom: true } } },
      orderBy: { created_at: "asc" },
    }),
    prisma.facture.findMany({
      where: { hospital_id: hospitalId, created_at: { gte: debut, lte: fin } },
      include: { patient: { select: { nom: true, prenom: true } } },
      orderBy: { created_at: "asc" },
    }),
    prisma.hospitalisation.findMany({
      where: { hospital_id: hospitalId, created_at: { gte: debut, lte: fin } },
      include: {
        patient: { select: { nom: true, prenom: true } },
        chambre: { select: { numero: true, type_chambre: true } },
      },
      orderBy: { created_at: "asc" },
    }),
    prisma.articleStock.findMany({
      where: { hospital_id: hospitalId, est_actif: true },
      orderBy: { quantite_stock: "asc" },
    }),
  ]);

  const nomHopital = hopital?.nom ?? "Hôpital";
  const debutFr = debut.toLocaleDateString("fr-FR");
  const finFr = fin.toLocaleDateString("fr-FR");
  const maintenant = new Date().toLocaleDateString("fr-FR");

  // Échappe les valeurs pour CSV (guillemets doubles)
  const esc = (s: string | null | undefined): string =>
    `"${(s ?? "").replace(/"/g, '""')}"`;

  const lignes: string[] = [];

  // En-tête du rapport
  lignes.push(`RAPPORT STATISTIQUES — SANTÉGAB`);
  lignes.push(`Établissement,${esc(nomHopital)}`);
  lignes.push(`Période,Du ${debutFr} au ${finFr}`);
  lignes.push(`Généré le,${maintenant}`);
  lignes.push(``);

  // Résumé activité
  const facturesPayees = factures.filter((f) => f.statut === "PAYEE");
  const totalEncaisse = facturesPayees.reduce((s, f) => s + f.montant_patient, 0);
  const totalFacture = factures.reduce((s, f) => s + f.montant_total, 0);

  lignes.push(`=== RÉSUMÉ ACTIVITÉ ===`);
  lignes.push(`Indicateur,Valeur`);
  lignes.push(`Consultations,${consultations.length}`);
  lignes.push(`Examens laboratoire,${examensLabo.length}`);
  lignes.push(`Examens imagerie,${examensImagerie.length}`);
  lignes.push(`Hospitalisations,${hospitalisations.length}`);
  lignes.push(`Factures émises,${factures.length}`);
  lignes.push(`Factures payées,${facturesPayees.length}`);
  lignes.push(`Montant total facturé (XAF),${totalFacture}`);
  lignes.push(`Montant encaissé (XAF),${totalEncaisse}`);
  lignes.push(``);

  // Consultations
  lignes.push(`=== CONSULTATIONS (${consultations.length}) ===`);
  lignes.push(`Date,Patient,Médecin,Motif,Statut`);
  for (const c of consultations) {
    lignes.push(
      [
        c.created_at.toLocaleDateString("fr-FR"),
        esc(`${c.patient.prenom} ${c.patient.nom}`),
        esc(`Dr ${c.medecin.prenom} ${c.medecin.nom}`),
        esc(c.motif),
        c.statut,
      ].join(",")
    );
  }
  lignes.push(``);

  // Examens laboratoire
  lignes.push(`=== EXAMENS LABORATOIRE (${examensLabo.length}) ===`);
  lignes.push(`Date,Patient,Type,Urgence,Statut`);
  for (const e of examensLabo) {
    lignes.push(
      [
        e.created_at.toLocaleDateString("fr-FR"),
        esc(`${e.patient.prenom} ${e.patient.nom}`),
        e.type_examen,
        e.urgence ? "OUI" : "NON",
        e.statut,
      ].join(",")
    );
  }
  lignes.push(``);

  // Examens imagerie
  lignes.push(`=== EXAMENS IMAGERIE (${examensImagerie.length}) ===`);
  lignes.push(`Date,Patient,Type,Zone anatomique,Statut`);
  for (const e of examensImagerie) {
    lignes.push(
      [
        e.created_at.toLocaleDateString("fr-FR"),
        esc(`${e.patient.prenom} ${e.patient.nom}`),
        e.type_examen,
        esc(e.zone_anatomique),
        e.statut,
      ].join(",")
    );
  }
  lignes.push(``);

  // Hospitalisations
  lignes.push(`=== HOSPITALISATIONS (${hospitalisations.length}) ===`);
  lignes.push(`Date entrée,Patient,Chambre,Type chambre,Motif,Statut,Date sortie`);
  for (const h of hospitalisations) {
    lignes.push(
      [
        h.date_entree.toLocaleDateString("fr-FR"),
        esc(`${h.patient.prenom} ${h.patient.nom}`),
        esc(h.chambre?.numero),
        esc(h.chambre?.type_chambre),
        esc(h.motif_admission),
        h.statut,
        h.date_sortie ? h.date_sortie.toLocaleDateString("fr-FR") : "En cours",
      ].join(",")
    );
  }
  lignes.push(``);

  // Facturation
  lignes.push(`=== FACTURATION (${factures.length}) ===`);
  lignes.push(
    `Date,N° Facture,Patient,Montant total (XAF),Part assurance (XAF),Part patient (XAF),Statut`
  );
  for (const f of factures) {
    lignes.push(
      [
        f.created_at.toLocaleDateString("fr-FR"),
        f.numero_facture,
        esc(`${f.patient.prenom} ${f.patient.nom}`),
        f.montant_total,
        f.montant_assurance,
        f.montant_patient,
        f.statut,
      ].join(",")
    );
  }
  lignes.push(``);

  // État des stocks
  lignes.push(`=== ÉTAT DES STOCKS (${stock.length} articles actifs) ===`);
  lignes.push(`Article,Catégorie,Qté en stock,Unité,Seuil alerte,Prix unitaire (XAF),Statut`);
  for (const a of stock) {
    const statut =
      a.quantite_stock === 0
        ? "RUPTURE"
        : a.quantite_stock <= a.seuil_alerte
        ? "ALERTE"
        : "OK";
    lignes.push(
      [
        esc(a.nom),
        a.categorie,
        a.quantite_stock,
        esc(a.unite),
        a.seuil_alerte,
        a.prix_unitaire,
        statut,
      ].join(",")
    );
  }

  // BOM UTF-8 pour compatibilité Excel
  return "﻿" + lignes.join("\n");
}
