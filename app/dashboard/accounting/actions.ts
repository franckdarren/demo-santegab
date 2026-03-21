"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { TypeEcriture, CategorieDepense } from "@/app/generated/prisma/client";

// ============================================================
// Liste des écritures comptables
// ============================================================
export async function getEcritures(
  hospitalId: string,
  type?: TypeEcriture,
  mois?: Date
) {
  const debut = mois ? startOfMonth(mois) : startOfMonth(new Date());
  const fin = mois ? endOfMonth(mois) : endOfMonth(new Date());

  return prisma.ecritureComptable.findMany({
    where: {
      hospital_id: hospitalId,
      ...(type && { type_ecriture: type }),
      date_ecriture: { gte: debut, lte: fin },
    },
    orderBy: { date_ecriture: "desc" },
  });
}

// ============================================================
// Stats comptables du mois
// ============================================================
export async function getStatsComptables(hospitalId: string) {
  const aujourd_hui = new Date();
  const debutMois = startOfMonth(aujourd_hui);
  const finMois = endOfMonth(aujourd_hui);
  const debutAnnee = startOfYear(aujourd_hui);

  const [recettesMois, depensesMois, recettesAnnee, depensesAnnee] =
    await Promise.all([
      prisma.ecritureComptable.aggregate({
        where: {
          hospital_id: hospitalId,
          type_ecriture: "RECETTE",
          date_ecriture: { gte: debutMois, lte: finMois },
        },
        _sum: { montant: true },
        _count: true,
      }),
      prisma.ecritureComptable.aggregate({
        where: {
          hospital_id: hospitalId,
          type_ecriture: "DEPENSE",
          date_ecriture: { gte: debutMois, lte: finMois },
        },
        _sum: { montant: true },
        _count: true,
      }),
      prisma.ecritureComptable.aggregate({
        where: {
          hospital_id: hospitalId,
          type_ecriture: "RECETTE",
          date_ecriture: { gte: debutAnnee },
        },
        _sum: { montant: true },
      }),
      prisma.ecritureComptable.aggregate({
        where: {
          hospital_id: hospitalId,
          type_ecriture: "DEPENSE",
          date_ecriture: { gte: debutAnnee },
        },
        _sum: { montant: true },
      }),
    ]);

  const totalRecettesMois = recettesMois._sum.montant ?? 0;
  const totalDepensesMois = depensesMois._sum.montant ?? 0;
  const beneficeMois = totalRecettesMois - totalDepensesMois;

  return {
    recettesMois: totalRecettesMois,
    depensesMois: totalDepensesMois,
    beneficeMois,
    nombreRecettes: recettesMois._count,
    nombreDepenses: depensesMois._count,
    recettesAnnee: recettesAnnee._sum.montant ?? 0,
    depensesAnnee: depensesAnnee._sum.montant ?? 0,
    beneficeAnnee:
      (recettesAnnee._sum.montant ?? 0) - (depensesAnnee._sum.montant ?? 0),
  };
}

// ============================================================
// Évolution mensuelle sur 6 mois
// ============================================================
export async function getEvolutionMensuelle(hospitalId: string) {
  return Promise.all(
    Array.from({ length: 6 }, async (_, i) => {
      const mois = subMonths(new Date(), 5 - i);
      const debut = startOfMonth(mois);
      const fin = endOfMonth(mois);

      const [recettes, depenses] = await Promise.all([
        prisma.ecritureComptable.aggregate({
          where: {
            hospital_id: hospitalId,
            type_ecriture: "RECETTE",
            date_ecriture: { gte: debut, lte: fin },
          },
          _sum: { montant: true },
        }),
        prisma.ecritureComptable.aggregate({
          where: {
            hospital_id: hospitalId,
            type_ecriture: "DEPENSE",
            date_ecriture: { gte: debut, lte: fin },
          },
          _sum: { montant: true },
        }),
      ]);

      return {
        mois: mois.toLocaleDateString("fr-FR", { month: "short" }),
        recettes: recettes._sum.montant ?? 0,
        depenses: depenses._sum.montant ?? 0,
        benefice:
          (recettes._sum.montant ?? 0) - (depenses._sum.montant ?? 0),
      };
    })
  );
}

// ============================================================
// Répartition des dépenses par catégorie
// ============================================================
export async function getDepensesParCategorie(hospitalId: string) {
  const debutMois = startOfMonth(new Date());
  const finMois = endOfMonth(new Date());

  const depenses = await prisma.ecritureComptable.findMany({
    where: {
      hospital_id: hospitalId,
      type_ecriture: "DEPENSE",
      date_ecriture: { gte: debutMois, lte: finMois },
    },
  });

  const grouped: Record<string, number> = {};
  for (const d of depenses) {
    const cat = d.categorie ?? "AUTRE";
    grouped[cat] = (grouped[cat] ?? 0) + d.montant;
  }

  return Object.entries(grouped).map(([categorie, montant]) => ({
    categorie,
    montant,
  }));
}

// ============================================================
// Créer une écriture comptable (dépense manuelle)
// ============================================================
export async function creerEcriture(
  hospitalId: string,
  utilisateurId: string,
  data: {
    type_ecriture: TypeEcriture;
    libelle: string;
    montant: number;
    categorie?: CategorieDepense;
    reference?: string;
    notes?: string;
    date_ecriture?: string;
  }
) {
  return prisma.ecritureComptable.create({
    data: {
      hospital_id: hospitalId,
      utilisateur_id: utilisateurId,
      type_ecriture: data.type_ecriture,
      libelle: data.libelle,
      montant: data.montant,
      categorie: data.categorie ?? null,
      reference: data.reference ?? null,
      notes: data.notes ?? null,
      date_ecriture: data.date_ecriture
        ? new Date(data.date_ecriture)
        : new Date(),
    },
  });
}