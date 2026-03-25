// ============================================================
// SEED — Données de démo SANTÉGAB v2
//
// Génère des données cohérentes et complètes :
//   - 1 hôpital (Clinique El Rapha, Libreville)
//   - 7 utilisateurs (admin, 2 médecins, infirmier, comptable,
//                     laborantin, pharmacien)
//   - 10 patients gabonais avec assurances
//   - 8 consultations + prescriptions + factures
//   - 4 examens labo + factures liées
//   - 4 examens imagerie + factures liées
//   - 10 articles en stock + mouvements
//   - Écritures comptables (recettes paiements + dépenses)
// ============================================================

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ============================================================
// TARIFS DE RÉFÉRENCE (cohérents avec lib/tarifs.ts)
// ============================================================
const TARIFS_LABO: Record<string, number> = {
  BILAN_SANGUIN:  15000,
  BILAN_URINAIRE: 10000,
  BACTERIOLOGIE:  25000,
  PARASITOLOGIE:  20000,
  SEROLOGIE:      30000,
  BIOCHIMIE:      35000,
  HEMATOLOGIE:    20000,
  AUTRE:          15000,
};

const TARIFS_IMAGERIE: Record<string, number> = {
  RADIOGRAPHIE: 30000,
  ECHOGRAPHIE:  45000,
  SCANNER:      150000,
  IRM:          250000,
  MAMMOGRAPHIE: 60000,
  AUTRE:        35000,
};

const TARIF_CONSULTATION = 10000;

