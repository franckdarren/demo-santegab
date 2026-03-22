"use server";

import { prisma } from "@/lib/prisma";
import { CategorieArticle, TypeMouvement } from "@/app/generated/prisma/client";
import { enregistrerAudit } from "@/lib/audit";

// ============================================================
// Liste des articles en stock
// ============================================================
export async function getArticlesStock(
  hospitalId: string,
  search?: string
) {
  return prisma.articleStock.findMany({
    where: {
      hospital_id: hospitalId,
      est_actif:   true,
      ...(search && {
        OR: [
          { nom:          { contains: search, mode: "insensitive" } },
          { description:  { contains: search, mode: "insensitive" } },
          { code_article: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      mouvements: {
        orderBy: { created_at: "desc" },
        take:    5,
      },
    },
    orderBy: { nom: "asc" },
  });
}

// ============================================================
// Stats pharmacie
// ============================================================
export async function getStatsPharmacieAction(hospitalId: string) {
  const articles = await prisma.articleStock.findMany({
    where: { hospital_id: hospitalId, est_actif: true },
  });

  const totalArticles    = articles.length;
  const articlesEnAlerte = articles.filter((a) => a.quantite_stock <= a.seuil_alerte).length;
  const articlesRupture  = articles.filter((a) => a.quantite_stock === 0).length;
  const valeurTotale     = articles.reduce((sum, a) => sum + a.quantite_stock * a.prix_unitaire, 0);

  return { totalArticles, articlesEnAlerte, articlesRupture, valeurTotale };
}

// ============================================================
// Créer un article
// ============================================================
export async function creerArticleStock(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    nom: string;
    categorie: CategorieArticle;
    description?: string;
    unite: string;
    quantite_stock: number;
    seuil_alerte: number;
    prix_unitaire: number;
    date_peremption?: string;
    code_article?: string;
  }
) {
  const article = await prisma.articleStock.create({
    data: {
      hospital_id:     hospitalId,
      nom:             data.nom,
      categorie:       data.categorie,
      description:     data.description ?? null,
      unite:           data.unite,
      quantite_stock:  data.quantite_stock,
      seuil_alerte:    data.seuil_alerte,
      prix_unitaire:   data.prix_unitaire,
      date_peremption: data.date_peremption ? new Date(data.date_peremption) : null,
      code_article:    data.code_article ?? null,
    },
  });

  // Enregistre le mouvement initial si stock > 0
  if (data.quantite_stock > 0) {
    await prisma.mouvementStock.create({
      data: {
        hospital_id:    hospitalId,
        article_id:     article.id,
        type_mouvement: "ENTREE",
        quantite:       data.quantite_stock,
        quantite_avant: 0,
        quantite_apres: data.quantite_stock,
        motif:          "Stock initial",
        utilisateur_id: utilisateurId,
      },
    });
  }

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "PHARMACIE",
    description: `Création article — ${data.nom} (stock initial : ${data.quantite_stock} ${data.unite}s)`,
    entiteId:    article.id,
    entiteNom:   data.nom,
    metadonnees: {
      categorie:      data.categorie,
      quantite_stock: data.quantite_stock,
      prix_unitaire:  data.prix_unitaire,
      seuil_alerte:   data.seuil_alerte,
    },
  });

  return article;
}

// ============================================================
// Mouvement de stock (entrée ou sortie)
// ============================================================
export async function enregistrerMouvement(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    article_id: string;
    type_mouvement: TypeMouvement;
    quantite: number;
    motif?: string;
  }
) {
  const article = await prisma.articleStock.findUnique({
    where: { id: data.article_id },
  });

  if (!article) throw new Error("Article introuvable");

  const quantiteAvant = article.quantite_stock;
  let quantiteApres: number;

  if (data.type_mouvement === "ENTREE") {
    quantiteApres = quantiteAvant + data.quantite;
  } else if (data.type_mouvement === "SORTIE") {
    if (data.quantite > quantiteAvant) {
      throw new Error("Stock insuffisant");
    }
    quantiteApres = quantiteAvant - data.quantite;
  } else {
    // AJUSTEMENT = nouvelle valeur absolue
    quantiteApres = data.quantite;
  }

  await prisma.$transaction([
    prisma.articleStock.update({
      where: { id: data.article_id },
      data:  { quantite_stock: quantiteApres },
    }),
    prisma.mouvementStock.create({
      data: {
        hospital_id:    hospitalId,
        article_id:     data.article_id,
        type_mouvement: data.type_mouvement,
        quantite:       data.quantite,
        quantite_avant: quantiteAvant,
        quantite_apres: quantiteApres,
        motif:          data.motif ?? null,
        utilisateur_id: utilisateurId,
      },
    }),
  ]);

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "STOCK",
    description: `Mouvement stock — ${data.type_mouvement} — ${article.nom} (${quantiteAvant} → ${quantiteApres} ${article.unite}s)${data.motif ? ` — ${data.motif}` : ""}`,
    entiteId:    data.article_id,
    entiteNom:   article.nom,
    metadonnees: {
      type_mouvement: data.type_mouvement,
      quantite:       data.quantite,
      quantite_avant: quantiteAvant,
      quantite_apres: quantiteApres,
      motif:          data.motif ?? null,
    },
  });
}

// ============================================================
// Historique des mouvements
// ============================================================
export async function getMouvementsStock(hospitalId: string) {
  return prisma.mouvementStock.findMany({
    where:   { hospital_id: hospitalId },
    include: { article: true },
    orderBy: { created_at: "desc" },
    take:    50,
  });
}

// ============================================================
// Modifier un article
// ============================================================
export async function modifierArticleStock(
  articleId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    nom: string;
    categorie: CategorieArticle;
    description?: string;
    unite: string;
    seuil_alerte: number;
    prix_unitaire: number;
    date_peremption?: string;
    code_article?: string;
  }
) {
  const article = await prisma.articleStock.update({
    where: { id: articleId, hospital_id: hospitalId },
    data: {
      nom:             data.nom,
      categorie:       data.categorie,
      description:     data.description ?? null,
      unite:           data.unite,
      seuil_alerte:    data.seuil_alerte,
      prix_unitaire:   data.prix_unitaire,
      date_peremption: data.date_peremption ? new Date(data.date_peremption) : null,
      code_article:    data.code_article ?? null,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "PHARMACIE",
    description: `Modification article — ${data.nom}`,
    entiteId:    articleId,
    entiteNom:   data.nom,
    metadonnees: {
      categorie:     data.categorie,
      prix_unitaire: data.prix_unitaire,
      seuil_alerte:  data.seuil_alerte,
    },
  });

  return article;
}

// ============================================================
// Supprimer un article (désactivation logique)
// On ne supprime pas physiquement — on désactive
// pour conserver l'historique des mouvements
// ============================================================
export async function supprimerArticleStock(
  articleId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  const article = await prisma.articleStock.update({
    where: { id: articleId, hospital_id: hospitalId },
    data:  { est_actif: false },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "SUPPRESSION",
    module:      "PHARMACIE",
    description: `Désactivation article — ${article.nom}`,
    entiteId:    articleId,
    entiteNom:   article.nom,
    metadonnees: {
      stock_restant: article.quantite_stock,
    },
  });

  return article;
}