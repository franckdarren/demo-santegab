// ============================================================
// SEED — Données de démo SANTÉGAB v3
// ============================================================

import { PrismaClient, Role } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ============================================================
// TARIFS DE RÉFÉRENCE
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

const TARIF_CONSULTATION = 20000;

// ============================================================
// PERMISSIONS PAR DÉFAUT — typées explicitement avec Role
// ============================================================
const PERMISSIONS_DEFAUT: Array<{
  role:           Role;
  module:         string;
  peut_voir:      boolean;
  peut_creer:     boolean;
  peut_modifier:  boolean;
  peut_supprimer: boolean;
}> = [
  // MÉDECIN
  { role: "MEDECIN", module: "PATIENT",         peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
  { role: "MEDECIN", module: "CONSULTATION",    peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
  { role: "MEDECIN", module: "LABORATOIRE",     peut_voir: true,  peut_creer: true,  peut_modifier: false, peut_supprimer: false },
  { role: "MEDECIN", module: "IMAGERIE",        peut_voir: true,  peut_creer: true,  peut_modifier: false, peut_supprimer: false },
  { role: "MEDECIN", module: "HOSPITALISATION", peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
  { role: "MEDECIN", module: "PHARMACIE",       peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "MEDECIN", module: "FACTURATION",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "MEDECIN", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "MEDECIN", module: "STATISTIQUES",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "MEDECIN", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "MEDECIN", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  // INFIRMIER
  { role: "INFIRMIER", module: "PATIENT",         peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "INFIRMIER", module: "CONSULTATION",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "INFIRMIER", module: "LABORATOIRE",     peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "INFIRMIER", module: "IMAGERIE",        peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "INFIRMIER", module: "HOSPITALISATION", peut_voir: true,  peut_creer: false, peut_modifier: true,  peut_supprimer: false },
  { role: "INFIRMIER", module: "PHARMACIE",       peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "INFIRMIER", module: "FACTURATION",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "INFIRMIER", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "INFIRMIER", module: "STATISTIQUES",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "INFIRMIER", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "INFIRMIER", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  // LABORANTIN
  { role: "LABORANTIN", module: "PATIENT",         peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "LABORANTIN", module: "CONSULTATION",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "LABORANTIN", module: "LABORATOIRE",     peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
  { role: "LABORANTIN", module: "IMAGERIE",        peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "LABORANTIN", module: "HOSPITALISATION", peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "LABORANTIN", module: "PHARMACIE",       peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "LABORANTIN", module: "FACTURATION",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "LABORANTIN", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "LABORANTIN", module: "STATISTIQUES",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "LABORANTIN", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "LABORANTIN", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  // RADIOLOGUE
  { role: "RADIOLOGUE", module: "PATIENT",         peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "RADIOLOGUE", module: "CONSULTATION",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "RADIOLOGUE", module: "LABORATOIRE",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "RADIOLOGUE", module: "IMAGERIE",        peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
  { role: "RADIOLOGUE", module: "HOSPITALISATION", peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "RADIOLOGUE", module: "PHARMACIE",       peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "RADIOLOGUE", module: "FACTURATION",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "RADIOLOGUE", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "RADIOLOGUE", module: "STATISTIQUES",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "RADIOLOGUE", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "RADIOLOGUE", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  // PHARMACIEN
  { role: "PHARMACIEN", module: "PATIENT",         peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "PHARMACIEN", module: "CONSULTATION",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "PHARMACIEN", module: "LABORATOIRE",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "PHARMACIEN", module: "IMAGERIE",        peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "PHARMACIEN", module: "HOSPITALISATION", peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "PHARMACIEN", module: "PHARMACIE",       peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: true  },
  { role: "PHARMACIEN", module: "FACTURATION",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "PHARMACIEN", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "PHARMACIEN", module: "STATISTIQUES",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "PHARMACIEN", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "PHARMACIEN", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  // COMPTABLE
  { role: "COMPTABLE", module: "PATIENT",         peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "COMPTABLE", module: "CONSULTATION",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "COMPTABLE", module: "LABORATOIRE",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "COMPTABLE", module: "IMAGERIE",        peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "COMPTABLE", module: "HOSPITALISATION", peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "COMPTABLE", module: "PHARMACIE",       peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "COMPTABLE", module: "FACTURATION",     peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
  { role: "COMPTABLE", module: "COMPTABILITE",    peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
  { role: "COMPTABLE", module: "STATISTIQUES",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "COMPTABLE", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "COMPTABLE", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  // ADMINISTRATIF
  { role: "ADMINISTRATIF", module: "PATIENT",         peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
  { role: "ADMINISTRATIF", module: "CONSULTATION",    peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "ADMINISTRATIF", module: "LABORATOIRE",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "ADMINISTRATIF", module: "IMAGERIE",        peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "ADMINISTRATIF", module: "HOSPITALISATION", peut_voir: true,  peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "ADMINISTRATIF", module: "PHARMACIE",       peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "ADMINISTRATIF", module: "FACTURATION",     peut_voir: true,  peut_creer: true,  peut_modifier: false, peut_supprimer: false },
  { role: "ADMINISTRATIF", module: "COMPTABILITE",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "ADMINISTRATIF", module: "STATISTIQUES",    peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "ADMINISTRATIF", module: "UTILISATEUR",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
  { role: "ADMINISTRATIF", module: "AUDIT",           peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
];

async function main() {
  console.log("🌱 Démarrage du seed SANTÉGAB v3...");

  // ----------------------------------------------------------
  // 1. NETTOYAGE COMPLET
  // ----------------------------------------------------------
  await prisma.auditTrail.deleteMany();
  await prisma.auditLogCarnet.deleteMany();
  await prisma.qrToken.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.rolePersonnalise.deleteMany();
  await prisma.ecritureComptable.deleteMany();
  await prisma.ligneHospitalisation.deleteMany();
  await prisma.hospitalisation.deleteMany();
  await prisma.chambre.deleteMany();
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
  // 3. UTILISATEURS
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
  // 4. PERMISSIONS PAR DÉFAUT
  // ----------------------------------------------------------
  await Promise.all(
    PERMISSIONS_DEFAUT.map((p) =>
      prisma.permission.create({
        data: {
          hospital_id:    hospital.id,
          role:           p.role,           // ← typé Role, pas de cast
          module:         p.module,
          peut_voir:      p.peut_voir,
          peut_creer:     p.peut_creer,
          peut_modifier:  p.peut_modifier,
          peut_supprimer: p.peut_supprimer,
        },
      })
    )
  );
  console.log("🔐 Permissions créées");

  // ----------------------------------------------------------
  // 5. CHAMBRES
  // ----------------------------------------------------------
  const chambresData = [
    { numero: "101",    type: "COMMUNE",     prix: 8000,   disponible: true,  desc: "Chambre commune 4 lits — Ventilateur — WC partagé" },
    { numero: "102",    type: "COMMUNE",     prix: 8000,   disponible: false, desc: "Chambre commune 4 lits — Ventilateur — WC partagé" },
    { numero: "103",    type: "COMMUNE",     prix: 8000,   disponible: true,  desc: "Chambre commune 4 lits — Ventilateur — WC partagé" },
    { numero: "201",    type: "PRIVEE",      prix: 25000,  disponible: false, desc: "Chambre privée — Climatisation — SDB — TV" },
    { numero: "202",    type: "PRIVEE",      prix: 25000,  disponible: true,  desc: "Chambre privée — Climatisation — SDB — TV" },
    { numero: "203",    type: "PRIVEE",      prix: 25000,  disponible: true,  desc: "Chambre privée — Climatisation — SDB — TV" },
    { numero: "VIP-01", type: "VIP",         prix: 75000,  disponible: false, desc: "Suite VIP — Climatisation — Salon — TV — WiFi — Repas inclus" },
    { numero: "VIP-02", type: "VIP",         prix: 75000,  disponible: true,  desc: "Suite VIP — Climatisation — Salon — TV — WiFi — Repas inclus" },
    { numero: "REA-01", type: "REANIMATION", prix: 120000, disponible: true,  desc: "Unité réanimation — Monitoring continu — Ventilateur" },
    { numero: "REA-02", type: "REANIMATION", prix: 120000, disponible: true,  desc: "Unité réanimation — Monitoring continu — Ventilateur" },
  ];

  const chambres = await Promise.all(
    chambresData.map((c) =>
      prisma.chambre.create({
        data: {
          hospital_id:     hospital.id,
          numero:          c.numero,
          type_chambre:    c.type,
          prix_journalier: c.prix,
          est_disponible:  c.disponible,
          description:     c.desc,
        },
      })
    )
  );
  console.log("🛏️  10 chambres créées");

  // ----------------------------------------------------------
  // 6. PATIENTS
  // ----------------------------------------------------------
  const patientsData = [
    { numero: "PAT-2025-00001", nom: "NZIGOU",      prenom: "Alphonse",  sexe: "MASCULIN" as const, naissance: new Date("1978-03-15"), telephone: "+241 07 23 45 67", groupe: "A+",  assurance: "CNAMGS", taux: 80, allergies: "Pénicilline", antecedents: "Gastrite chronique diagnostiquée en 2020" },
    { numero: "PAT-2025-00002", nom: "MOUSSAVOU",   prenom: "Estelle",   sexe: "FEMININ"  as const, naissance: new Date("1990-07-22"), telephone: "+241 06 34 56 78", groupe: "O+",  assurance: "ASCOMA", taux: 70, allergies: null,           antecedents: null },
    { numero: "PAT-2025-00003", nom: "BOUROBOU",    prenom: "Gaston",    sexe: "MASCULIN" as const, naissance: new Date("1965-11-08"), telephone: "+241 07 45 67 89", groupe: "B+",  assurance: "CNAMGS", taux: 80, allergies: "Aspirine",     antecedents: "Hypertension artérielle depuis 2015" },
    { numero: "PAT-2025-00004", nom: "MBOUMBA",     prenom: "Sylvie",    sexe: "FEMININ"  as const, naissance: new Date("1985-04-30"), telephone: "+241 06 56 78 90", groupe: "AB+", assurance: "AXA",    taux: 90, allergies: null,           antecedents: null },
    { numero: "PAT-2025-00005", nom: "NKOGHE",      prenom: "Rodrigue",  sexe: "MASCULIN" as const, naissance: new Date("1995-01-12"), telephone: "+241 07 67 89 01", groupe: "A-",  assurance: null,     taux:  0, allergies: null,           antecedents: null },
    { numero: "PAT-2025-00006", nom: "OVONO",       prenom: "Nadège",    sexe: "FEMININ"  as const, naissance: new Date("1982-09-18"), telephone: "+241 06 78 90 12", groupe: "O-",  assurance: "OGAR",   taux: 75, allergies: "Latex",        antecedents: "Allergie cutanée diagnostiquée en 2018" },
    { numero: "PAT-2025-00007", nom: "MOUNGUENGUI", prenom: "Patrick",   sexe: "MASCULIN" as const, naissance: new Date("1970-06-25"), telephone: "+241 07 89 01 23", groupe: "B-",  assurance: "CNAMGS", taux: 80, allergies: null,           antecedents: "Diabète type 2 depuis 2019" },
    { numero: "PAT-2025-00008", nom: "KOUMBA",      prenom: "Félicité",  sexe: "FEMININ"  as const, naissance: new Date("1998-12-03"), telephone: "+241 06 90 12 34", groupe: "A+",  assurance: "Sunu",   taux: 60, allergies: null,           antecedents: null },
    { numero: "PAT-2025-00009", nom: "NDONG",       prenom: "Emmanuel",  sexe: "MASCULIN" as const, naissance: new Date("1955-08-14"), telephone: "+241 07 01 23 45", groupe: "O+",  assurance: "ASCOMA", taux: 70, allergies: "Morphine",     antecedents: "Diabète type 2, HTA, cardiopathie ischémique" },
    { numero: "PAT-2025-00010", nom: "BEKALE",      prenom: "Lucie",     sexe: "FEMININ"  as const, naissance: new Date("2001-02-28"), telephone: "+241 06 12 34 50", groupe: "AB-", assurance: "CNAMGS", taux: 80, allergies: null,           antecedents: null },
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
  // 7. STOCK PHARMACIE
  // ----------------------------------------------------------
  const articlesData = [
    { nom: "Paracétamol 500mg",         categorie: "MEDICAMENT"  as const, unite: "comprimé", stock: 450, seuil: 50,  prix: 150,   code: "MED-001" },
    { nom: "Amoxicilline 500mg",         categorie: "MEDICAMENT"  as const, unite: "gélule",   stock: 170, seuil: 30,  prix: 350,   code: "MED-002" },
    { nom: "Artémether/Luméfantrine",    categorie: "MEDICAMENT"  as const, unite: "comprimé", stock: 120, seuil: 20,  prix: 800,   code: "MED-003" },
    { nom: "Oméprazole 20mg",            categorie: "MEDICAMENT"  as const, unite: "gélule",   stock: 280, seuil: 40,  prix: 250,   code: "MED-004" },
    { nom: "Metformine 850mg",           categorie: "MEDICAMENT"  as const, unite: "comprimé", stock: 380, seuil: 50,  prix: 200,   code: "MED-005" },
    { nom: "Amlodipine 5mg",            categorie: "MEDICAMENT"  as const, unite: "comprimé", stock: 8,   seuil: 30,  prix: 300,   code: "MED-006" },
    { nom: "Sérum physiologique 500ml", categorie: "CONSOMMABLE" as const, unite: "flacon",   stock: 45,  seuil: 10,  prix: 2500,  code: "CON-001" },
    { nom: "Gants stériles",            categorie: "CONSOMMABLE" as const, unite: "paire",    stock: 180, seuil: 50,  prix: 500,   code: "CON-002" },
    { nom: "Seringues 5ml",            categorie: "CONSOMMABLE" as const, unite: "unité",    stock: 450, seuil: 100, prix: 150,   code: "CON-003" },
    { nom: "Tensiomètre électronique",  categorie: "EQUIPEMENT"  as const, unite: "unité",    stock: 3,   seuil: 1,   prix: 45000, code: "EQP-001" },
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

  // Mouvements d'entrée initiaux
  for (const article of articles) {
    if (article.quantite_stock > 0) {
      await prisma.mouvementStock.create({
        data: {
          hospital_id:    hospital.id,
          article_id:     article.id,
          type_mouvement: "ENTREE",
          quantite:       article.quantite_stock,
          quantite_avant: 0,
          quantite_apres: article.quantite_stock,
          motif:          "Stock initial — approvisionnement Mars 2025",
          utilisateur_id: pharmacien.id,
        },
      });
    }
  }
  console.log("💊 10 articles stock + mouvements créés");

  // ----------------------------------------------------------
  // 8. CONSULTATIONS + PRESCRIPTIONS + FACTURES
  // ----------------------------------------------------------
  let factureCount = 0;

  const consultationsData = [
    {
      patient: patients[0], medecin: medecin1,
      statut:  "TERMINEE" as const,
      motif:   "Douleurs abdominales persistantes",
      diagnostic: "Gastrite chronique",
      tension: "13/8", poids: 78, taille: 175, temperature: 37.2,
      date:    new Date("2025-03-10T09:00:00"),
      prescriptions: [
        { medicament: "Oméprazole 20mg", dosage: "1 gélule",  frequence: "Matin à jeun",      duree: "30 jours" },
        { medicament: "Gaviscon",         dosage: "1 sachet", frequence: "Après chaque repas", duree: "15 jours" },
      ],
      statutFacture: "PAYEE" as const, modePaiement: "ASSURANCE" as const,
    },
    {
      patient: patients[1], medecin: medecin2,
      statut:  "TERMINEE" as const,
      motif:   "Fièvre et maux de tête",
      diagnostic: "Paludisme simple",
      tension: "11/7", poids: 62, taille: 165, temperature: 38.9,
      date:    new Date("2025-03-11T10:30:00"),
      prescriptions: [
        { medicament: "Artémether/Luméfantrine", dosage: "4 comprimés", frequence: "2 fois/jour",             duree: "3 jours" },
        { medicament: "Paracétamol 1000mg",       dosage: "1 comprimé",  frequence: "Toutes les 6h si fièvre", duree: "3 jours" },
      ],
      statutFacture: "PAYEE" as const, modePaiement: "ESPECES" as const,
    },
    {
      patient: patients[2], medecin: medecin1,
      statut:  "TERMINEE" as const,
      motif:   "Contrôle tension artérielle",
      diagnostic: "Hypertension artérielle stade 2",
      tension: "16/10", poids: 92, taille: 178, temperature: 36.8,
      date:    new Date("2025-03-12T08:00:00"),
      prescriptions: [
        { medicament: "Amlodipine 5mg",  dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" },
        { medicament: "Périndopril 4mg", dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" },
      ],
      statutFacture: "PAYEE" as const, modePaiement: "ASSURANCE" as const,
    },
    {
      patient: patients[3], medecin: medecin2,
      statut:  "TERMINEE" as const,
      motif:   "Consultation prénatale",
      diagnostic: "Grossesse 24 semaines — évolution normale",
      tension: "12/7", poids: 71, taille: 162, temperature: 37.0,
      date:    new Date("2025-03-13T11:00:00"),
      prescriptions: [
        { medicament: "Fer + Acide folique", dosage: "1 comprimé", frequence: "1 fois/jour", duree: "60 jours" },
        { medicament: "Calcium 500mg",        dosage: "1 comprimé", frequence: "Le soir",     duree: "60 jours" },
      ],
      statutFacture: "PAYEE" as const, modePaiement: "ASSURANCE" as const,
    },
    {
      patient: patients[4], medecin: medecin1,
      statut:  "EN_ATTENTE" as const,
      motif:   "Douleur genou droit",
      diagnostic: null,
      tension: "12/8", poids: 75, taille: 180, temperature: 36.9,
      date:    new Date("2025-03-14T14:00:00"),
      prescriptions: [],
      statutFacture: "EN_ATTENTE" as const, modePaiement: null,
    },
    {
      patient: patients[5], medecin: medecin2,
      statut:  "TERMINEE" as const,
      motif:   "Éruption cutanée",
      diagnostic: "Dermatite allergique",
      tension: "11/7", poids: 58, taille: 160, temperature: 37.1,
      date:    new Date("2025-03-14T09:30:00"),
      prescriptions: [
        { medicament: "Cétirizine 10mg",     dosage: "1 comprimé",        frequence: "Le soir",       duree: "7 jours"  },
        { medicament: "Bétaméthasone crème", dosage: "Application locale", frequence: "2 fois/jour",  duree: "10 jours" },
      ],
      statutFacture: "PAYEE" as const, modePaiement: "MOBILE_MONEY" as const,
    },
    {
      patient: patients[6], medecin: medecin1,
      statut:  "TERMINEE" as const,
      motif:   "Diabète — suivi mensuel",
      diagnostic: "Diabète type 2 — glycémie mal contrôlée",
      tension: "14/9", poids: 88, taille: 172, temperature: 37.0,
      date:    new Date("2025-03-15T08:30:00"),
      prescriptions: [
        { medicament: "Metformine 850mg",  dosage: "1 comprimé", frequence: "Matin et soir au repas", duree: "30 jours" },
        { medicament: "Glibenclamide 5mg", dosage: "1 comprimé", frequence: "Le matin",               duree: "30 jours" },
      ],
      statutFacture: "PAYEE" as const, modePaiement: "ASSURANCE" as const,
    },
    {
      patient: patients[9], medecin: medecin2,
      statut:  "EN_COURS" as const,
      motif:   "Toux persistante depuis 2 semaines",
      diagnostic: "Bronchite aiguë",
      tension: "11/7", poids: 55, taille: 163, temperature: 38.2,
      date:    new Date("2025-03-15T10:00:00"),
      prescriptions: [
        { medicament: "Amoxicilline 500mg", dosage: "1 gélule",    frequence: "3 fois/jour", duree: "7 jours" },
        { medicament: "Bromhexine sirop",   dosage: "2 cuillères", frequence: "3 fois/jour", duree: "7 jours" },
      ],
      statutFacture: "EN_ATTENTE" as const, modePaiement: null,
    },
  ];

  for (const c of consultationsData) {
    const patientHospital = await prisma.patientHospital.findFirst({
      where: { patient_id: c.patient.id, hospital_id: hospital.id },
    });
    const tauxCouverture   = patientHospital?.taux_couverture ?? 0;
    const montantAssurance = Math.round(TARIF_CONSULTATION * (tauxCouverture / 100));
    const montantPatient   = TARIF_CONSULTATION - montantAssurance;

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
        prescriptions:     { create: c.prescriptions },
      },
    });

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
  // 9. EXAMENS LABO
  // ----------------------------------------------------------
  const examensLaboData = [
    {
      patient: patients[0], medecin: medecin1,
      type:    "BILAN_SANGUIN" as const,
      statut:  "VALIDE" as const, urgence: false,
      notes:   "Bilan de contrôle post-traitement gastrite",
      resultats: "Hémoglobine : 13.5 g/dL\nGlobules blancs : 7200/mm³\nConclusion : Normal",
      valide_le: new Date("2025-03-10T14:00:00"),
      date:    new Date("2025-03-10T10:00:00"),
      statutFacture: "PAYEE" as const,
    },
    {
      patient: patients[1], medecin: medecin2,
      type:    "PARASITOLOGIE" as const,
      statut:  "VALIDE" as const, urgence: true,
      notes:   "Suspicion paludisme — fièvre 38.9°C",
      resultats: "Goutte épaisse : Plasmodium falciparum +\nParasitémie : 0.8%\nConclusion : Paludisme simple confirmé",
      valide_le: new Date("2025-03-11T12:00:00"),
      date:    new Date("2025-03-11T08:00:00"),
      statutFacture: "PAYEE" as const,
    },
    {
      patient: patients[6], medecin: medecin1,
      type:    "BIOCHIMIE" as const,
      statut:  "VALIDE" as const, urgence: false,
      notes:   "Contrôle glycémie diabète type 2",
      resultats: "Glycémie à jeun : 1.85 g/L\nHbA1c : 8.2%\nConclusion : Diabète mal équilibré",
      valide_le: new Date("2025-03-15T11:00:00"),
      date:    new Date("2025-03-15T07:00:00"),
      statutFacture: "PAYEE" as const,
    },
    {
      patient: patients[7], medecin: medecin2,
      type:    "BILAN_URINAIRE" as const,
      statut:  "RESULTAT_SAISI" as const, urgence: false,
      notes:   "Suspicion infection urinaire",
      resultats: "Leucocytes : +++\nNitrites : positif\nConclusion : Infection urinaire bactérienne",
      valide_le: null,
      date:    new Date("2025-03-16T09:00:00"),
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
  // 10. EXAMENS IMAGERIE
  // ----------------------------------------------------------
  const examensImagerieData = [
    {
      patient: patients[2], medecin: medecin1,
      type:    "RADIOGRAPHIE" as const, zone: "Thorax",
      statut:  "VALIDE" as const, urgence: false,
      notes:   "Contrôle cardio-pulmonaire HTA",
      resultats: "Silhouette cardiaque normale\nParenchyme pulmonaire sans opacité\nConclusion : Normal",
      valide_le: new Date("2025-03-12T15:00:00"),
      date:    new Date("2025-03-12T10:00:00"),
      statutFacture: "PAYEE" as const,
    },
    {
      patient: patients[3], medecin: medecin2,
      type:    "ECHOGRAPHIE" as const, zone: "Abdomen",
      statut:  "VALIDE" as const, urgence: false,
      notes:   "Échographie obstétricale — grossesse 24 SA",
      resultats: "Fœtus unique en présentation céphalique\nBiométrie cohérente avec 24 SA\nConclusion : Grossesse normale",
      valide_le: new Date("2025-03-13T14:00:00"),
      date:    new Date("2025-03-13T11:00:00"),
      statutFacture: "PAYEE" as const,
    },
    {
      patient: patients[8], medecin: medecin1,
      type:    "SCANNER" as const, zone: "Crâne",
      statut:  "RESULTAT_SAISI" as const, urgence: true,
      notes:   "Céphalées intenses — patient diabétique hypertendu",
      resultats: "Pas d'hémorragie intracrânienne\nPas de lésion ischémique aiguë\nConclusion : Pas d'urgence neurochirurgicale",
      valide_le: null,
      date:    new Date("2025-03-16T08:00:00"),
      statutFacture: "EN_ATTENTE" as const,
    },
    {
      patient: patients[9], medecin: medecin2,
      type:    "RADIOGRAPHIE" as const, zone: "Thorax",
      statut:  "EN_ATTENTE" as const, urgence: false,
      notes:   "Toux persistante — suspicion bronchite",
      resultats: null,
      valide_le: null,
      date:    new Date("2025-03-15T11:00:00"),
      statutFacture: "EN_ATTENTE" as const,
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
        notes:             `Imagerie — ${e.type} (${e.zone})`,
        lignes: {
          create: [{
            description:   `Imagerie — ${e.type} (${e.zone})`,
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
        zone_anatomique: e.zone,
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
          notes:          `Imagerie — ${e.type} (${e.zone})`,
        },
      });
    }
  }
  console.log("🩻 4 examens imagerie + factures + écritures créés");

  // ----------------------------------------------------------
  // 11. HOSPITALISATIONS — 3 séjours réalistes
  // ----------------------------------------------------------
  const chambreVIP01 = chambres.find((c) => c.numero === "VIP-01")!;
  const chambre201   = chambres.find((c) => c.numero === "201")!;
  const chambre102   = chambres.find((c) => c.numero === "102")!;

  // ── HOSPITALISATION 1 — BOUROBOU Gaston — sortie payée
  const dateEntree1  = new Date("2025-03-05T10:00:00");
  const dateSortie1  = new Date("2025-03-09T11:00:00");
  const montantH1    = chambreVIP01.prix_journalier * 4
                     + articles[0].prix_unitaire * 20
                     + articles[4].prix_unitaire * 30
                     + 10000; // actes infirmiers
  const tauxH1       = 80;
  const montantAssH1 = Math.round(montantH1 * (tauxH1 / 100));
  const montantPatH1 = montantH1 - montantAssH1;

  factureCount++;
  const numFactH1 = `FAC-HOSPIT-${new Date().getFullYear()}-${String(factureCount).padStart(5, "0")}`;

  const factureH1 = await prisma.facture.create({
    data: {
      hospital_id:       hospital.id,
      patient_id:        patients[2].id,
      numero_facture:    numFactH1,
      statut:            "PAYEE",
      montant_total:     montantH1,
      montant_assurance: montantAssH1,
      montant_patient:   montantPatH1,
      mode_paiement:     "ASSURANCE",
      date_paiement:     dateSortie1,
      notes:             "Hospitalisation — Hypertension artérielle stade 2",
      lignes: {
        create: [
          { description: "Chambre VIP-01 x4 jours",         quantite: 4,  prix_unitaire: chambreVIP01.prix_journalier, montant_total: chambreVIP01.prix_journalier * 4 },
          { description: "Paracétamol 500mg x20 comprimés", quantite: 20, prix_unitaire: articles[0].prix_unitaire,    montant_total: articles[0].prix_unitaire * 20 },
          { description: "Metformine 850mg x30 comprimés",  quantite: 30, prix_unitaire: articles[4].prix_unitaire,    montant_total: articles[4].prix_unitaire * 30 },
          { description: "Soins infirmiers — surveillance tensionnelle x4", quantite: 4, prix_unitaire: 2500, montant_total: 10000 },
        ],
      },
    },
  });

  await prisma.hospitalisation.create({
    data: {
      hospital_id:     hospital.id,
      patient_id:      patients[2].id,
      medecin_id:      medecin1.id,
      chambre_id:      chambreVIP01.id,
      statut:          "SORTIE",
      date_entree:     dateEntree1,
      date_sortie:     dateSortie1,
      motif_admission: "Crise hypertensive — TA 18/11 — hospitalisation pour bilan et stabilisation",
      diagnostic:      "Hypertension artérielle stade 2 — stabilisée sous traitement",
      notes:           "Patient sorti avec ordonnance — contrôle dans 2 semaines",
      facture_id:      factureH1.id,
      lignes: {
        create: [
          { type_ligne: "CHAMBRE",        statut: "SERVI", description: "Chambre VIP-01 — Jour 1", quantite: 1, prix_unitaire: chambreVIP01.prix_journalier, montant_total: chambreVIP01.prix_journalier, prescrit_par: "ONDO Marie-Claire",  date_ligne: new Date("2025-03-05T10:00:00") },
          { type_ligne: "CHAMBRE",        statut: "SERVI", description: "Chambre VIP-01 — Jour 2", quantite: 1, prix_unitaire: chambreVIP01.prix_journalier, montant_total: chambreVIP01.prix_journalier, prescrit_par: "ONDO Marie-Claire",  date_ligne: new Date("2025-03-06T10:00:00") },
          { type_ligne: "CHAMBRE",        statut: "SERVI", description: "Chambre VIP-01 — Jour 3", quantite: 1, prix_unitaire: chambreVIP01.prix_journalier, montant_total: chambreVIP01.prix_journalier, prescrit_par: "ONDO Marie-Claire",  date_ligne: new Date("2025-03-07T10:00:00") },
          { type_ligne: "CHAMBRE",        statut: "SERVI", description: "Chambre VIP-01 — Jour 4", quantite: 1, prix_unitaire: chambreVIP01.prix_journalier, montant_total: chambreVIP01.prix_journalier, prescrit_par: "ONDO Marie-Claire",  date_ligne: new Date("2025-03-08T10:00:00") },
          { type_ligne: "MEDICAMENT",     statut: "SERVI", description: "Paracétamol 500mg x20",   quantite: 20, prix_unitaire: articles[0].prix_unitaire, montant_total: articles[0].prix_unitaire * 20, prescrit_par: "NGUEMA Pierre",      article_stock_id: articles[0].id, date_ligne: new Date("2025-03-05T14:00:00") },
          { type_ligne: "MEDICAMENT",     statut: "SERVI", description: "Metformine 850mg x30",    quantite: 30, prix_unitaire: articles[4].prix_unitaire, montant_total: articles[4].prix_unitaire * 30, prescrit_par: "NGUEMA Pierre",      article_stock_id: articles[4].id, date_ligne: new Date("2025-03-06T09:00:00") },
          { type_ligne: "ACTE_INFIRMIER", statut: "SERVI", description: "Prise de tension x4 — surveillance tensionnelle", quantite: 4, prix_unitaire: 2500, montant_total: 10000, prescrit_par: "OBAME Jean-Paul", date_ligne: new Date("2025-03-05T12:00:00") },
        ],
      },
    },
  });

  // Mouvements stock hospit 1
  await prisma.mouvementStock.create({
    data: { hospital_id: hospital.id, article_id: articles[0].id, type_mouvement: "SORTIE", quantite: 20, quantite_avant: 450, quantite_apres: 430, motif: "Hospitalisation BOUROBOU Gaston", utilisateur_id: pharmacien.id },
  });
  await prisma.mouvementStock.create({
    data: { hospital_id: hospital.id, article_id: articles[4].id, type_mouvement: "SORTIE", quantite: 30, quantite_avant: 380, quantite_apres: 350, motif: "Hospitalisation BOUROBOU Gaston", utilisateur_id: pharmacien.id },
  });

  // Écriture comptable hospit 1
  await prisma.ecritureComptable.create({
    data: {
      hospital_id:    hospital.id,
      utilisateur_id: admin.id,
      type_ecriture:  "RECETTE",
      libelle:        `Hospitalisation ${numFactH1} — ${patients[2].prenom} ${patients[2].nom}`,
      montant:        montantPatH1,
      date_ecriture:  dateSortie1,
      reference:      numFactH1,
      facture_id:     factureH1.id,
      notes:          "Séjour 4 jours — HTA — Chambre VIP-01",
    },
  });

  // ── HOSPITALISATION 2 — NDONG Emmanuel — sortie non payée
  const dateEntree2  = new Date("2025-03-13T08:00:00");
  const dateSortie2  = new Date("2025-03-17T10:00:00");
  const montantH2    = chambre201.prix_journalier * 4
                     + articles[4].prix_unitaire * 60
                     + articles[5].prix_unitaire * 30
                     + 12000; // actes infirmiers
  const tauxH2       = 70;
  const montantAssH2 = Math.round(montantH2 * (tauxH2 / 100));
  const montantPatH2 = montantH2 - montantAssH2;

  factureCount++;
  const numFactH2 = `FAC-HOSPIT-${new Date().getFullYear()}-${String(factureCount).padStart(5, "0")}`;

  const factureH2 = await prisma.facture.create({
    data: {
      hospital_id:       hospital.id,
      patient_id:        patients[8].id,
      numero_facture:    numFactH2,
      statut:            "EN_ATTENTE",
      montant_total:     montantH2,
      montant_assurance: montantAssH2,
      montant_patient:   montantPatH2,
      notes:             "Hospitalisation — Décompensation diabétique",
      lignes: {
        create: [
          { description: "Chambre 201 x4 jours",           quantite: 4,  prix_unitaire: chambre201.prix_journalier, montant_total: chambre201.prix_journalier * 4 },
          { description: "Metformine 850mg x60 comprimés", quantite: 60, prix_unitaire: articles[4].prix_unitaire,  montant_total: articles[4].prix_unitaire * 60 },
          { description: "Amlodipine 5mg x30 comprimés",  quantite: 30, prix_unitaire: articles[5].prix_unitaire,  montant_total: articles[5].prix_unitaire * 30 },
          { description: "Glycémie capillaire x8 — surveillance intensive", quantite: 8, prix_unitaire: 1500, montant_total: 12000 },
        ],
      },
    },
  });

  await prisma.hospitalisation.create({
    data: {
      hospital_id:     hospital.id,
      patient_id:      patients[8].id,
      medecin_id:      medecin2.id,
      chambre_id:      chambre201.id,
      statut:          "SORTIE",
      date_entree:     dateEntree2,
      date_sortie:     dateSortie2,
      motif_admission: "Décompensation diabétique — glycémie 3.2 g/L — cétose",
      diagnostic:      "Acidocétose diabétique modérée — traitement insuline IV",
      notes:           "Patient sorti amélioré — suivi endocrinologie recommandé",
      facture_id:      factureH2.id,
      lignes: {
        create: [
          { type_ligne: "CHAMBRE",        statut: "SERVI", description: "Chambre 201 — Jour 1", quantite: 1, prix_unitaire: chambre201.prix_journalier, montant_total: chambre201.prix_journalier, prescrit_par: "ONDO Marie-Claire",  date_ligne: new Date("2025-03-13T08:00:00") },
          { type_ligne: "CHAMBRE",        statut: "SERVI", description: "Chambre 201 — Jour 2", quantite: 1, prix_unitaire: chambre201.prix_journalier, montant_total: chambre201.prix_journalier, prescrit_par: "ONDO Marie-Claire",  date_ligne: new Date("2025-03-14T08:00:00") },
          { type_ligne: "CHAMBRE",        statut: "SERVI", description: "Chambre 201 — Jour 3", quantite: 1, prix_unitaire: chambre201.prix_journalier, montant_total: chambre201.prix_journalier, prescrit_par: "ONDO Marie-Claire",  date_ligne: new Date("2025-03-15T08:00:00") },
          { type_ligne: "CHAMBRE",        statut: "SERVI", description: "Chambre 201 — Jour 4", quantite: 1, prix_unitaire: chambre201.prix_journalier, montant_total: chambre201.prix_journalier, prescrit_par: "ONDO Marie-Claire",  date_ligne: new Date("2025-03-16T08:00:00") },
          { type_ligne: "MEDICAMENT",     statut: "SERVI", description: "Metformine 850mg x60", quantite: 60, prix_unitaire: articles[4].prix_unitaire, montant_total: articles[4].prix_unitaire * 60, prescrit_par: "MBAGOU Sandrine", article_stock_id: articles[4].id, date_ligne: new Date("2025-03-13T10:00:00") },
          { type_ligne: "MEDICAMENT",     statut: "SERVI", description: "Amlodipine 5mg x30",  quantite: 30, prix_unitaire: articles[5].prix_unitaire, montant_total: articles[5].prix_unitaire * 30, prescrit_par: "MBAGOU Sandrine", article_stock_id: articles[5].id, date_ligne: new Date("2025-03-13T10:00:00") },
          { type_ligne: "ACTE_INFIRMIER", statut: "SERVI", description: "Glycémie capillaire x8 — surveillance intensive", quantite: 8, prix_unitaire: 1500, montant_total: 12000, prescrit_par: "OBAME Jean-Paul", date_ligne: new Date("2025-03-13T12:00:00") },
        ],
      },
    },
  });

  await prisma.mouvementStock.create({
    data: { hospital_id: hospital.id, article_id: articles[4].id, type_mouvement: "SORTIE", quantite: 60, quantite_avant: 350, quantite_apres: 290, motif: "Hospitalisation NDONG Emmanuel", utilisateur_id: pharmacien.id },
  });
  await prisma.mouvementStock.create({
    data: { hospital_id: hospital.id, article_id: articles[5].id, type_mouvement: "SORTIE", quantite: 8, quantite_avant: 8, quantite_apres: 0, motif: "Hospitalisation NDONG Emmanuel — rupture de stock", utilisateur_id: pharmacien.id },
  });

  // ── HOSPITALISATION 3 — KOUMBA Félicité — EN COURS
  const dateEntree3  = new Date("2025-03-20T14:00:00");
  const montantH3    = chambre102.prix_journalier
                     + articles[1].prix_unitaire * 6
                     + 5000; // acte infirmier
  const tauxH3       = 60;
  const montantAssH3 = Math.round(montantH3 * (tauxH3 / 100));
  const montantPatH3 = montantH3 - montantAssH3;

  factureCount++;
  const numFactH3 = `FAC-HOSPIT-${new Date().getFullYear()}-${String(factureCount).padStart(5, "0")}`;

  const factureH3 = await prisma.facture.create({
    data: {
      hospital_id:       hospital.id,
      patient_id:        patients[7].id,
      numero_facture:    numFactH3,
      statut:            "EN_ATTENTE",
      montant_total:     montantH3,
      montant_assurance: montantAssH3,
      montant_patient:   montantPatH3,
      notes:             "Hospitalisation en cours — Infection urinaire sévère",
      lignes: {
        create: [
          { description: "Chambre 102 — Jour 1",          quantite: 1, prix_unitaire: chambre102.prix_journalier, montant_total: chambre102.prix_journalier },
          { description: "Amoxicilline 500mg x6 gélules", quantite: 6, prix_unitaire: articles[1].prix_unitaire,  montant_total: articles[1].prix_unitaire * 6 },
          { description: "Pose voie veineuse + perfusion", quantite: 1, prix_unitaire: 5000, montant_total: 5000 },
        ],
      },
    },
  });

  await prisma.hospitalisation.create({
    data: {
      hospital_id:     hospital.id,
      patient_id:      patients[7].id,
      medecin_id:      medecin2.id,
      chambre_id:      chambre102.id,
      statut:          "EN_COURS",
      date_entree:     dateEntree3,
      motif_admission: "Infection urinaire sévère avec fièvre 39.5°C — antibiothérapie IV",
      facture_id:      factureH3.id,
      lignes: {
        create: [
          { type_ligne: "CHAMBRE",        statut: "SERVI",      description: "Chambre 102 — Commune (Jour 1)",             quantite: 1, prix_unitaire: chambre102.prix_journalier, montant_total: chambre102.prix_journalier,  prescrit_par: "ONDO Marie-Claire",  date_ligne: dateEntree3 },
          { type_ligne: "MEDICAMENT",     statut: "SERVI",      description: "Amoxicilline 500mg x6 gélules",             quantite: 6, prix_unitaire: articles[1].prix_unitaire,    montant_total: articles[1].prix_unitaire * 6, prescrit_par: "MBAGOU Sandrine", article_stock_id: articles[1].id, date_ligne: new Date("2025-03-20T16:00:00") },
          { type_ligne: "MEDICAMENT",     statut: "EN_ATTENTE", description: "Sérum physiologique 500ml x4 — en attente", quantite: 4, prix_unitaire: articles[6].prix_unitaire,    montant_total: articles[6].prix_unitaire * 4, prescrit_par: "MBAGOU Sandrine", article_stock_id: articles[6].id, notes: "Stock insuffisant — commande en cours", date_ligne: new Date("2025-03-20T16:30:00") },
          { type_ligne: "ACTE_INFIRMIER", statut: "SERVI",      description: "Pose voie veineuse + perfusion",            quantite: 1, prix_unitaire: 5000, montant_total: 5000, prescrit_par: "OBAME Jean-Paul", date_ligne: new Date("2025-03-20T15:00:00") },
        ],
      },
    },
  });

  await prisma.mouvementStock.create({
    data: { hospital_id: hospital.id, article_id: articles[1].id, type_mouvement: "SORTIE", quantite: 6, quantite_avant: 170, quantite_apres: 164, motif: "Hospitalisation KOUMBA Félicité", utilisateur_id: pharmacien.id },
  });

  console.log("🏥 3 hospitalisations créées (1 payée, 1 sortie non payée, 1 en cours)");

  // ----------------------------------------------------------
  // 12. DÉPENSES COMPTABLES
  // ----------------------------------------------------------
  const depensesData = [
    { libelle: "Salaires personnel — Mars 2025",   montant: 3500000, categorie: "SALAIRES"    as const, date: new Date("2025-03-01") },
    { libelle: "Approvisionnement médicaments",     montant: 850000,  categorie: "MEDICAMENTS" as const, date: new Date("2025-03-05") },
    { libelle: "Facture électricité — Mars 2025",   montant: 185000,  categorie: "ELECTRICITE" as const, date: new Date("2025-03-07") },
    { libelle: "Loyer locaux — Mars 2025",          montant: 600000,  categorie: "LOYER"       as const, date: new Date("2025-03-01") },
    { libelle: "Fournitures consommables médicaux", montant: 320000,  categorie: "FOURNITURES" as const, date: new Date("2025-03-10") },
    { libelle: "Maintenance équipements médicaux",  montant: 150000,  categorie: "MAINTENANCE" as const, date: new Date("2025-03-12") },
    { libelle: "Abonnement téléphone + internet",   montant: 85000,   categorie: "TELEPHONE"   as const, date: new Date("2025-03-01") },
    { libelle: "Facture eau — Mars 2025",           montant: 45000,   categorie: "EAU"         as const, date: new Date("2025-03-07") },
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
  const facturesEnAttente = await prisma.facture.aggregate({
    where:  { hospital_id: hospital.id, statut: "EN_ATTENTE" },
    _sum:   { montant_patient: true },
    _count: true,
  });

  console.log("\n✅ Seed SANTÉGAB v3 terminé !");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏥 Hôpital          : ${hospital.nom}`);
  console.log(`👥 Utilisateurs     : 7`);
  console.log(`🔐 Permissions      : ${PERMISSIONS_DEFAUT.length} (7 rôles × 11 modules)`);
  console.log(`🛏️  Chambres         : 10 (3 communes, 3 privées, 2 VIP, 2 réa)`);
  console.log(`🧑 Patients         : 10`);
  console.log(`📋 Consultations    : 8`);
  console.log(`🔬 Examens labo     : 4`);
  console.log(`🩻 Examens imagerie : 4`);
  console.log(`🏥 Hospitalisations : 3 (1 payée, 1 sortie non payée, 1 en cours)`);
  console.log(`💊 Articles stock   : 10`);
  console.log(`💰 Recettes         : ${(totalRecettes._sum.montant ?? 0).toLocaleString("fr-FR")} XAF`);
  console.log(`💸 Dépenses         : ${(totalDepenses._sum.montant ?? 0).toLocaleString("fr-FR")} XAF`);
  console.log(`📈 Bénéfice net     : ${((totalRecettes._sum.montant ?? 0) - (totalDepenses._sum.montant ?? 0)).toLocaleString("fr-FR")} XAF`);
  console.log(`⏳ En attente       : ${facturesEnAttente._count} factures — ${(facturesEnAttente._sum.montant_patient ?? 0).toLocaleString("fr-FR")} XAF`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📧 Comptes de démo :");
  console.log("   admin@elrapha.ga       → ADMIN");
  console.log("   p.nguema@elrapha.ga    → MÉDECIN");
  console.log("   s.mba@elrapha.ga       → MÉDECIN");
  console.log("   jp.obame@elrapha.ga    → INFIRMIER");
  console.log("   c.ella@elrapha.ga      → COMPTABLE");
  console.log("   b.bourobou@elrapha.ga  → LABORANTIN");
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