async function main() {
  console.log("🌱 Démarrage du seed SANTÉGAB v2...");

  // ----------------------------------------------------------
  // 1. NETTOYAGE COMPLET — ordre respectant les FK
  // ----------------------------------------------------------
  await prisma.auditTrail.deleteMany();
  await prisma.auditLogCarnet.deleteMany();
  await prisma.qrToken.deleteMany();
  await prisma.ecritureComptable.deleteMany();
  await prisma.mouvementStock.deleteMany();
  await prisma.articleStock.deleteMany();
  await prisma.examenLabo.deleteMany();
  await prisma.examenImagerie.deleteMany();
  await prisma.ligneFacture.deleteMany();
  await prisma.facture.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.patientHospital.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.hospital.deleteMany();

  console.log("🗑️  Base de données vidée");

  // ----------------------------------------------------------
  // 2. HÔPITAL
  // ----------------------------------------------------------
  const hospital = await prisma.hospital.create({
    data: {
      id:        "11111111-1111-1111-1111-111111111111",
      nom:       "Clinique El Rapha",
      adresse:   "Boulevard Triomphal Omar Bongo, BP 2234",
      ville:     "Libreville",
      telephone: "+241 01 72 34 56",
      email:     "contact@elrapha.ga",
      est_actif: true,
    },
  });
  console.log(`🏥 Hôpital créé : ${hospital.nom}`);

  // ----------------------------------------------------------
  // 3. UTILISATEURS — 7 profils complets
  // ----------------------------------------------------------
  const [
    admin,
    medecin1,
    medecin2,
    infirmier,
    comptable,
    laborantin,
    pharmacien,
  ] = await Promise.all([
    prisma.utilisateur.create({
      data: {
        hospital_id: hospital.id,
        nom:         "ONDO",
        prenom:      "Marie-Claire",
        email:       "admin@elrapha.ga",
        role:        "ADMIN",
        telephone:   "+241 07 11 22 33",
        est_actif:   true,
      },
    }),
    prisma.utilisateur.create({
      data: {
        hospital_id: hospital.id,
        nom:         "NGUEMA",
        prenom:      "Pierre",
        email:       "p.nguema@elrapha.ga",
        role:        "MEDECIN",
        telephone:   "+241 07 44 55 66",
        est_actif:   true,
      },
    }),
    prisma.utilisateur.create({
      data: {
        hospital_id: hospital.id,
        nom:         "MBAGOU",
        prenom:      "Sandrine",
        email:       "s.mba@elrapha.ga",
        role:        "MEDECIN",
        telephone:   "+241 07 77 88 99",
        est_actif:   true,
      },
    }),
    prisma.utilisateur.create({
      data: {
        hospital_id: hospital.id,
        nom:         "OBAME",
        prenom:      "Jean-Paul",
        email:       "jp.obame@elrapha.ga",
        role:        "INFIRMIER",
        telephone:   "+241 06 12 34 56",
        est_actif:   true,
      },
    }),
    prisma.utilisateur.create({
      data: {
        hospital_id: hospital.id,
        nom:         "ELLA",
        prenom:      "Christelle",
        email:       "c.ella@elrapha.ga",
        role:        "COMPTABLE",
        telephone:   "+241 06 98 76 54",
        est_actif:   true,
      },
    }),
    prisma.utilisateur.create({
      data: {
        hospital_id: hospital.id,
        nom:         "BOUROBOU",
        prenom:      "Brice",
        email:       "b.bourobou@elrapha.ga",
        role:        "LABORANTIN",
        telephone:   "+241 06 11 22 44",
        est_actif:   true,
      },
    }),
    prisma.utilisateur.create({
      data: {
        hospital_id: hospital.id,
        nom:         "MOUSSAVOU",
        prenom:      "Franck",
        email:       "f.moussavou@elrapha.ga",
        role:        "PHARMACIEN",
        telephone:   "+241 06 55 66 77",
        est_actif:   true,
      },
    }),
  ]);
  console.log("👥 7 utilisateurs créés");

  // ----------------------------------------------------------
  // 4. PATIENTS — 10 profils gabonais réalistes
  // ----------------------------------------------------------
  const patientsData = [
    {
      numero:     "PAT-2025-00001",
      nom:        "NZIGOU",
      prenom:     "Alphonse",
      sexe:       "MASCULIN" as const,
      naissance:  new Date("1978-03-15"),
      telephone:  "+241 07 23 45 67",
      groupe:     "A+",
      assurance:  "CNAMGS",
      taux:       80,
      allergies:  "Pénicilline",
      antecedents: "Gastrite chronique diagnostiquée en 2020",
    },
    {
      numero:     "PAT-2025-00002",
      nom:        "MOUSSAVOU",
      prenom:     "Estelle",
      sexe:       "FEMININ" as const,
      naissance:  new Date("1990-07-22"),
      telephone:  "+241 06 34 56 78",
      groupe:     "O+",
      assurance:  "ASCOMA",
      taux:       70,
      allergies:  null,
      antecedents: null,
    },
    {
      numero:     "PAT-2025-00003",
      nom:        "BOUROBOU",
      prenom:     "Gaston",
      sexe:       "MASCULIN" as const,
      naissance:  new Date("1965-11-08"),
      telephone:  "+241 07 45 67 89",
      groupe:     "B+",
      assurance:  "CNAMGS",
      taux:       80,
      allergies:  "Aspirine",
      antecedents: "Hypertension artérielle depuis 2015",
    },
    {
      numero:     "PAT-2025-00004",
      nom:        "MBOUMBA",
      prenom:     "Sylvie",
      sexe:       "FEMININ" as const,
      naissance:  new Date("1985-04-30"),
      telephone:  "+241 06 56 78 90",
      groupe:     "AB+",
      assurance:  "AXA",
      taux:       90,
      allergies:  null,
      antecedents: null,
    },
    {
      numero:     "PAT-2025-00005",
      nom:        "NKOGHE",
      prenom:     "Rodrigue",
      sexe:       "MASCULIN" as const,
      naissance:  new Date("1995-01-12"),
      telephone:  "+241 07 67 89 01",
      groupe:     "A-",
      assurance:  null,
      taux:       0,
      allergies:  null,
      antecedents: null,
    },
    {
      numero:     "PAT-2025-00006",
      nom:        "OVONO",
      prenom:     "Nadège",
      sexe:       "FEMININ" as const,
      naissance:  new Date("1982-09-18"),
      telephone:  "+241 06 78 90 12",
      groupe:     "O-",
      assurance:  "OGAR",
      taux:       75,
      allergies:  "Latex",
      antecedents: "Allergie cutanée diagnostiquée en 2018",
    },
    {
      numero:     "PAT-2025-00007",
      nom:        "MOUNGUENGUI",
      prenom:     "Patrick",
      sexe:       "MASCULIN" as const,
      naissance:  new Date("1970-06-25"),
      telephone:  "+241 07 89 01 23",
      groupe:     "B-",
      assurance:  "CNAMGS",
      taux:       80,
      allergies:  null,
      antecedents: "Diabète type 2 depuis 2019",
    },
    {
      numero:     "PAT-2025-00008",
      nom:        "KOUMBA",
      prenom:     "Félicité",
      sexe:       "FEMININ" as const,
      naissance:  new Date("1998-12-03"),
      telephone:  "+241 06 90 12 34",
      groupe:     "A+",
      assurance:  "Sunu",
      taux:       60,
      allergies:  null,
      antecedents: null,
    },
    {
      numero:     "PAT-2025-00009",
      nom:        "NDONG",
      prenom:     "Emmanuel",
      sexe:       "MASCULIN" as const,
      naissance:  new Date("1955-08-14"),
      telephone:  "+241 07 01 23 45",
      groupe:     "O+",
      assurance:  "ASCOMA",
      taux:       70,
      allergies:  "Morphine",
      antecedents: "Diabète type 2, HTA, cardiopathie ischémique",
    },
    {
      numero:     "PAT-2025-00010",
      nom:        "BEKALE",
      prenom:     "Lucie",
      sexe:       "FEMININ" as const,
      naissance:  new Date("2001-02-28"),
      telephone:  "+241 06 12 34 50",
      groupe:     "AB-",
      assurance:  "CNAMGS",
      taux:       80,
      allergies:  null,
      antecedents: null,
    },
  ];

  const patients = await Promise.all(
    patientsData.map((p) =>
      prisma.patient.create({
        data: {
          numero_dossier: p.numero,
          nom:            p.nom,
          prenom:         p.prenom,
          sexe:           p.sexe,
          date_naissance: p.naissance,
          telephone:      p.telephone,
          groupe_sanguin: p.groupe,
          allergies:      p.allergies,
          antecedents:    p.antecedents,
          hospitalisations: {
            create: {
              hospital_id:     hospital.id,
              assurance_nom:   p.assurance,
              taux_couverture: p.taux,
            },
          },
        },
      })
    )
  );
  console.log("🧑‍⚕️ 10 patients créés");

  // ----------------------------------------------------------
  // 5. CONSULTATIONS + PRESCRIPTIONS + FACTURES
  //
  // Chaque consultation génère une facture.
  // Les consultations PAYEE génèrent aussi une écriture
  // comptable de type RECETTE — cohérence comptable totale.
  // ----------------------------------------------------------
  const consultationsData = [
    {
      patient:     patients[0],
      medecin:     medecin1,
      statut:      "TERMINEE" as const,
      motif:       "Douleurs abdominales persistantes",
      diagnostic:  "Gastrite chronique",
      tension:     "13/8",
      poids:       78,
      taille:      175,
      temperature: 37.2,
      date:        new Date("2025-03-10T09:00:00"),
      prescriptions: [
        { medicament: "Oméprazole 20mg",  dosage: "1 gélule",  frequence: "Matin à jeun",            duree: "30 jours" },
        { medicament: "Gaviscon",          dosage: "1 sachet",  frequence: "Après chaque repas",       duree: "15 jours" },
      ],
      statutFacture: "PAYEE" as const,
      modePaiement:  "ASSURANCE" as const,
    },
    {
      patient:     patients[1],
      medecin:     medecin2,
      statut:      "TERMINEE" as const,
      motif:       "Fièvre et maux de tête",
      diagnostic:  "Paludisme simple",
      tension:     "11/7",
      poids:       62,
      taille:      165,
      temperature: 38.9,
      date:        new Date("2025-03-11T10:30:00"),
      prescriptions: [
        { medicament: "Artémether/Luméfantrine", dosage: "4 comprimés", frequence: "2 fois par jour",         duree: "3 jours" },
        { medicament: "Paracétamol 1000mg",       dosage: "1 comprimé",  frequence: "Toutes les 6h si fièvre", duree: "3 jours" },
      ],
      statutFacture: "PAYEE" as const,
      modePaiement:  "ESPECES" as const,
    },
    {
      patient:     patients[2],
      medecin:     medecin1,
      statut:      "TERMINEE" as const,
      motif:       "Contrôle tension artérielle",
      diagnostic:  "Hypertension artérielle stade 2",
      tension:     "16/10",
      poids:       92,
      taille:      178,
      temperature: 36.8,
      date:        new Date("2025-03-12T08:00:00"),
      prescriptions: [
        { medicament: "Amlodipine 5mg",   dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" },
        { medicament: "Périndopril 4mg",  dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" },
      ],
      statutFacture: "PAYEE" as const,
      modePaiement:  "ASSURANCE" as const,
    },
    {
      patient:     patients[3],
      medecin:     medecin2,
      statut:      "TERMINEE" as const,
      motif:       "Consultation prénatale",
      diagnostic:  "Grossesse 24 semaines — évolution normale",
      tension:     "12/7",
      poids:       71,
      taille:      162,
      temperature: 37.0,
      date:        new Date("2025-03-13T11:00:00"),
      prescriptions: [
        { medicament: "Fer + Acide folique", dosage: "1 comprimé", frequence: "1 fois par jour", duree: "60 jours" },
        { medicament: "Calcium 500mg",        dosage: "1 comprimé", frequence: "Le soir",          duree: "60 jours" },
      ],
      statutFacture: "PAYEE" as const,
      modePaiement:  "ASSURANCE" as const,
    },
    {
      patient:     patients[4],
      medecin:     medecin1,
      statut:      "EN_ATTENTE" as const,
      motif:       "Douleur genou droit",
      diagnostic:  null,
      tension:     "12/8",
      poids:       75,
      taille:      180,
      temperature: 36.9,
      date:        new Date("2025-03-14T14:00:00"),
      prescriptions:  [],
      statutFacture: "EN_ATTENTE" as const,
      modePaiement:  null,
    },
    {
      patient:     patients[5],
      medecin:     medecin2,
      statut:      "TERMINEE" as const,
      motif:       "Éruption cutanée",
      diagnostic:  "Dermatite allergique",
      tension:     "11/7",
      poids:       58,
      taille:      160,
      temperature: 37.1,
      date:        new Date("2025-03-14T09:30:00"),
      prescriptions: [
        { medicament: "Cétirizine 10mg",       dosage: "1 comprimé",       frequence: "Le soir",            duree: "7 jours"  },
        { medicament: "Bétaméthasone crème",   dosage: "Application locale", frequence: "2 fois par jour",  duree: "10 jours" },
      ],
      statutFacture: "PAYEE" as const,
      modePaiement:  "MOBILE_MONEY" as const,
    },
    {
      patient:     patients[6],
      medecin:     medecin1,
      statut:      "TERMINEE" as const,
      motif:       "Diabète — suivi mensuel",
      diagnostic:  "Diabète type 2 — glycémie mal contrôlée",
      tension:     "14/9",
      poids:       88,
      taille:      172,
      temperature: 37.0,
      date:        new Date("2025-03-15T08:30:00"),
      prescriptions: [
        { medicament: "Metformine 850mg",  dosage: "1 comprimé", frequence: "Matin et soir au repas", duree: "30 jours" },
        { medicament: "Glibenclamide 5mg", dosage: "1 comprimé", frequence: "Le matin",               duree: "30 jours" },
      ],
      statutFacture: "PAYEE" as const,
      modePaiement:  "ASSURANCE" as const,
    },
    {
      patient:     patients[9],
      medecin:     medecin2,
      statut:      "EN_COURS" as const,
      motif:       "Toux persistante depuis 2 semaines",
      diagnostic:  "Bronchite aiguë",
      tension:     "11/7",
      poids:       55,
      taille:      163,
      temperature: 38.2,
      date:        new Date("2025-03-15T10:00:00"),
      prescriptions: [
        { medicament: "Amoxicilline 500mg", dosage: "1 gélule",  frequence: "3 fois par jour", duree: "7 jours" },
        { medicament: "Bromhexine sirop",   dosage: "2 cuillères", frequence: "3 fois par jour", duree: "7 jours" },
      ],
      statutFacture: "EN_ATTENTE" as const,
      modePaiement:  null,
    },
  ];

  let factureCount = 0;

  for (const c of consultationsData) {
    const patientHospital = await prisma.patientHospital.findFirst({
      where: { patient_id: c.patient.id, hospital_id: hospital.id },
    });

    const tauxCouverture   = patientHospital?.taux_couverture ?? 0;
    const montantAssurance = Math.round(TARIF_CONSULTATION * (tauxCouverture / 100));
    const montantPatient   = TARIF_CONSULTATION - montantAssurance;

    // Crée la consultation
    const consultation = await prisma.consultation.create({
      data: {
        hospital_id:       hospital.id,
        patient_id:        c.patient.id,
        medecin_id:        c.medecin.id,
        statut:            c.statut,
        motif:             c.motif,
        diagnostic:        c.diagnostic,
        tension:           c.tension,
        poids_kg:          c.poids,
        taille_cm:         c.taille,
        temperature:       c.temperature,
        date_consultation: c.date,
        prescriptions: {
          create: c.prescriptions,
        },
      },
    });

    // Génère la facture pour toutes les consultations
    factureCount++;
    const numeroFacture = `FAC-${new Date().getFullYear()}-${String(factureCount).padStart(5, "0")}`;

    const facture = await prisma.facture.create({
      data: {
        hospital_id:       hospital.id,
        patient_id:        c.patient.id,
        consultation_id:   consultation.id,
        numero_facture:    numeroFacture,
        statut:            c.statutFacture,
        montant_total:     TARIF_CONSULTATION,
        montant_assurance: montantAssurance,
        montant_patient:   montantPatient,
        mode_paiement:     c.modePaiement,
        date_paiement:     c.statutFacture === "PAYEE" ? c.date : null,
        notes:             `Consultation — ${c.motif ?? "Consultation médicale"}`,
        lignes: {
          create: [{
            description:   `Consultation médicale — Dr. ${c.medecin.nom}`,
            quantite:      1,
            prix_unitaire: TARIF_CONSULTATION,
            montant_total: TARIF_CONSULTATION,
          }],
        },
      },
    });

    // Écriture comptable pour chaque facture PAYEE
    if (c.statutFacture === "PAYEE") {
      await prisma.ecritureComptable.create({
        data: {
          hospital_id:    hospital.id,
          utilisateur_id: admin.id,
          type_ecriture:  "RECETTE",
          libelle:        `Paiement ${numeroFacture} — ${c.patient.prenom} ${c.patient.nom}`,
          montant:        montantPatient,
          date_ecriture:  c.date,
          reference:      numeroFacture,
          facture_id:     facture.id,
          notes:          `Consultation — ${c.motif}`,
        },
      });
    }
  }
  console.log("📋 8 consultations + factures + écritures créées");

  // ----------------------------------------------------------
  // 6. EXAMENS LABO + FACTURES + ÉCRITURES
  // ----------------------------------------------------------
  const examensLaboData = [
    {
      patient:     patients[0],
      medecin:     medecin1,
      type:        "BILAN_SANGUIN" as const,
      statut:      "VALIDE" as const,
      urgence:     false,
      notes:       "Bilan de contrôle post-traitement gastrite",
      resultats:   "Hémoglobine : 13.5 g/dL (N: 13-17)\nGlobules blancs : 7200/mm³\nPlaquettes : 285000/mm³\nConclusion : Résultats dans les normes",
      valide_le:   new Date("2025-03-10T14:00:00"),
      date:        new Date("2025-03-10T10:00:00"),
      statutFacture: "PAYEE" as const,
    },
    {
      patient:     patients[1],
      medecin:     medecin2,
      type:        "PARASITOLOGIE" as const,
      statut:      "VALIDE" as const,
      urgence:     true,
      notes:       "Suspicion paludisme — fièvre 38.9°C",
      resultats:   "Goutte épaisse : Plasmodium falciparum +\nParasitémie : 0.8%\nConclusion : Paludisme simple confirmé",
      valide_le:   new Date("2025-03-11T12:00:00"),
      date:        new Date("2025-03-11T08:00:00"),
      statutFacture: "PAYEE" as const,
    },
    {
      patient:     patients[6],
      medecin:     medecin1,
      type:        "BIOCHIMIE" as const,
      statut:      "VALIDE" as const,
      urgence:     false,
      notes:       "Contrôle glycémie diabète type 2",
      resultats:   "Glycémie à jeun : 1.85 g/L (N: 0.70-1.10)\nHbA1c : 8.2% (N: <6.5%)\nConclusion : Diabète mal équilibré — ajustement traitement nécessaire",
      valide_le:   new Date("2025-03-15T11:00:00"),
      date:        new Date("2025-03-15T07:00:00"),
      statutFacture: "PAYEE" as const,
    },
    {
      patient:     patients[7],
      medecin:     medecin2,
      type:        "BILAN_URINAIRE" as const,
      statut:      "RESULTAT_SAISI" as const,
      urgence:     false,
      notes:       "Suspicion infection urinaire",
      resultats:   "Leucocytes : +++ (N: absent)\nNitrites : positif\nBactéries : présentes\nConclusion : Infection urinaire bactérienne — antibiogramme recommandé",
      valide_le:   null,
      date:        new Date("2025-03-16T09:00:00"),
      statutFacture: "EN_ATTENTE" as const,
    },
  ];

  for (const e of examensLaboData) {
    const tarifExamen = TARIFS_LABO[e.type] ?? 15000;

    const patientHospital = await prisma.patientHospital.findFirst({
      where: { patient_id: e.patient.id, hospital_id: hospital.id },
    });
    const tauxCouverture   = patientHospital?.taux_couverture ?? 0;
    const montantAssurance = Math.round(tarifExamen * (tauxCouverture / 100));
    const montantPatient   = tarifExamen - montantAssurance;

    factureCount++;
    const numeroFacture = `FAC-LABO-${new Date().getFullYear()}-${String(factureCount).padStart(5, "0")}`;

    // Crée la facture
    const facture = await prisma.facture.create({
      data: {
        hospital_id:       hospital.id,
        patient_id:        e.patient.id,
        numero_facture:    numeroFacture,
        statut:            e.statutFacture,
        montant_total:     tarifExamen,
        montant_assurance: montantAssurance,
        montant_patient:   montantPatient,
        mode_paiement:     e.statutFacture === "PAYEE" ? "ESPECES" : null,
        date_paiement:     e.statutFacture === "PAYEE" ? e.date : null,
        notes:             `Examen laboratoire — ${e.type}`,
        lignes: {
          create: [{
            description:   `Examen labo — ${e.type}`,
            quantite:      1,
            prix_unitaire: tarifExamen,
            montant_total: tarifExamen,
          }],
        },
      },
    });

    // Crée l'examen lié à la facture
    await prisma.examenLabo.create({
      data: {
        hospital_id:   hospital.id,
        patient_id:    e.patient.id,
        medecin_id:    e.medecin.id,
        type_examen:   e.type,
        statut:        e.statut,
        urgence:       e.urgence,
        notes:         e.notes,
        resultats:     e.resultats,
        valide_par:    e.valide_le ? laborantin.id : null,
        valide_le:     e.valide_le,
        prix_unitaire: tarifExamen,
        facture_id:    facture.id,
        created_at:    e.date,
      },
    });

    // Écriture comptable si payé
    if (e.statutFacture === "PAYEE") {
      await prisma.ecritureComptable.create({
        data: {
          hospital_id:    hospital.id,
          utilisateur_id: admin.id,
          type_ecriture:  "RECETTE",
          libelle:        `Paiement ${numeroFacture} — ${e.patient.prenom} ${e.patient.nom}`,
          montant:        montantPatient,
          date_ecriture:  e.date,
          reference:      numeroFacture,
          facture_id:     facture.id,
          notes:          `Examen labo — ${e.type}`,
        },
      });
    }
  }
  console.log("🔬 4 examens labo + factures + écritures créés");

  // ----------------------------------------------------------
  // 7. EXAMENS IMAGERIE + FACTURES + ÉCRITURES
  // ----------------------------------------------------------
  const examensImagerieData = [
    {
      patient:        patients[2],
      medecin:        medecin1,
      type:           "RADIOGRAPHIE" as const,
      zone_anatomique: "Thorax",
      statut:         "VALIDE" as const,
      urgence:        false,
      notes:          "Contrôle cardio-pulmonaire HTA",
      resultats:      "Radiographie du thorax de face :\n- Silhouette cardiaque normale\n- Parenchyme pulmonaire sans opacité\n- Pas d'épanchement pleural\nConclusion : Normal",
      valide_le:      new Date("2025-03-12T15:00:00"),
      date:           new Date("2025-03-12T10:00:00"),
      statutFacture:  "PAYEE" as const,
    },
    {
      patient:        patients[3],
      medecin:        medecin2,
      type:           "ECHOGRAPHIE" as const,
      zone_anatomique: "Abdomen",
      statut:         "VALIDE" as const,
      urgence:        false,
      notes:          "Échographie obstétricale — grossesse 24 SA",
      resultats:      "Échographie obstétricale :\n- Fœtus unique en présentation céphalique\n- Biométrie cohérente avec 24 SA\n- Placenta antérieur grade I\n- Liquide amniotique normal\nConclusion : Grossesse évoluant normalement",
      valide_le:      new Date("2025-03-13T14:00:00"),
      date:           new Date("2025-03-13T11:00:00"),
      statutFacture:  "PAYEE" as const,
    },
    {
      patient:        patients[8],
      medecin:        medecin1,
      type:           "SCANNER" as const,
      zone_anatomique: "Crâne",
      statut:         "RESULTAT_SAISI" as const,
      urgence:        true,
      notes:          "Céphalées intenses — patient diabétique hypertendu",
      resultats:      "Scanner cérébral sans injection :\n- Pas d'hémorragie intracrânienne\n- Pas de lésion ischémique aiguë\n- Atrophie corticale modérée\nConclusion : Pas d'urgence neurochirurgicale",
      valide_le:      null,
      date:           new Date("2025-03-16T08:00:00"),
      statutFacture:  "EN_ATTENTE" as const,
    },
    {
      patient:        patients[9],
      medecin:        medecin2,
      type:           "RADIOGRAPHIE" as const,
      zone_anatomique: "Thorax",
      statut:         "EN_ATTENTE" as const,
      urgence:        false,
      notes:          "Toux persistante — suspicion bronchite",
      resultats:      null,
      valide_le:      null,
      date:           new Date("2025-03-15T11:00:00"),
      statutFacture:  "EN_ATTENTE" as const,
    },
  ];

  for (const e of examensImagerieData) {
    const tarifExamen = TARIFS_IMAGERIE[e.type] ?? 35000;

    const patientHospital = await prisma.patientHospital.findFirst({
      where: { patient_id: e.patient.id, hospital_id: hospital.id },
    });
    const tauxCouverture   = patientHospital?.taux_couverture ?? 0;
    const montantAssurance = Math.round(tarifExamen * (tauxCouverture / 100));
    const montantPatient   = tarifExamen - montantAssurance;

    factureCount++;
    const numeroFacture = `FAC-IMG-${new Date().getFullYear()}-${String(factureCount).padStart(5, "0")}`;

    const facture = await prisma.facture.create({
      data: {
        hospital_id:       hospital.id,
        patient_id:        e.patient.id,
        numero_facture:    numeroFacture,
        statut:            e.statutFacture,
        montant_total:     tarifExamen,
        montant_assurance: montantAssurance,
        montant_patient:   montantPatient,
        mode_paiement:     e.statutFacture === "PAYEE" ? "ASSURANCE" : null,
        date_paiement:     e.statutFacture === "PAYEE" ? e.date : null,
        notes:             `Imagerie — ${e.type}${e.zone_anatomique ? ` (${e.zone_anatomique})` : ""}`,
        lignes: {
          create: [{
            description:   `Imagerie — ${e.type}${e.zone_anatomique ? ` (${e.zone_anatomique})` : ""}`,
            quantite:      1,
            prix_unitaire: tarifExamen,
            montant_total: tarifExamen,
          }],
        },
      },
    });

    await prisma.examenImagerie.create({
      data: {
        hospital_id:     hospital.id,
        patient_id:      e.patient.id,
        medecin_id:      e.medecin.id,
        type_examen:     e.type,
        zone_anatomique: e.zone_anatomique,
        statut:          e.statut,
        urgence:         e.urgence,
        notes:           e.notes,
        resultats:       e.resultats,
        valide_par:      e.valide_le ? laborantin.id : null,
        valide_le:       e.valide_le,
        prix_unitaire:   tarifExamen,
        facture_id:      facture.id,
        created_at:      e.date,
      },
    });

    if (e.statutFacture === "PAYEE") {
      await prisma.ecritureComptable.create({
        data: {
          hospital_id:    hospital.id,
          utilisateur_id: admin.id,
          type_ecriture:  "RECETTE",
          libelle:        `Paiement ${numeroFacture} — ${e.patient.prenom} ${e.patient.nom}`,
          montant:        montantPatient,
          date_ecriture:  e.date,
          reference:      numeroFacture,
          facture_id:     facture.id,
          notes:          `Imagerie — ${e.type}${e.zone_anatomique ? ` (${e.zone_anatomique})` : ""}`,
        },
      });
    }
  }
  console.log("🩻 4 examens imagerie + factures + écritures créés");

  // ----------------------------------------------------------
  // 8. STOCK PHARMACIE — 10 articles + mouvements
  // ----------------------------------------------------------
  const articlesData = [
    { nom: "Paracétamol 500mg",          categorie: "MEDICAMENT" as const, unite: "comprimé", stock: 500, seuil: 50,  prix: 150,   code: "MED-001" },
    { nom: "Amoxicilline 500mg",          categorie: "MEDICAMENT" as const, unite: "gélule",   stock: 200, seuil: 30,  prix: 350,   code: "MED-002" },
    { nom: "Artémether/Luméfantrine",     categorie: "MEDICAMENT" as const, unite: "comprimé", stock: 150, seuil: 20,  prix: 800,   code: "MED-003" },
    { nom: "Oméprazole 20mg",             categorie: "MEDICAMENT" as const, unite: "gélule",   stock: 300, seuil: 40,  prix: 250,   code: "MED-004" },
    { nom: "Metformine 850mg",            categorie: "MEDICAMENT" as const, unite: "comprimé", stock: 400, seuil: 50,  prix: 200,   code: "MED-005" },
    { nom: "Amlodipine 5mg",             categorie: "MEDICAMENT" as const, unite: "comprimé", stock: 8,   seuil: 30,  prix: 300,   code: "MED-006" }, // ← en alerte
    { nom: "Sérum physiologique 500ml",  categorie: "CONSOMMABLE" as const, unite: "flacon",   stock: 60,  seuil: 10,  prix: 2500,  code: "CON-001" },
    { nom: "Gants stériles",             categorie: "CONSOMMABLE" as const, unite: "paire",    stock: 200, seuil: 50,  prix: 500,   code: "CON-002" },
    { nom: "Seringues 5ml",             categorie: "CONSOMMABLE" as const, unite: "unité",    stock: 500, seuil: 100, prix: 150,   code: "CON-003" },
    { nom: "Tensiomètre électronique",   categorie: "EQUIPEMENT" as const, unite: "unité",    stock: 3,   seuil: 1,   prix: 45000, code: "EQP-001" },
  ];

  const articles = await Promise.all(
    articlesData.map((a) =>
      prisma.articleStock.create({
        data: {
          hospital_id:    hospital.id,
          nom:            a.nom,
          categorie:      a.categorie,
          unite:          a.unite,
          quantite_stock: a.stock,
          seuil_alerte:   a.seuil,
          prix_unitaire:  a.prix,
          code_article:   a.code,
          est_actif:      true,
        },
      })
    )
  );

  // Quelques mouvements de stock réalistes
  const mouvementsData = [
    { article: articles[0], type: "ENTREE" as const,  quantite: 500, avant: 0,   apres: 500, motif: "Approvisionnement initial" },
    { article: articles[1], type: "ENTREE" as const,  quantite: 200, avant: 0,   apres: 200, motif: "Approvisionnement initial" },
    { article: articles[2], type: "ENTREE" as const,  quantite: 150, avant: 0,   apres: 150, motif: "Approvisionnement initial" },
    { article: articles[0], type: "SORTIE" as const,  quantite: 50,  avant: 500, apres: 450, motif: "Délivrance patients — semaine du 10 mars" },
    { article: articles[1], type: "SORTIE" as const,  quantite: 30,  avant: 200, apres: 170, motif: "Délivrance patients — semaine du 10 mars" },
    { article: articles[5], type: "SORTIE" as const,  quantite: 42,  avant: 50,  apres: 8,   motif: "Délivrance importante — stock faible" },
  ];

  for (const m of mouvementsData) {
    await prisma.mouvementStock.create({
      data: {
        hospital_id:    hospital.id,
        article_id:     m.article.id,
        type_mouvement: m.type,
        quantite:       m.quantite,
        quantite_avant: m.avant,
        quantite_apres: m.apres,
        motif:          m.motif,
        utilisateur_id: pharmacien.id,
      },
    });
  }
  console.log("💊 10 articles stock + mouvements créés");

  // ----------------------------------------------------------
  // 9. DÉPENSES COMPTABLES — charges courantes de l'hôpital
  // ----------------------------------------------------------
  const depensesData = [
    { libelle: "Salaires personnel — Mars 2025",     montant: 3500000, categorie: "SALAIRES" as const,    date: new Date("2025-03-01") },
    { libelle: "Approvisionnement médicaments",       montant: 850000,  categorie: "MEDICAMENTS" as const, date: new Date("2025-03-05") },
    { libelle: "Facture électricité — Mars 2025",     montant: 185000,  categorie: "ELECTRICITE" as const, date: new Date("2025-03-07") },
    { libelle: "Loyer locaux — Mars 2025",            montant: 600000,  categorie: "LOYER" as const,       date: new Date("2025-03-01") },
    { libelle: "Fournitures consommables médicaux",   montant: 320000,  categorie: "FOURNITURES" as const, date: new Date("2025-03-10") },
    { libelle: "Maintenance équipements médicaux",    montant: 150000,  categorie: "MAINTENANCE" as const, date: new Date("2025-03-12") },
    { libelle: "Abonnement téléphone + internet",     montant: 85000,   categorie: "TELEPHONE" as const,   date: new Date("2025-03-01") },
    { libelle: "Facture eau — Mars 2025",             montant: 45000,   categorie: "EAU" as const,         date: new Date("2025-03-07") },
  ];

  for (const d of depensesData) {
    await prisma.ecritureComptable.create({
      data: {
        hospital_id:    hospital.id,
        utilisateur_id: comptable.id,
        type_ecriture:  "DEPENSE",
        categorie:      d.categorie,
        libelle:        d.libelle,
        montant:        d.montant,
        date_ecriture:  d.date,
        notes:          `Charge mensuelle — ${d.categorie.toLowerCase()}`,
      },
    });
  }
  console.log("💰 8 dépenses comptables créées");

  // ----------------------------------------------------------
  // RÉSUMÉ FINAL
  // ----------------------------------------------------------
  const totalRecettes = await prisma.ecritureComptable.aggregate({
    where: { hospital_id: hospital.id, type_ecriture: "RECETTE" },
    _sum:  { montant: true },
  });
  const totalDepenses = await prisma.ecritureComptable.aggregate({
    where: { hospital_id: hospital.id, type_ecriture: "DEPENSE" },
    _sum:  { montant: true },
  });

  console.log("\n✅ Seed terminé avec succès !");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏥 Hôpital      : ${hospital.nom}`);
  console.log(`👥 Utilisateurs : 7`);
  console.log(`🧑 Patients     : 10`);
  console.log(`📋 Consultations: 8 (+ factures + écritures)`);
  console.log(`🔬 Examens labo : 4 (+ factures + écritures)`);
  console.log(`🩻 Imagerie     : 4 (+ factures + écritures)`);
  console.log(`💊 Articles     : 10 (+ mouvements stock)`);
  console.log(`💰 Recettes     : ${(totalRecettes._sum.montant ?? 0).toLocaleString("fr-FR")} XAF`);
  console.log(`💸 Dépenses     : ${(totalDepenses._sum.montant ?? 0).toLocaleString("fr-FR")} XAF`);
  console.log(`📈 Bénéfice     : ${((totalRecettes._sum.montant ?? 0) - (totalDepenses._sum.montant ?? 0)).toLocaleString("fr-FR")} XAF`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📧 Comptes de démo :");
  console.log("   admin@elrapha.ga      → ADMIN");
  console.log("   p.nguema@elrapha.ga   → MÉDECIN");
  console.log("   s.mba@elrapha.ga      → MÉDECIN");
  console.log("   jp.obame@elrapha.ga   → INFIRMIER");
  console.log("   c.ella@elrapha.ga     → COMPTABLE");
  console.log("   b.bourobou@elrapha.ga → LABORANTIN");
  console.log("   f.moussavou@elrapha.ga → PHARMACIEN");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });