// ============================================================
// ACTIONS HOSPITALISATION
// Toutes les requêtes filtrées par hospital_id (multi-tenant)
//
// Flux complet :
// Admission → Facture EN_ATTENTE créée immédiatement
// Médicament ajouté → Stock débité + ligne facture mise à jour
// Sortie patient → Facture finalisée
// Paiement → Écriture comptable RECETTE automatique
// ============================================================

"use server";

import { prisma } from "@/lib/prisma";
import { enregistrerAudit } from "@/lib/audit";
import {
  StatutHospitalisation,
  TypeLigneHospitalisation,
} from "@/app/generated/prisma/client";

// ============================================================
// Admettre un patient en hospitalisation
//
// Crée l'hospitalisation + une facture EN_ATTENTE immédiate.
// Si une chambre est sélectionnée, la première journée est
// ajoutée automatiquement comme première ligne de la facture.
// ============================================================
export async function admettrePatienten(
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    patient_id:       string;
    medecin_id:       string;
    chambre_id?:      string;
    motif_admission?: string;
  }
) {
  // Récupère la chambre et son tarif si sélectionnée
  const chambre = data.chambre_id
    ? await prisma.chambre.findUnique({ where: { id: data.chambre_id } })
    : null;

  // Récupère le patient + son taux d'assurance
  const patientHospital = await prisma.patientHospital.findFirst({
    where:   { patient_id: data.patient_id, hospital_id: hospitalId },
    include: { patient: true },
  });

  const nomPatient = patientHospital
    ? `${patientHospital.patient.prenom} ${patientHospital.patient.nom}`
    : "Patient inconnu";

  const tauxCouverture   = patientHospital?.taux_couverture ?? 0;
  const montantInitial   = chambre?.prix_journalier ?? 0;
  const montantAssurance = Math.round(montantInitial * (tauxCouverture / 100));
  const montantPatient   = montantInitial - montantAssurance;

  // Numéro de facture unique avec préfixe HOSPIT
  const count = await prisma.facture.count({ where: { hospital_id: hospitalId } });
  const numeroFacture = `FAC-HOSPIT-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  // Crée la facture EN_ATTENTE immédiatement
  const facture = await prisma.facture.create({
    data: {
      hospital_id:       hospitalId,
      patient_id:        data.patient_id,
      numero_facture:    numeroFacture,
      statut:            "EN_ATTENTE",
      montant_total:     montantInitial,
      montant_assurance: montantAssurance,
      montant_patient:   montantPatient,
      notes:             `Hospitalisation — ${data.motif_admission ?? "Admission"}`,
      lignes: chambre ? {
        create: [{
          description:   `Chambre ${chambre.numero} — ${chambre.type_chambre} (Jour 1)`,
          quantite:      1,
          prix_unitaire: chambre.prix_journalier,
          montant_total: chambre.prix_journalier,
        }],
      } : undefined,
    },
  });

  // Marque la chambre comme occupée
  if (data.chambre_id) {
    await prisma.chambre.update({
      where: { id: data.chambre_id },
      data:  { est_disponible: false },
    });
  }

  // Crée l'hospitalisation liée à la facture
  const hospitalisation = await prisma.hospitalisation.create({
    data: {
      hospital_id:     hospitalId,
      patient_id:      data.patient_id,
      medecin_id:      data.medecin_id,
      chambre_id:      data.chambre_id ?? null,
      motif_admission: data.motif_admission ?? null,
      statut:          "EN_COURS",
      facture_id:      facture.id,
      // Première ligne chambre J1
      lignes: chambre ? {
        create: [{
          type_ligne:    "CHAMBRE",
          statut:        "SERVI",
          description:   `Chambre ${chambre.numero} — ${chambre.type_chambre}`,
          quantite:      1,
          prix_unitaire: chambre.prix_journalier,
          montant_total: chambre.prix_journalier,
          prescrit_par:  utilisateurNom,
        }],
      } : undefined,
    },
    include: {
      patient: true,
      chambre: true,
      lignes:  true,
      facture: true,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "HOSPITALISATION",
    description: `Admission — ${nomPatient}${data.motif_admission ? ` — ${data.motif_admission}` : ""}${chambre ? ` — Chambre ${chambre.numero}` : ""}`,
    entiteId:    hospitalisation.id,
    entiteNom:   nomPatient,
    metadonnees: {
      chambre_numero:  chambre?.numero ?? null,
      prix_journalier: chambre?.prix_journalier ?? 0,
      facture_numero:  numeroFacture,
      taux_couverture: tauxCouverture,
    },
  });

  return hospitalisation;
}

// ============================================================
// Ajouter un médicament au séjour (bon de commande pharmacie)
//
// Vérifie la disponibilité en stock :
//   Disponible   → débit stock + ligne SERVI + facture MAJ
//   Indisponible → ligne EN_ATTENTE (pas de débit stock)
// ============================================================
export async function ajouterMedicamentHospitalisation(
  hospitalisationId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    article_stock_id: string;
    quantite:         number;
    prescrit_par:     string;
    notes?:           string;
  }
) {
  const hospitalisation = await prisma.hospitalisation.findUnique({
    where:   { id: hospitalisationId },
    include: { facture: true },
  });

  if (!hospitalisation) throw new Error("Hospitalisation introuvable");
  if (hospitalisation.statut !== "EN_COURS") {
    throw new Error("Impossible d'ajouter — hospitalisation terminée");
  }

  const article = await prisma.articleStock.findUnique({
    where: { id: data.article_stock_id },
  });
  if (!article) throw new Error("Article introuvable");

  const estDisponible = article.quantite_stock >= data.quantite;
  const montant       = article.prix_unitaire * data.quantite;

  // Crée la ligne d'hospitalisation
  const ligne = await prisma.ligneHospitalisation.create({
    data: {
      hospitalisation_id: hospitalisationId,
      type_ligne:         "MEDICAMENT",
      statut:             estDisponible ? "SERVI" : "EN_ATTENTE",
      description:        `${article.nom} — ${data.quantite} ${article.unite}(s)`,
      quantite:           data.quantite,
      prix_unitaire:      article.prix_unitaire,
      montant_total:      montant,
      article_stock_id:   data.article_stock_id,
      prescrit_par:       data.prescrit_par,
      notes:              data.notes ?? null,
    },
  });

  // Débit stock uniquement si disponible
  if (estDisponible) {
    await prisma.articleStock.update({
      where: { id: data.article_stock_id },
      data:  { quantite_stock: { decrement: data.quantite } },
    });

    await prisma.mouvementStock.create({
      data: {
        hospital_id:    hospitalId,
        article_id:     data.article_stock_id,
        type_mouvement: "SORTIE",
        quantite:       data.quantite,
        quantite_avant: article.quantite_stock,
        quantite_apres: article.quantite_stock - data.quantite,
        motif:          `Hospitalisation ${hospitalisationId}`,
        utilisateur_id: utilisateurId,
      },
    });

    // Recalcule et met à jour le total de la facture
    if (hospitalisation.facture_id) {
      await _recalculerFacture(
        hospitalisation.facture_id,
        hospitalisationId,
        hospitalId
      );
    }
  }

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "HOSPITALISATION",
    description: `Bon commande — ${article.nom} x${data.quantite} — ${estDisponible ? "SERVI" : "EN ATTENTE stock"}`,
    entiteId:    hospitalisationId,
    metadonnees: {
      article:        article.nom,
      quantite:       data.quantite,
      montant:        montant,
      est_disponible: estDisponible,
    },
  });

  return { ligne, estDisponible };
}

// ============================================================
// Ajouter un acte infirmier au séjour
// (pansement, injection, perfusion, soins...)
// ============================================================
export async function ajouterActeInfirmier(
  hospitalisationId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    description:   string;
    quantite:      number;
    prix_unitaire: number;
    notes?:        string;
  }
) {
  const hospitalisation = await prisma.hospitalisation.findUnique({
    where: { id: hospitalisationId },
  });

  if (!hospitalisation) throw new Error("Hospitalisation introuvable");
  if (hospitalisation.statut !== "EN_COURS") {
    throw new Error("Impossible d'ajouter — hospitalisation terminée");
  }

  const montant = data.prix_unitaire * data.quantite;

  const ligne = await prisma.ligneHospitalisation.create({
    data: {
      hospitalisation_id: hospitalisationId,
      type_ligne:         "ACTE_INFIRMIER",
      statut:             "SERVI",
      description:        data.description,
      quantite:           data.quantite,
      prix_unitaire:      data.prix_unitaire,
      montant_total:      montant,
      prescrit_par:       utilisateurNom,
      notes:              data.notes ?? null,
    },
  });

  if (hospitalisation.facture_id) {
    await _recalculerFacture(
      hospitalisation.facture_id,
      hospitalisationId,
      hospitalId
    );
  }

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "HOSPITALISATION",
    description: `Acte infirmier — ${data.description} x${data.quantite}`,
    entiteId:    hospitalisationId,
    metadonnees: { description: data.description, montant },
  });

  return ligne;
}

// ============================================================
// Ajouter une journée de chambre
//
// À appeler chaque jour manuellement ou via un bouton UI.
// Ajoute une ligne CHAMBRE et met à jour la facture.
// ============================================================
export async function ajouterJourneeChambre(
  hospitalisationId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  const hospitalisation = await prisma.hospitalisation.findUnique({
    where:   { id: hospitalisationId },
    include: { chambre: true, lignes: true },
  });

  if (!hospitalisation?.chambre) {
    throw new Error("Aucune chambre assignée à cette hospitalisation");
  }
  if (hospitalisation.statut !== "EN_COURS") return null;

  // Compte les journées déjà facturées
  const nbJours = hospitalisation.lignes.filter(
    (l) => l.type_ligne === "CHAMBRE"
  ).length + 1;

  const ligne = await prisma.ligneHospitalisation.create({
    data: {
      hospitalisation_id: hospitalisationId,
      type_ligne:         "CHAMBRE",
      statut:             "SERVI",
      description:        `Chambre ${hospitalisation.chambre.numero} — ${hospitalisation.chambre.type_chambre} (Jour ${nbJours})`,
      quantite:           1,
      prix_unitaire:      hospitalisation.chambre.prix_journalier,
      montant_total:      hospitalisation.chambre.prix_journalier,
      prescrit_par:       utilisateurNom,
    },
  });

  if (hospitalisation.facture_id) {
    await _recalculerFacture(
      hospitalisation.facture_id,
      hospitalisationId,
      hospitalId
    );
  }

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "CREATION",
    module:      "HOSPITALISATION",
    description: `Journée chambre ajoutée — Jour ${nbJours} — ${hospitalisation.chambre.numero}`,
    entiteId:    hospitalisationId,
    metadonnees: {
      jour:            nbJours,
      chambre:         hospitalisation.chambre.numero,
      prix_journalier: hospitalisation.chambre.prix_journalier,
    },
  });

  return ligne;
}

// ============================================================
// Clôturer une hospitalisation (sortie patient)
//
// Recalcule le total final, passe la facture en statut
// finalisé (reste EN_ATTENTE jusqu'au paiement),
// libère la chambre.
// ============================================================
export async function cloturerHospitalisation(
  hospitalisationId: string,
  hospitalId: string,
  utilisateurId: string,
  utilisateurNom: string,
  data: {
    diagnostic?: string;
    notes?:      string;
  }
) {
  const hospitalisation = await prisma.hospitalisation.findUnique({
    where:   { id: hospitalisationId },
    include: { patient: true, chambre: true, facture: true, lignes: true },
  });

  if (!hospitalisation) throw new Error("Hospitalisation introuvable");
  if (hospitalisation.statut !== "EN_COURS") {
    throw new Error("Cette hospitalisation est déjà clôturée");
  }

  // Recalcule le total final avant clôture
  if (hospitalisation.facture_id) {
    await _recalculerFacture(
      hospitalisation.facture_id,
      hospitalisationId,
      hospitalId
    );
  }

  // Passe en SORTIE
  const hospit = await prisma.hospitalisation.update({
    where: { id: hospitalisationId },
    data: {
      statut:      "SORTIE",
      date_sortie: new Date(),
      diagnostic:  data.diagnostic ?? null,
      notes:       data.notes ?? null,
    },
    include: { patient: true, facture: true },
  });

  // Libère la chambre
  if (hospitalisation.chambre_id) {
    await prisma.chambre.update({
      where: { id: hospitalisation.chambre_id },
      data:  { est_disponible: true },
    });
  }

  const nomPatient = `${hospitalisation.patient.prenom} ${hospitalisation.patient.nom}`;

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "HOSPITALISATION",
    description: `Sortie patient — ${nomPatient}`,
    entiteId:    hospitalisationId,
    entiteNom:   nomPatient,
    metadonnees: {
      date_sortie:    new Date().toISOString(),
      total_lignes:   hospitalisation.lignes.length,
      montant_total:  hospitalisation.facture?.montant_total ?? 0,
      facture_numero: hospitalisation.facture?.numero_facture,
    },
  });

  return hospit;
}

// ============================================================
// Payer une hospitalisation
// ============================================================
export async function payerHospitalisation(
  hospitalisationId: string,
  hospitalId: string,
  modePaiement: string,
  utilisateurId: string,
  utilisateurNom: string
) {
  const hospitalisation = await prisma.hospitalisation.findUnique({
    where:   { id: hospitalisationId },
    include: {
      patient: true,
      facture: { include: { lignes: true } },
    },
  });

  if (!hospitalisation?.facture) throw new Error("Facture introuvable");
  if (hospitalisation.statut !== "SORTIE") {
    throw new Error("Le patient doit être sorti avant le paiement");
  }

  // Valide que le mode de paiement est bien une valeur connue
  const modesValides = [
    "ESPECES",
    "CARTE_BANCAIRE",
    "MOBILE_MONEY",
    "ASSURANCE",
    "CHEQUE",
  ] as const;

  type ModePaiementType = typeof modesValides[number];

  const modeValide = modesValides.find((m) => m === modePaiement);
  if (!modeValide) {
    throw new Error(`Mode de paiement invalide : ${modePaiement}`);
  }

  // Passe la facture en PAYEE
  const facture = await prisma.facture.update({
    where: { id: hospitalisation.facture.id },
    data: {
      statut:        "PAYEE",
      mode_paiement: modeValide satisfies ModePaiementType,
      date_paiement: new Date(),
    },
  });

  const descriptionLignes = hospitalisation.facture.lignes
    .slice(0, 3)
    .map((l) => l.description)
    .join(", ");

  await prisma.ecritureComptable.create({
    data: {
      hospital_id:    hospitalId,
      utilisateur_id: utilisateurId,
      type_ecriture:  "RECETTE",
      libelle:        `Hospitalisation ${hospitalisation.facture.numero_facture} — ${hospitalisation.patient.prenom} ${hospitalisation.patient.nom}`,
      montant:        hospitalisation.facture.montant_patient,
      date_ecriture:  new Date(),
      reference:      hospitalisation.facture.numero_facture,
      facture_id:     hospitalisation.facture.id,
      notes:          descriptionLignes,
    },
  });

  await enregistrerAudit({
    hospitalId,
    utilisateurId,
    utilisateurNom,
    typeAction:  "MODIFICATION",
    module:      "FACTURATION",
    description: `Paiement hospitalisation ${hospitalisation.facture.numero_facture} — ${hospitalisation.patient.prenom} ${hospitalisation.patient.nom} — ${modeValide}`,
    entiteId:    hospitalisationId,
    metadonnees: {
      montant_patient:   hospitalisation.facture.montant_patient,
      montant_assurance: hospitalisation.facture.montant_assurance,
      mode_paiement:     modeValide,
      ecriture_generee:  true,
    },
  });

  return facture;
}

// ============================================================
// Récupérer les hospitalisations
// ============================================================
export async function getHospitalisations(
  hospitalId: string,
  statut?: StatutHospitalisation
) {
  return prisma.hospitalisation.findMany({
    where: {
      hospital_id: hospitalId,
      ...(statut && { statut }),
    },
    include: {
      patient: true,
      medecin: true,
      chambre: true,
      lignes:  true,
      facture: true,
    },
    orderBy: { created_at: "desc" },
  });
}

// ============================================================
// Récupérer une hospitalisation par ID
// ============================================================
export async function getHospitalisationById(
  hospitalisationId: string,
  hospitalId: string
) {
  return prisma.hospitalisation.findFirst({
    where: { id: hospitalisationId, hospital_id: hospitalId },
    include: {
      patient: true,
      medecin: true,
      chambre: true,
      facture: { include: { lignes: true } },
      lignes: {
        include: { article_stock: true },
        orderBy: { date_ligne: "asc" },
      },
    },
  });
}

// ============================================================
// Stats hospitalisations pour le dashboard
// ============================================================
export async function getStatsHospitalisations(hospitalId: string) {
  const [enCours, sorties, totalMois] = await Promise.all([
    prisma.hospitalisation.count({
      where: { hospital_id: hospitalId, statut: "EN_COURS" },
    }),
    prisma.hospitalisation.count({
      where: {
        hospital_id: hospitalId,
        statut:      "SORTIE",
        date_sortie: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.facture.aggregate({
      where: {
        hospital_id: hospitalId,
        statut:      "PAYEE",
        notes:       { contains: "Hospitalisation" },
        date_paiement: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { montant_patient: true },
    }),
  ]);

  // Nombre de chambres disponibles
  const chambresDisponibles = await prisma.chambre.count({
    where: { hospital_id: hospitalId, est_disponible: true },
  });

  return {
    enCours,
    sorties,
    totalMois:          totalMois._sum.montant_patient ?? 0,
    chambresDisponibles,
  };
}

// ============================================================
// Helper interne — Recalcule le total de la facture
//
// Somme uniquement les lignes SERVIES pour ne pas facturer
// ce qui n'a pas encore été délivré (EN_ATTENTE stock).
// ============================================================
async function _recalculerFacture(
  factureId: string,
  hospitalisationId: string,
  hospitalId: string
) {
  const lignes = await prisma.ligneHospitalisation.findMany({
    where: {
      hospitalisation_id: hospitalisationId,
      statut:             "SERVI",
    },
  });

  const montantTotal = lignes.reduce((sum, l) => sum + l.montant_total, 0);

  const patientHospital = await prisma.patientHospital.findFirst({
    where: {
      hospital_id: hospitalId,
      patient: {
        factures: { some: { id: factureId } },
      },
    },
  });

  const tauxCouverture   = patientHospital?.taux_couverture ?? 0;
  const montantAssurance = Math.round(montantTotal * (tauxCouverture / 100));
  const montantPatient   = montantTotal - montantAssurance;

  await prisma.facture.update({
    where: { id: factureId },
    data: {
      montant_total:     montantTotal,
      montant_assurance: montantAssurance,
      montant_patient:   montantPatient,
    },
  });
}