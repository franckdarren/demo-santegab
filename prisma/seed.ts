// ============================================================
// SEED — Données de démo SANTÉGAB v4
// Période : 3 derniers mois (2026-01-26 → 2026-04-26)
// IMPORTANT : Ne touche PAS aux utilisateurs existants
// ============================================================

import { PrismaClient, Role } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ============================================================
// CONSTANTES
// ============================================================
const HOSPITAL_ID = "11111111-1111-1111-1111-111111111111";
const TODAY        = new Date("2026-04-26T12:00:00Z");
const DEBUT        = new Date("2026-01-26T08:00:00Z");
const TARIF_CONSULTATION = 10000;

const TARIFS_IMAGERIE: Record<string, number> = {
  RADIOGRAPHIE: 30000, ECHOGRAPHIE: 45000, SCANNER: 150000,
  IRM: 250000, MAMMOGRAPHIE: 60000, AUTRE: 35000,
};

// Helper : ajoute n jours à une date (UTC)
function addDays(base: Date, n: number, hour = 9, minute = 0): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

// ============================================================
// CATALOGUE EXAMENS LABO — Clinique El Rapha
// ============================================================
const CATALOGUE_LABO: Array<{ famille: string; nom: string; prix: number; ordre: number }> = [
  // HEMATOLOGIE
  { famille: "HEMATOLOGIE", nom: "NFS",                                       prix: 5000,  ordre: 1  },
  { famille: "HEMATOLOGIE", nom: "GS/RH",                                     prix: 3000,  ordre: 2  },
  { famille: "HEMATOLOGIE", nom: "Réticulocytes",                             prix: 5000,  ordre: 3  },
  { famille: "HEMATOLOGIE", nom: "TP",                                        prix: 5000,  ordre: 4  },
  { famille: "HEMATOLOGIE", nom: "TCK",                                       prix: 5000,  ordre: 5  },
  { famille: "HEMATOLOGIE", nom: "INR",                                       prix: 5000,  ordre: 6  },
  { famille: "HEMATOLOGIE", nom: "VS",                                        prix: 3000,  ordre: 7  },
  { famille: "HEMATOLOGIE", nom: "Goutte Épaisse",                            prix: 5000,  ordre: 8  },
  { famille: "HEMATOLOGIE", nom: "Frottis Sanguin",                           prix: 5000,  ordre: 9  },
  { famille: "HEMATOLOGIE", nom: "RMF",                                       prix: 5000,  ordre: 10 },
  { famille: "HEMATOLOGIE", nom: "Électrophorèse de HB",                      prix: 15000, ordre: 11 },
  { famille: "HEMATOLOGIE", nom: "Héparinémie",                               prix: 15000, ordre: 12 },
  { famille: "HEMATOLOGIE", nom: "Hémocystémie",                              prix: 15000, ordre: 13 },
  { famille: "HEMATOLOGIE", nom: "Fibrinogène",                               prix: 10000, ordre: 14 },
  { famille: "HEMATOLOGIE", nom: "Antithrombine III",                         prix: 15000, ordre: 15 },
  { famille: "HEMATOLOGIE", nom: "Protéine C / Protéine S",                   prix: 20000, ordre: 16 },
  { famille: "HEMATOLOGIE", nom: "Facteur VIII et IX",                        prix: 25000, ordre: 17 },
  { famille: "HEMATOLOGIE", nom: "Recherche des anticorps irréguliers (RAI)", prix: 20000, ordre: 18 },
  // HORMONES
  { famille: "HORMONES", nom: "TSH US",     prix: 15000, ordre: 1 },
  { famille: "HORMONES", nom: "T3/T4",      prix: 20000, ordre: 2 },
  { famille: "HORMONES", nom: "PTH",        prix: 25000, ordre: 3 },
  { famille: "HORMONES", nom: "BHCG",       prix: 15000, ordre: 4 },
  { famille: "HORMONES", nom: "PROLACTINE", prix: 20000, ordre: 5 },
  { famille: "HORMONES", nom: "OESTRADIOL", prix: 20000, ordre: 6 },
  { famille: "HORMONES", nom: "LH",         prix: 20000, ordre: 7 },
  { famille: "HORMONES", nom: "FSH",        prix: 20000, ordre: 8 },
  // SEROLOGIE
  { famille: "SEROLOGIE", nom: "ASLO",           prix: 10000, ordre: 1  },
  { famille: "SEROLOGIE", nom: "BW (TPHA-VDRL)", prix: 10000, ordre: 2  },
  { famille: "SEROLOGIE", nom: "Widal et Felix", prix: 10000, ordre: 3  },
  { famille: "SEROLOGIE", nom: "Antigène HBs",   prix: 15000, ordre: 4  },
  { famille: "SEROLOGIE", nom: "HVC",            prix: 15000, ordre: 5  },
  { famille: "SEROLOGIE", nom: "Chlamydiae",     prix: 20000, ordre: 6  },
  { famille: "SEROLOGIE", nom: "VIH 1 et 2",     prix: 10000, ordre: 7  },
  { famille: "SEROLOGIE", nom: "Toxoplasmose",   prix: 15000, ordre: 8  },
  { famille: "SEROLOGIE", nom: "AMISE",          prix: 15000, ordre: 9  },
  { famille: "SEROLOGIE", nom: "Bilharziose",    prix: 15000, ordre: 10 },
  // BACTERIOLOGIE
  { famille: "BACTERIOLOGIE", nom: "ECBU",                            prix: 15000, ordre: 1 },
  { famille: "BACTERIOLOGIE", nom: "Hémoculture",                     prix: 25000, ordre: 2 },
  { famille: "BACTERIOLOGIE", nom: "PV",                              prix: 15000, ordre: 3 },
  { famille: "BACTERIOLOGIE", nom: "Mycoplasme",                      prix: 20000, ordre: 4 },
  { famille: "BACTERIOLOGIE", nom: "LCS",                             prix: 25000, ordre: 5 },
  { famille: "BACTERIOLOGIE", nom: "Coproculture",                    prix: 15000, ordre: 6 },
  { famille: "BACTERIOLOGIE", nom: "Liquide de ponction d'Ascite",    prix: 25000, ordre: 7 },
  { famille: "BACTERIOLOGIE", nom: "Liquide de ponction articulaire", prix: 25000, ordre: 8 },
  { famille: "BACTERIOLOGIE", nom: "Prélèvement local",               prix: 15000, ordre: 9 },
  // BIOCHIMIE
  { famille: "BIOCHIMIE", nom: "Urée",                                  prix: 3000,  ordre: 1  },
  { famille: "BIOCHIMIE", nom: "Créatinine",                            prix: 3000,  ordre: 2  },
  { famille: "BIOCHIMIE", nom: "Glycémie à jeun",                       prix: 3000,  ordre: 3  },
  { famille: "BIOCHIMIE", nom: "HbA1c (Hb Glyquée)",                    prix: 10000, ordre: 4  },
  { famille: "BIOCHIMIE", nom: "Calcémie",                              prix: 3000,  ordre: 5  },
  { famille: "BIOCHIMIE", nom: "Phosphore",                             prix: 3000,  ordre: 6  },
  { famille: "BIOCHIMIE", nom: "CRP",                                   prix: 5000,  ordre: 7  },
  { famille: "BIOCHIMIE", nom: "Magnésium",                             prix: 3000,  ordre: 8  },
  { famille: "BIOCHIMIE", nom: "Gamma GT",                              prix: 3000,  ordre: 9  },
  { famille: "BIOCHIMIE", nom: "Transaminases (ASAT/ALAT)",             prix: 5000,  ordre: 10 },
  { famille: "BIOCHIMIE", nom: "Bilirubine Totale",                     prix: 3000,  ordre: 11 },
  { famille: "BIOCHIMIE", nom: "Bilirubine Libre",                      prix: 3000,  ordre: 12 },
  { famille: "BIOCHIMIE", nom: "Phosphatases Alcalines (PAL)",          prix: 3000,  ordre: 13 },
  { famille: "BIOCHIMIE", nom: "Cholestérol Total",                     prix: 3000,  ordre: 14 },
  { famille: "BIOCHIMIE", nom: "HDL Cholestérol",                       prix: 3000,  ordre: 15 },
  { famille: "BIOCHIMIE", nom: "LDL Cholestérol",                       prix: 3000,  ordre: 16 },
  { famille: "BIOCHIMIE", nom: "Triglycérides",                         prix: 3000,  ordre: 17 },
  { famille: "BIOCHIMIE", nom: "Protidémie",                            prix: 3000,  ordre: 18 },
  { famille: "BIOCHIMIE", nom: "CPK",                                   prix: 5000,  ordre: 19 },
  { famille: "BIOCHIMIE", nom: "CPK-MB",                                prix: 8000,  ordre: 20 },
  { famille: "BIOCHIMIE", nom: "LDH",                                   prix: 5000,  ordre: 21 },
  { famille: "BIOCHIMIE", nom: "Fer Sérique",                           prix: 5000,  ordre: 22 },
  { famille: "BIOCHIMIE", nom: "Ferritine",                             prix: 8000,  ordre: 23 },
  { famille: "BIOCHIMIE", nom: "Ionogramme Sanguin Complet",            prix: 10000, ordre: 24 },
  { famille: "BIOCHIMIE", nom: "Lipasémie",                             prix: 5000,  ordre: 25 },
  { famille: "BIOCHIMIE", nom: "Amylasémie",                            prix: 5000,  ordre: 26 },
  { famille: "BIOCHIMIE", nom: "Électrophorèse de HB",                  prix: 15000, ordre: 27 },
  { famille: "BIOCHIMIE", nom: "Électrophorèse des Protéines Sériques", prix: 15000, ordre: 28 },
  { famille: "BIOCHIMIE", nom: "Vitamine D",                            prix: 15000, ordre: 29 },
  { famille: "BIOCHIMIE", nom: "Protéinurie",                           prix: 5000,  ordre: 30 },
  { famille: "BIOCHIMIE", nom: "Ionogramme Urinaire",                   prix: 5000,  ordre: 31 },
  { famille: "BIOCHIMIE", nom: "Bandelette Urinaire",                   prix: 2000,  ordre: 32 },
  { famille: "BIOCHIMIE", nom: "LCS (Biochimie)",                       prix: 15000, ordre: 33 },
  { famille: "BIOCHIMIE", nom: "Liquide d'Ascite (Biochimie)",          prix: 15000, ordre: 34 },
  { famille: "BIOCHIMIE", nom: "Liquide Pleural (Biochimie)",           prix: 15000, ordre: 35 },
  // IMMUNOLOGIE / MARQUEURS TUMORAUX
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "Facteur rhumatoïde",    prix: 10000, ordre: 1  },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "Waaler Rose",           prix: 10000, ordre: 2  },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "AC antiphospholipides", prix: 20000, ordre: 3  },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "AC anti CCP",           prix: 20000, ordre: 4  },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "AC anti SSA/SSB",       prix: 20000, ordre: 5  },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "AC antinucléaire",      prix: 20000, ordre: 6  },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "AC anti Musk",          prix: 25000, ordre: 7  },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "AC anti Rach",          prix: 25000, ordre: 8  },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "ACE",                   prix: 20000, ordre: 9  },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "Facteur intrinsèque",   prix: 20000, ordre: 10 },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "PSA",                   prix: 20000, ordre: 11 },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "CA 19-9",               prix: 25000, ordre: 12 },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "CA 125",                prix: 25000, ordre: 13 },
  { famille: "IMMUNOLOGIE / MARQUEURS TUMORAUX", nom: "CA 15-3",               prix: 25000, ordre: 14 },
];

// ============================================================
// PERMISSIONS PAR DÉFAUT
// ============================================================
const PERMISSIONS_DEFAUT: Array<{
  role:           Role;
  module:         string;
  peut_voir:      boolean;
  peut_creer:     boolean;
  peut_modifier:  boolean;
  peut_supprimer: boolean;
}> = [
  // MEDECIN
  { role: "MEDECIN", module: "PATIENT",         peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
  { role: "MEDECIN", module: "CONSULTATION",    peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
  { role: "MEDECIN", module: "RENDEZ_VOUS",     peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
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
  { role: "INFIRMIER", module: "RENDEZ_VOUS",     peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: false },
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
  { role: "LABORANTIN", module: "RENDEZ_VOUS",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
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
  { role: "RADIOLOGUE", module: "RENDEZ_VOUS",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
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
  { role: "PHARMACIEN", module: "RENDEZ_VOUS",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
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
  { role: "COMPTABLE", module: "RENDEZ_VOUS",     peut_voir: false, peut_creer: false, peut_modifier: false, peut_supprimer: false },
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
  // L'accueil est le principal gestionnaire des rendez-vous
  { role: "ADMINISTRATIF", module: "RENDEZ_VOUS",     peut_voir: true,  peut_creer: true,  peut_modifier: true,  peut_supprimer: true  },
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

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("🌱 Seed SANTÉGAB v4 — 3 derniers mois (2026-01-26 → 2026-04-26)");

  // ----------------------------------------------------------
  // 1. NETTOYAGE — sauf utilisateurs et hospitals
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
  await prisma.examenLaboExamen.deleteMany();
  await prisma.examenLabo.deleteMany();
  await prisma.examenImagerie.deleteMany();
  await prisma.ligneFacture.deleteMany();
  await prisma.facture.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.examenCatalogue.deleteMany();
  await prisma.service.deleteMany();
  await prisma.patientHospital.deleteMany();
  await prisma.patient.deleteMany();
  console.log("🗑️  Données métier vidées (utilisateurs et hôpital conservés)");

  // ----------------------------------------------------------
  // 2. HÔPITAL — créé si inexistant
  // ----------------------------------------------------------
  const hospital = await prisma.hospital.upsert({
    where:  { id: HOSPITAL_ID },
    update: {},
    create: {
      id:        HOSPITAL_ID,
      nom:       "Clinique El Rapha",
      adresse:   "Boulevard Triomphal Omar Bongo, BP 2234",
      ville:     "Libreville",
      telephone: "+241 01 72 34 56",
      email:     "contact@elrapha.ga",
      est_actif: true,
    },
  });
  console.log(`🏥 Hôpital : ${hospital.nom}`);

  // ----------------------------------------------------------
  // 3. UTILISATEURS — récupération uniquement
  // ----------------------------------------------------------
  const users = await prisma.utilisateur.findMany({
    where: { hospital_id: HOSPITAL_ID },
  });
  if (users.length === 0) {
    throw new Error("Aucun utilisateur trouvé. Crée-les d'abord (cf. ancien seed).");
  }
  const findUser = (email: string) => {
    const u = users.find((x) => x.email === email);
    if (!u) throw new Error(`Utilisateur introuvable : ${email}`);
    return u;
  };
  const admin      = findUser("admin@elrapha.ga");
  const medecin1   = findUser("p.nguema@elrapha.ga");
  const medecin2   = findUser("s.mba@elrapha.ga");
  const infirmier  = findUser("jp.obame@elrapha.ga");
  const comptable  = findUser("c.ella@elrapha.ga");
  const laborantin = findUser("b.bourobou@elrapha.ga");
  const pharmacien = findUser("f.moussavou@elrapha.ga");
  console.log(`👥 ${users.length} utilisateurs récupérés`);

  // ----------------------------------------------------------
  // 4. PERMISSIONS PAR DÉFAUT
  // ----------------------------------------------------------
  await Promise.all(
    PERMISSIONS_DEFAUT.map((p) =>
      prisma.permission.create({
        data: {
          hospital_id:    hospital.id,
          role:           p.role,
          module:         p.module,
          peut_voir:      p.peut_voir,
          peut_creer:     p.peut_creer,
          peut_modifier:  p.peut_modifier,
          peut_supprimer: p.peut_supprimer,
        },
      })
    )
  );
  console.log(`🔐 ${PERMISSIONS_DEFAUT.length} permissions créées`);

  // ----------------------------------------------------------
  // 5. SERVICES MÉDICAUX
  // ----------------------------------------------------------
  const servicesData = [
    { nom: "Médecine générale", couleur: "#3b82f6", description: "Consultations généralistes et suivi"   },
    { nom: "Pédiatrie",          couleur: "#10b981", description: "Soins enfants et nourrissons"           },
    { nom: "Cardiologie",        couleur: "#ef4444", description: "Maladies cardiovasculaires"             },
    { nom: "Gynécologie",        couleur: "#ec4899", description: "Suivi gynécologique et obstétrique"     },
    { nom: "Médecine interne",   couleur: "#8b5cf6", description: "Pathologies internes et hospitalisation"},
  ];
  const services = await Promise.all(
    servicesData.map((s) =>
      prisma.service.create({
        data: { hospital_id: hospital.id, ...s, est_actif: true },
      })
    )
  );
  console.log(`🩺 ${services.length} services créés`);

  // ----------------------------------------------------------
  // 6. CHAMBRES
  // ----------------------------------------------------------
  const chambresData = [
    { numero: "101",    type: "COMMUNE",     prix: 8000,   desc: "Chambre commune 4 lits — Ventilateur — WC partagé" },
    { numero: "102",    type: "COMMUNE",     prix: 8000,   desc: "Chambre commune 4 lits — Ventilateur — WC partagé" },
    { numero: "103",    type: "COMMUNE",     prix: 8000,   desc: "Chambre commune 4 lits — Ventilateur — WC partagé" },
    { numero: "201",    type: "PRIVEE",      prix: 25000,  desc: "Chambre privée — Climatisation — SDB — TV" },
    { numero: "202",    type: "PRIVEE",      prix: 25000,  desc: "Chambre privée — Climatisation — SDB — TV" },
    { numero: "203",    type: "PRIVEE",      prix: 25000,  desc: "Chambre privée — Climatisation — SDB — TV" },
    { numero: "VIP-01", type: "VIP",         prix: 75000,  desc: "Suite VIP — Climatisation — Salon — TV — WiFi — Repas inclus" },
    { numero: "VIP-02", type: "VIP",         prix: 75000,  desc: "Suite VIP — Climatisation — Salon — TV — WiFi — Repas inclus" },
    { numero: "REA-01", type: "REANIMATION", prix: 120000, desc: "Unité réanimation — Monitoring continu — Ventilateur" },
    { numero: "REA-02", type: "REANIMATION", prix: 120000, desc: "Unité réanimation — Monitoring continu — Ventilateur" },
  ];
  const chambres = await Promise.all(
    chambresData.map((c) =>
      prisma.chambre.create({
        data: {
          hospital_id:     hospital.id,
          numero:          c.numero,
          type_chambre:    c.type,
          prix_journalier: c.prix,
          est_disponible:  true,
          description:     c.desc,
        },
      })
    )
  );
  console.log(`🛏️  ${chambres.length} chambres créées`);

  // ----------------------------------------------------------
  // 7. CATALOGUE EXAMENS LABO
  // ----------------------------------------------------------
  const catalogue = await Promise.all(
    CATALOGUE_LABO.map((c) =>
      prisma.examenCatalogue.create({
        data: {
          hospital_id: hospital.id,
          famille:     c.famille,
          nom:         c.nom,
          prix:        c.prix,
          ordre:       c.ordre,
          actif:       true,
        },
      })
    )
  );
  console.log(`🧪 ${catalogue.length} examens catalogue créés`);

  // Helper : retrouve un examen catalogue par nom
  const cat = (nom: string) => {
    const c = catalogue.find((x) => x.nom === nom);
    if (!c) throw new Error(`Catalogue : "${nom}" introuvable`);
    return c;
  };

  // ----------------------------------------------------------
  // 8. PATIENTS — 25 patients gabonais
  // ----------------------------------------------------------
  const patientsData = [
    { numero: "PAT-2026-00001", nom: "NZIGOU",       prenom: "Alphonse",   sexe: "MASCULIN" as const, naissance: "1978-03-15", telephone: "+241 07 23 45 67", groupe: "A+",  assurance: "CNAMGS",  taux: 80, allergies: "Pénicilline", antecedents: "Gastrite chronique diagnostiquée en 2020" },
    { numero: "PAT-2026-00002", nom: "MOUSSAVOU",    prenom: "Estelle",    sexe: "FEMININ"  as const, naissance: "1990-07-22", telephone: "+241 06 34 56 78", groupe: "O+",  assurance: "ASCOMA",  taux: 70, allergies: null,           antecedents: null },
    { numero: "PAT-2026-00003", nom: "BOUROBOU",     prenom: "Gaston",     sexe: "MASCULIN" as const, naissance: "1965-11-08", telephone: "+241 07 45 67 89", groupe: "B+",  assurance: "CNAMGS",  taux: 80, allergies: "Aspirine",     antecedents: "Hypertension artérielle depuis 2015" },
    { numero: "PAT-2026-00004", nom: "MBOUMBA",      prenom: "Sylvie",     sexe: "FEMININ"  as const, naissance: "1985-04-30", telephone: "+241 06 56 78 90", groupe: "AB+", assurance: "AXA",     taux: 90, allergies: null,           antecedents: "Grossesse en cours — 24 SA" },
    { numero: "PAT-2026-00005", nom: "NKOGHE",       prenom: "Rodrigue",   sexe: "MASCULIN" as const, naissance: "1995-01-12", telephone: "+241 07 67 89 01", groupe: "A-",  assurance: null,      taux:  0, allergies: null,           antecedents: null },
    { numero: "PAT-2026-00006", nom: "OVONO",        prenom: "Nadège",     sexe: "FEMININ"  as const, naissance: "1982-09-18", telephone: "+241 06 78 90 12", groupe: "O-",  assurance: "OGAR",    taux: 75, allergies: "Latex",        antecedents: "Allergie cutanée diagnostiquée en 2018" },
    { numero: "PAT-2026-00007", nom: "MOUNGUENGUI",  prenom: "Patrick",    sexe: "MASCULIN" as const, naissance: "1970-06-25", telephone: "+241 07 89 01 23", groupe: "B-",  assurance: "CNAMGS",  taux: 80, allergies: null,           antecedents: "Diabète type 2 depuis 2019" },
    { numero: "PAT-2026-00008", nom: "KOUMBA",       prenom: "Félicité",   sexe: "FEMININ"  as const, naissance: "1998-12-03", telephone: "+241 06 90 12 34", groupe: "A+",  assurance: "Sunu",    taux: 60, allergies: null,           antecedents: null },
    { numero: "PAT-2026-00009", nom: "NDONG",        prenom: "Emmanuel",   sexe: "MASCULIN" as const, naissance: "1955-08-14", telephone: "+241 07 01 23 45", groupe: "O+",  assurance: "ASCOMA",  taux: 70, allergies: "Morphine",     antecedents: "Diabète type 2, HTA, cardiopathie ischémique" },
    { numero: "PAT-2026-00010", nom: "BEKALE",       prenom: "Lucie",      sexe: "FEMININ"  as const, naissance: "2001-02-28", telephone: "+241 06 12 34 50", groupe: "AB-", assurance: "CNAMGS",  taux: 80, allergies: null,           antecedents: null },
    { numero: "PAT-2026-00011", nom: "OBAME",        prenom: "Théodore",   sexe: "MASCULIN" as const, naissance: "1962-04-19", telephone: "+241 07 11 22 33", groupe: "A+",  assurance: "CNAMGS",  taux: 80, allergies: null,           antecedents: "BPCO — ancien tabagique" },
    { numero: "PAT-2026-00012", nom: "MIHINDOU",     prenom: "Carine",     sexe: "FEMININ"  as const, naissance: "1988-10-05", telephone: "+241 06 22 33 44", groupe: "O+",  assurance: "AXA",     taux: 90, allergies: null,           antecedents: "Asthme intermittent" },
    { numero: "PAT-2026-00013", nom: "ESSONO",       prenom: "Bernard",    sexe: "MASCULIN" as const, naissance: "1975-07-12", telephone: "+241 07 33 44 55", groupe: "B+",  assurance: null,      taux:  0, allergies: "Sulfamides",   antecedents: null },
    { numero: "PAT-2026-00014", nom: "BIYOGHE",      prenom: "Solange",    sexe: "FEMININ"  as const, naissance: "1992-03-25", telephone: "+241 06 44 55 66", groupe: "A-",  assurance: "OGAR",    taux: 75, allergies: null,           antecedents: null },
    { numero: "PAT-2026-00015", nom: "MBA",          prenom: "Joseph",     sexe: "MASCULIN" as const, naissance: "1980-12-18", telephone: "+241 07 55 66 77", groupe: "O-",  assurance: "CNAMGS",  taux: 80, allergies: null,           antecedents: "Ulcère gastrique 2022" },
    { numero: "PAT-2026-00016", nom: "NTOUTOUME",    prenom: "Yolande",    sexe: "FEMININ"  as const, naissance: "1996-06-30", telephone: "+241 06 66 77 88", groupe: "AB+", assurance: "ASCOMA",  taux: 70, allergies: null,           antecedents: null },
    { numero: "PAT-2026-00017", nom: "NGUEMBI",      prenom: "Henri",      sexe: "MASCULIN" as const, naissance: "1968-09-09", telephone: "+241 07 77 88 99", groupe: "A+",  assurance: "CNAMGS",  taux: 80, allergies: "Iode",         antecedents: "HTA — IDM 2021" },
    { numero: "PAT-2026-00018", nom: "DIVOUNGUI",    prenom: "Aimée",      sexe: "FEMININ"  as const, naissance: "1984-01-14", telephone: "+241 06 88 99 00", groupe: "B-",  assurance: "Sunu",    taux: 60, allergies: null,           antecedents: null },
    { numero: "PAT-2026-00019", nom: "MOUKAGNI",     prenom: "Léon",       sexe: "MASCULIN" as const, naissance: "1972-11-02", telephone: "+241 07 99 00 11", groupe: "O+",  assurance: "AXA",     taux: 90, allergies: null,           antecedents: "Dyslipidémie" },
    { numero: "PAT-2026-00020", nom: "NKOUMBA",      prenom: "Bénédicte",  sexe: "FEMININ"  as const, naissance: "1999-05-21", telephone: "+241 06 00 11 22", groupe: "A+",  assurance: null,      taux:  0, allergies: null,           antecedents: null },
    { numero: "PAT-2026-00021", nom: "ANGUE",        prenom: "Christian",  sexe: "MASCULIN" as const, naissance: "1958-08-08", telephone: "+241 07 12 13 14", groupe: "B+",  assurance: "CNAMGS",  taux: 80, allergies: null,           antecedents: "Insuffisance rénale chronique stade 3" },
    { numero: "PAT-2026-00022", nom: "MBADINGA",     prenom: "Patricia",   sexe: "FEMININ"  as const, naissance: "1991-02-17", telephone: "+241 06 13 14 15", groupe: "O+",  assurance: "OGAR",    taux: 75, allergies: null,           antecedents: null },
    { numero: "PAT-2026-00023", nom: "MIHINDOU",     prenom: "Robert",     sexe: "MASCULIN" as const, naissance: "1986-10-23", telephone: "+241 07 14 15 16", groupe: "AB+", assurance: "ASCOMA",  taux: 70, allergies: "Pénicilline", antecedents: null },
    { numero: "PAT-2026-00024", nom: "NDOUNA",       prenom: "Mireille",   sexe: "FEMININ"  as const, naissance: "1979-04-04", telephone: "+241 06 15 16 17", groupe: "A-",  assurance: "CNAMGS",  taux: 80, allergies: null,           antecedents: "Hypothyroïdie sous lévothyrox" },
    { numero: "PAT-2026-00025", nom: "MOUSSIROU",    prenom: "Olivier",    sexe: "MASCULIN" as const, naissance: "2003-07-07", telephone: "+241 07 16 17 18", groupe: "O+",  assurance: null,      taux:  0, allergies: null,           antecedents: null },
  ];

  const patients = await Promise.all(
    patientsData.map((p) =>
      prisma.patient.create({
        data: {
          numero_dossier: p.numero,
          nom:            p.nom,
          prenom:         p.prenom,
          sexe:           p.sexe,
          date_naissance: new Date(p.naissance),
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
  console.log(`🧑 ${patients.length} patients créés`);

  // ----------------------------------------------------------
  // 9. STOCK PHARMACIE
  // ----------------------------------------------------------
  const articlesData = [
    { nom: "Paracétamol 500mg",         categorie: "MEDICAMENT"  as const, unite: "comprimé", stock: 800, seuil: 100, prix: 150,   code: "MED-001" },
    { nom: "Amoxicilline 500mg",        categorie: "MEDICAMENT"  as const, unite: "gélule",   stock: 320, seuil: 50,  prix: 350,   code: "MED-002" },
    { nom: "Artémether/Luméfantrine",   categorie: "MEDICAMENT"  as const, unite: "comprimé", stock: 240, seuil: 40,  prix: 800,   code: "MED-003" },
    { nom: "Oméprazole 20mg",           categorie: "MEDICAMENT"  as const, unite: "gélule",   stock: 380, seuil: 60,  prix: 250,   code: "MED-004" },
    { nom: "Metformine 850mg",          categorie: "MEDICAMENT"  as const, unite: "comprimé", stock: 540, seuil: 80,  prix: 200,   code: "MED-005" },
    { nom: "Amlodipine 5mg",            categorie: "MEDICAMENT"  as const, unite: "comprimé", stock: 18,  seuil: 50,  prix: 300,   code: "MED-006" },
    { nom: "Périndopril 4mg",           categorie: "MEDICAMENT"  as const, unite: "comprimé", stock: 220, seuil: 40,  prix: 350,   code: "MED-007" },
    { nom: "Ceftriaxone 1g IV",         categorie: "MEDICAMENT"  as const, unite: "flacon",   stock: 75,  seuil: 20,  prix: 4500,  code: "MED-008" },
    { nom: "Insuline rapide 100UI/ml",  categorie: "MEDICAMENT"  as const, unite: "flacon",   stock: 28,  seuil: 10,  prix: 8500,  code: "MED-009" },
    { nom: "Cétirizine 10mg",           categorie: "MEDICAMENT"  as const, unite: "comprimé", stock: 150, seuil: 30,  prix: 200,   code: "MED-010" },
    { nom: "Sérum physiologique 500ml", categorie: "CONSOMMABLE" as const, unite: "flacon",   stock: 90,  seuil: 20,  prix: 2500,  code: "CON-001" },
    { nom: "Gants stériles",            categorie: "CONSOMMABLE" as const, unite: "paire",    stock: 320, seuil: 80,  prix: 500,   code: "CON-002" },
    { nom: "Seringues 5ml",             categorie: "CONSOMMABLE" as const, unite: "unité",    stock: 600, seuil: 150, prix: 150,   code: "CON-003" },
    { nom: "Compresses stériles",       categorie: "CONSOMMABLE" as const, unite: "paquet",   stock: 240, seuil: 50,  prix: 800,   code: "CON-004" },
    { nom: "Tensiomètre électronique",  categorie: "EQUIPEMENT"  as const, unite: "unité",    stock: 4,   seuil: 1,   prix: 45000, code: "EQP-001" },
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

  // Mouvement d'entrée initial pour chaque article (approvisionnement de janvier)
  for (const article of articles) {
    await prisma.mouvementStock.create({
      data: {
        hospital_id:    hospital.id,
        article_id:     article.id,
        type_mouvement: "ENTREE",
        quantite:       article.quantite_stock,
        quantite_avant: 0,
        quantite_apres: article.quantite_stock,
        motif:          "Approvisionnement initial — Janvier 2026",
        utilisateur_id: pharmacien.id,
        created_at:     addDays(DEBUT, 0, 8),
      },
    });
  }
  console.log(`💊 ${articles.length} articles + entrées stock créés`);

  // ----------------------------------------------------------
  // 10. CONSULTATIONS + PRESCRIPTIONS + FACTURES
  // 60 consultations réparties sur 90 jours (~5/sem, 4 jours actifs/sem)
  // ----------------------------------------------------------
  type ConsultationDef = {
    pIdx: number; mIdx: 0 | 1; sIdx: number;
    dayOffset: number; hour: number;
    motif: string; diagnostic: string | null;
    poids: number; taille: number; tension: string; temp: number;
    statut: "TERMINEE" | "EN_ATTENTE" | "EN_COURS" | "ANNULEE";
    facture: "PAYEE" | "EN_ATTENTE";
    paiement: "ESPECES" | "ASSURANCE" | "MOBILE_MONEY" | "CARTE_BANCAIRE" | null;
    rx: Array<{ medicament: string; dosage: string; frequence: string; duree: string }>;
  };

  const consultationsData: ConsultationDef[] = [
    // ── Semaine 1 (jours 0-6) — fin janvier 2026
    { pIdx: 0,  mIdx: 0, sIdx: 0, dayOffset: 0,  hour: 9,  motif: "Douleurs abdominales chroniques",       diagnostic: "Récidive gastrite chronique",                poids: 78, taille: 175, tension: "13/8",  temp: 37.2, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Oméprazole 20mg", dosage: "1 gélule", frequence: "Matin à jeun", duree: "30 jours" }] },
    { pIdx: 1,  mIdx: 1, sIdx: 0, dayOffset: 1,  hour: 10, motif: "Bilan annuel",                          diagnostic: "État de santé satisfaisant",                  poids: 62, taille: 165, tension: "12/7",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 2,  mIdx: 0, sIdx: 2, dayOffset: 2,  hour: 8,  motif: "Contrôle tension artérielle",           diagnostic: "HTA stade 2 — équilibrée",                    poids: 92, taille: 178, tension: "14/9",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Amlodipine 5mg", dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" }, { medicament: "Périndopril 4mg", dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" }] },
    { pIdx: 3,  mIdx: 1, sIdx: 3, dayOffset: 3,  hour: 11, motif: "1ère consultation prénatale",            diagnostic: "Grossesse 16 SA — évolution normale",         poids: 68, taille: 162, tension: "12/7",  temp: 37.0, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Fer + Acide folique", dosage: "1 comprimé", frequence: "1 fois/jour", duree: "60 jours" }] },
    { pIdx: 4,  mIdx: 0, sIdx: 0, dayOffset: 4,  hour: 14, motif: "Douleur genou droit après chute",        diagnostic: "Entorse du genou modérée",                    poids: 75, taille: 180, tension: "12/8",  temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES",
      rx: [{ medicament: "Paracétamol 500mg", dosage: "2 comprimés", frequence: "3 fois/jour", duree: "5 jours" }] },
    // ── Semaine 2
    { pIdx: 5,  mIdx: 1, sIdx: 0, dayOffset: 7,  hour: 9,  motif: "Éruption cutanée généralisée",            diagnostic: "Dermatite allergique",                        poids: 58, taille: 160, tension: "11/7",  temp: 37.1, statut: "TERMINEE", facture: "PAYEE", paiement: "MOBILE_MONEY",
      rx: [{ medicament: "Cétirizine 10mg", dosage: "1 comprimé", frequence: "Le soir", duree: "7 jours" }] },
    { pIdx: 6,  mIdx: 0, sIdx: 0, dayOffset: 8,  hour: 8,  motif: "Suivi diabète mensuel",                  diagnostic: "Diabète type 2 — déséquilibré",                poids: 88, taille: 172, tension: "14/9",  temp: 37.0, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Metformine 850mg", dosage: "1 comprimé", frequence: "Matin et soir au repas", duree: "30 jours" }] },
    { pIdx: 7,  mIdx: 1, sIdx: 0, dayOffset: 9,  hour: 10, motif: "Brûlures mictionnelles",                 diagnostic: "Suspicion infection urinaire",                poids: 55, taille: 163, tension: "11/7",  temp: 38.2, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES",
      rx: [{ medicament: "Amoxicilline 500mg", dosage: "1 gélule", frequence: "3 fois/jour", duree: "7 jours" }] },
    { pIdx: 8,  mIdx: 0, sIdx: 2, dayOffset: 10, hour: 9,  motif: "Douleurs thoraciques d'effort",          diagnostic: "Angor stable — coronaropathie connue",        poids: 70, taille: 168, tension: "15/9",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Périndopril 4mg", dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" }] },
    { pIdx: 9,  mIdx: 1, sIdx: 1, dayOffset: 11, hour: 11, motif: "Toux persistante",                       diagnostic: "Bronchite aiguë",                              poids: 52, taille: 158, tension: "11/7",  temp: 37.8, statut: "TERMINEE", facture: "PAYEE", paiement: "MOBILE_MONEY",
      rx: [{ medicament: "Amoxicilline 500mg", dosage: "1 gélule", frequence: "3 fois/jour", duree: "7 jours" }] },
    // ── Semaine 3
    { pIdx: 10, mIdx: 0, sIdx: 4, dayOffset: 14, hour: 9,  motif: "Dyspnée d'effort",                       diagnostic: "BPCO modérée — exacerbation",                 poids: 68, taille: 170, tension: "13/8",  temp: 37.2, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Ceftriaxone 1g IV", dosage: "1 flacon", frequence: "1 fois/jour", duree: "5 jours" }] },
    { pIdx: 11, mIdx: 1, sIdx: 0, dayOffset: 15, hour: 10, motif: "Crise d'asthme",                          diagnostic: "Asthme — crise modérée",                       poids: 60, taille: 165, tension: "12/8",  temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 12, mIdx: 0, sIdx: 0, dayOffset: 16, hour: 14, motif: "Fièvre + courbatures",                   diagnostic: "Suspicion paludisme",                          poids: 80, taille: 175, tension: "12/8",  temp: 39.1, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES",
      rx: [{ medicament: "Artémether/Luméfantrine", dosage: "4 comprimés", frequence: "2 fois/jour", duree: "3 jours" }, { medicament: "Paracétamol 500mg", dosage: "2 comprimés", frequence: "Toutes les 6h", duree: "3 jours" }] },
    { pIdx: 13, mIdx: 1, sIdx: 3, dayOffset: 17, hour: 11, motif: "Suivi prénatal — 20 SA",                  diagnostic: "Grossesse normale",                            poids: 65, taille: 168, tension: "11/7",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 14, mIdx: 0, sIdx: 0, dayOffset: 18, hour: 9,  motif: "Épigastralgies",                          diagnostic: "Récidive ulcéreuse",                           poids: 75, taille: 173, tension: "12/8",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Oméprazole 20mg", dosage: "1 gélule", frequence: "Matin à jeun", duree: "30 jours" }] },
    // ── Semaine 4
    { pIdx: 15, mIdx: 1, sIdx: 1, dayOffset: 21, hour: 10, motif: "Douleur otalgique",                       diagnostic: "Otite moyenne aiguë",                          poids: 56, taille: 162, tension: "11/7",  temp: 38.3, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES",
      rx: [{ medicament: "Amoxicilline 500mg", dosage: "1 gélule", frequence: "3 fois/jour", duree: "7 jours" }] },
    { pIdx: 16, mIdx: 0, sIdx: 2, dayOffset: 22, hour: 8,  motif: "Suivi post-IDM",                          diagnostic: "Coronaropathie stable",                        poids: 78, taille: 170, tension: "13/8",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Amlodipine 5mg", dosage: "1 comprimé", frequence: "Le matin", duree: "30 jours" }] },
    { pIdx: 17, mIdx: 1, sIdx: 0, dayOffset: 23, hour: 11, motif: "Maux de tête persistants",               diagnostic: "Migraine sans aura",                           poids: 64, taille: 167, tension: "12/7",  temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "MOBILE_MONEY",
      rx: [{ medicament: "Paracétamol 500mg", dosage: "2 comprimés", frequence: "Au besoin", duree: "10 jours" }] },
    { pIdx: 18, mIdx: 0, sIdx: 4, dayOffset: 24, hour: 14, motif: "Dyslipidémie — bilan",                    diagnostic: "Dyslipidémie mixte",                           poids: 82, taille: 174, tension: "13/8",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 19, mIdx: 1, sIdx: 0, dayOffset: 25, hour: 9,  motif: "Asthénie + perte de poids",               diagnostic: "À explorer — bilan demandé",                   poids: 51, taille: 165, tension: "10/6",  temp: 37.0, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES", rx: [] },
    // ── Semaine 5
    { pIdx: 20, mIdx: 0, sIdx: 4, dayOffset: 28, hour: 9,  motif: "Œdèmes des membres inférieurs",           diagnostic: "Décompensation IRC",                           poids: 72, taille: 168, tension: "16/10", temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 21, mIdx: 1, sIdx: 3, dayOffset: 29, hour: 11, motif: "Douleurs pelviennes",                     diagnostic: "Salpingite probable",                          poids: 60, taille: 164, tension: "11/7",  temp: 38.0, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Amoxicilline 500mg", dosage: "1 gélule", frequence: "3 fois/jour", duree: "10 jours" }] },
    { pIdx: 22, mIdx: 0, sIdx: 0, dayOffset: 30, hour: 14, motif: "Vertige + nausées",                       diagnostic: "Vertige paroxystique bénin",                   poids: 70, taille: 172, tension: "12/8",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 23, mIdx: 1, sIdx: 0, dayOffset: 31, hour: 10, motif: "Suivi hypothyroïdie",                     diagnostic: "Hypothyroïdie équilibrée",                     poids: 66, taille: 166, tension: "11/7",  temp: 36.6, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 24, mIdx: 0, sIdx: 1, dayOffset: 32, hour: 9,  motif: "Plaie infectée à la main",                diagnostic: "Plaie surinfectée",                            poids: 70, taille: 178, tension: "12/8",  temp: 37.5, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES",
      rx: [{ medicament: "Amoxicilline 500mg", dosage: "1 gélule", frequence: "3 fois/jour", duree: "7 jours" }] },
    // ── Semaine 6 — Mars 2026
    { pIdx: 0,  mIdx: 0, sIdx: 0, dayOffset: 35, hour: 9,  motif: "Contrôle gastrite",                       diagnostic: "Gastrite stabilisée",                          poids: 79, taille: 175, tension: "13/8",  temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 6,  mIdx: 0, sIdx: 0, dayOffset: 36, hour: 8,  motif: "Suivi diabète",                           diagnostic: "Diabète type 2 — meilleur équilibre",          poids: 87, taille: 172, tension: "13/8",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Metformine 850mg", dosage: "1 comprimé", frequence: "Matin et soir au repas", duree: "30 jours" }] },
    { pIdx: 3,  mIdx: 1, sIdx: 3, dayOffset: 37, hour: 11, motif: "3ème consultation prénatale",             diagnostic: "Grossesse 22 SA",                              poids: 70, taille: 162, tension: "12/7",  temp: 37.0, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 11, mIdx: 1, sIdx: 0, dayOffset: 38, hour: 10, motif: "Asthme — bilan",                          diagnostic: "Asthme stabilisé",                              poids: 60, taille: 165, tension: "12/8",  temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 8,  mIdx: 0, sIdx: 2, dayOffset: 39, hour: 9,  motif: "Bilan cardiologique annuel",              diagnostic: "Coronaropathie stable",                        poids: 71, taille: 168, tension: "14/9",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    // ── Semaine 7
    { pIdx: 25, mIdx: 0, sIdx: 0, dayOffset: 42, hour: 9,  motif: "Première consultation",                   diagnostic: "État de santé normal",                         poids: 65, taille: 175, tension: "12/8",  temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES", rx: [] },
    { pIdx: 12, mIdx: 1, sIdx: 0, dayOffset: 43, hour: 10, motif: "Crise d'asthme nocturne",                 diagnostic: "Asthme — crise modérée",                       poids: 60, taille: 165, tension: "12/8",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 16, mIdx: 0, sIdx: 2, dayOffset: 44, hour: 8,  motif: "Suivi cardiologique",                     diagnostic: "Coronaropathie stable",                        poids: 78, taille: 170, tension: "13/8",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 17, mIdx: 1, sIdx: 0, dayOffset: 45, hour: 11, motif: "Migraine récurrente",                     diagnostic: "Migraine chronique",                            poids: 64, taille: 167, tension: "12/7",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Paracétamol 500mg", dosage: "2 comprimés", frequence: "Au besoin", duree: "15 jours" }] },
    { pIdx: 14, mIdx: 0, sIdx: 0, dayOffset: 46, hour: 14, motif: "Bilan ulcère",                             diagnostic: "Ulcère cicatrisé",                              poids: 76, taille: 173, tension: "12/8",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    // ── Semaine 8
    { pIdx: 4,  mIdx: 0, sIdx: 0, dayOffset: 49, hour: 9,  motif: "Contrôle genou",                          diagnostic: "Bonne récupération",                            poids: 75, taille: 180, tension: "12/8",  temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES", rx: [] },
    { pIdx: 5,  mIdx: 1, sIdx: 0, dayOffset: 50, hour: 10, motif: "Récidive éruption",                       diagnostic: "Dermatite — exposition latex",                  poids: 58, taille: 160, tension: "11/7",  temp: 37.0, statut: "TERMINEE", facture: "PAYEE", paiement: "MOBILE_MONEY",
      rx: [{ medicament: "Cétirizine 10mg", dosage: "1 comprimé", frequence: "Le soir", duree: "10 jours" }] },
    { pIdx: 18, mIdx: 0, sIdx: 4, dayOffset: 51, hour: 9,  motif: "Bilan dyslipidémie",                      diagnostic: "Dyslipidémie — meilleur contrôle",              poids: 81, taille: 174, tension: "13/8",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 19, mIdx: 1, sIdx: 0, dayOffset: 52, hour: 11, motif: "Bilan asthénie suite",                    diagnostic: "Anémie ferriprive",                             poids: 50, taille: 165, tension: "10/6",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES", rx: [] },
    { pIdx: 20, mIdx: 0, sIdx: 4, dayOffset: 53, hour: 9,  motif: "Suivi IRC",                                diagnostic: "IRC stade 3 — stable",                          poids: 71, taille: 168, tension: "15/9",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    // ── Semaine 9
    { pIdx: 21, mIdx: 1, sIdx: 3, dayOffset: 56, hour: 11, motif: "Contrôle salpingite",                     diagnostic: "Guérison",                                       poids: 60, taille: 164, tension: "11/7",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 22, mIdx: 0, sIdx: 0, dayOffset: 57, hour: 9,  motif: "Vertige — récidive",                      diagnostic: "VPPB — récidive",                               poids: 70, taille: 172, tension: "12/8",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 23, mIdx: 1, sIdx: 0, dayOffset: 58, hour: 10, motif: "Bilan thyroïdien",                        diagnostic: "Hypothyroïdie équilibrée",                       poids: 66, taille: 166, tension: "11/7",  temp: 36.6, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 9,  mIdx: 0, sIdx: 0, dayOffset: 59, hour: 8,  motif: "Suivi général",                            diagnostic: "Pathologies chroniques stables",                 poids: 72, taille: 170, tension: "14/8",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 13, mIdx: 1, sIdx: 0, dayOffset: 60, hour: 11, motif: "Allergie sulfamides — bilan",             diagnostic: "Allergie confirmée",                             poids: 68, taille: 170, tension: "12/8",  temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES", rx: [] },
    // ── Semaine 10 — début avril 2026
    { pIdx: 1,  mIdx: 1, sIdx: 0, dayOffset: 63, hour: 10, motif: "Bilan trimestriel",                        diagnostic: "Pas d'anomalie",                                 poids: 62, taille: 165, tension: "12/7",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 2,  mIdx: 0, sIdx: 2, dayOffset: 64, hour: 8,  motif: "Suivi tension",                            diagnostic: "HTA équilibrée",                                 poids: 91, taille: 178, tension: "13/8",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 3,  mIdx: 1, sIdx: 3, dayOffset: 65, hour: 11, motif: "5ème consultation prénatale",              diagnostic: "Grossesse 28 SA",                                poids: 73, taille: 162, tension: "12/7",  temp: 37.0, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 6,  mIdx: 0, sIdx: 0, dayOffset: 66, hour: 9,  motif: "Suivi diabète",                            diagnostic: "Diabète mieux équilibré",                        poids: 86, taille: 172, tension: "13/8",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE",
      rx: [{ medicament: "Metformine 850mg", dosage: "1 comprimé", frequence: "Matin et soir au repas", duree: "30 jours" }] },
    { pIdx: 17, mIdx: 1, sIdx: 0, dayOffset: 67, hour: 14, motif: "Migraine — adaptation traitement",         diagnostic: "Migraine chronique",                             poids: 64, taille: 167, tension: "12/7",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    // ── Semaine 11
    { pIdx: 24, mIdx: 0, sIdx: 0, dayOffset: 70, hour: 9,  motif: "Contrôle plaie",                           diagnostic: "Cicatrisation complète",                         poids: 70, taille: 178, tension: "12/8",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES", rx: [] },
    { pIdx: 7,  mIdx: 1, sIdx: 0, dayOffset: 71, hour: 10, motif: "Récidive infection urinaire",              diagnostic: "Cystite récidivante",                            poids: 56, taille: 163, tension: "11/7",  temp: 37.5, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES",
      rx: [{ medicament: "Amoxicilline 500mg", dosage: "1 gélule", frequence: "3 fois/jour", duree: "7 jours" }] },
    { pIdx: 10, mIdx: 0, sIdx: 4, dayOffset: 72, hour: 9,  motif: "Suivi BPCO",                                diagnostic: "BPCO — stabilité",                               poids: 69, taille: 170, tension: "13/8",  temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 15, mIdx: 1, sIdx: 1, dayOffset: 73, hour: 11, motif: "Vaccination",                              diagnostic: "Vaccination DTP réalisée",                        poids: 56, taille: 162, tension: "11/7",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES", rx: [] },
    { pIdx: 16, mIdx: 0, sIdx: 2, dayOffset: 74, hour: 8,  motif: "Échographie cardiaque demandée",           diagnostic: "Coronaropathie — bilan",                          poids: 79, taille: 170, tension: "13/8",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    // ── Semaine 12 — mi-avril
    { pIdx: 11, mIdx: 1, sIdx: 0, dayOffset: 77, hour: 10, motif: "Asthme — adaptation",                      diagnostic: "Asthme contrôlé",                                 poids: 60, taille: 165, tension: "12/8",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 18, mIdx: 0, sIdx: 4, dayOffset: 78, hour: 9,  motif: "Bilan annuel",                              diagnostic: "Pathologies stables",                            poids: 80, taille: 174, tension: "13/8",  temp: 36.7, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 19, mIdx: 1, sIdx: 0, dayOffset: 79, hour: 11, motif: "Suivi anémie",                              diagnostic: "Anémie — amélioration",                          poids: 53, taille: 165, tension: "11/7",  temp: 36.8, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES", rx: [] },
    { pIdx: 20, mIdx: 0, sIdx: 4, dayOffset: 80, hour: 9,  motif: "Suivi IRC",                                  diagnostic: "IRC stade 3 — stable",                            poids: 70, taille: 168, tension: "15/9",  temp: 36.7, statut: "EN_COURS", facture: "EN_ATTENTE", paiement: null, rx: [] },
    { pIdx: 22, mIdx: 1, sIdx: 0, dayOffset: 81, hour: 10, motif: "Vertige récidive",                          diagnostic: null,                                              poids: 70, taille: 172, tension: "12/8",  temp: 36.7, statut: "EN_ATTENTE", facture: "EN_ATTENTE", paiement: null, rx: [] },
    // ── Semaine 13 — derniers jours avant aujourd'hui
    { pIdx: 23, mIdx: 1, sIdx: 0, dayOffset: 84, hour: 10, motif: "Bilan thyroïdien trimestriel",              diagnostic: "Hypothyroïdie équilibrée",                       poids: 66, taille: 166, tension: "11/7",  temp: 36.6, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 24, mIdx: 0, sIdx: 0, dayOffset: 85, hour: 9,  motif: "Plaie au pied",                             diagnostic: "Plaie — désinfection nécessaire",                 poids: 71, taille: 178, tension: "12/8",  temp: 37.2, statut: "TERMINEE", facture: "PAYEE", paiement: "ESPECES",
      rx: [{ medicament: "Amoxicilline 500mg", dosage: "1 gélule", frequence: "3 fois/jour", duree: "5 jours" }] },
    { pIdx: 8,  mIdx: 0, sIdx: 2, dayOffset: 86, hour: 8,  motif: "Douleurs thoraciques",                      diagnostic: "Angor instable — hospitalisation",                poids: 70, taille: 168, tension: "16/10", temp: 36.9, statut: "TERMINEE", facture: "PAYEE", paiement: "ASSURANCE", rx: [] },
    { pIdx: 9,  mIdx: 1, sIdx: 0, dayOffset: 87, hour: 9,  motif: "Suivi général",                              diagnostic: "Stable",                                          poids: 72, taille: 170, tension: "13/8",  temp: 36.7, statut: "EN_COURS",  facture: "EN_ATTENTE", paiement: null, rx: [] },
    { pIdx: 21, mIdx: 1, sIdx: 3, dayOffset: 88, hour: 11, motif: "Douleurs pelviennes",                       diagnostic: null,                                              poids: 60, taille: 164, tension: "11/7",  temp: 38.0, statut: "EN_ATTENTE",facture: "EN_ATTENTE", paiement: null, rx: [] },
  ];

  let factureCount = 0;
  const consultationsCreated: { id: string; dayOffset: number; pIdx: number; mIdx: 0 | 1 }[] = [];

  for (const c of consultationsData) {
    const patient = patients[c.pIdx];
    const medecin = c.mIdx === 0 ? medecin1 : medecin2;
    const service = services[c.sIdx];
    const date    = addDays(DEBUT, c.dayOffset, c.hour);

    const ph = await prisma.patientHospital.findFirst({
      where: { patient_id: patient.id, hospital_id: hospital.id },
    });
    const taux            = ph?.taux_couverture ?? 0;
    const montantAssurance = Math.round(TARIF_CONSULTATION * (taux / 100));
    const montantPatient   = TARIF_CONSULTATION - montantAssurance;

    const consultation = await prisma.consultation.create({
      data: {
        hospital_id:       hospital.id,
        patient_id:        patient.id,
        medecin_id:        medecin.id,
        service_id:        service.id,
        statut:            c.statut,
        motif:             c.motif,
        diagnostic:        c.diagnostic,
        tension:           c.tension,
        poids_kg:          c.poids,
        taille_cm:         c.taille,
        temperature:       c.temp,
        date_consultation: date,
        prescriptions:     { create: c.rx },
        created_at:        date,
      },
    });
    consultationsCreated.push({ id: consultation.id, dayOffset: c.dayOffset, pIdx: c.pIdx, mIdx: c.mIdx });

    factureCount++;
    const numeroFacture = `FAC-2026-${String(factureCount).padStart(5, "0")}`;

    const facture = await prisma.facture.create({
      data: {
        hospital_id:       hospital.id,
        patient_id:        patient.id,
        consultation_id:   consultation.id,
        numero_facture:    numeroFacture,
        statut:            c.facture,
        montant_total:     TARIF_CONSULTATION,
        montant_assurance: montantAssurance,
        montant_patient:   montantPatient,
        mode_paiement:     c.paiement,
        date_paiement:     c.facture === "PAYEE" ? date : null,
        notes:             `Consultation — ${c.motif}`,
        created_at:        date,
        lignes: {
          create: [{
            description:   `Consultation médicale — Dr. ${medecin.nom}`,
            quantite:      1,
            prix_unitaire: TARIF_CONSULTATION,
            montant_total: TARIF_CONSULTATION,
          }],
        },
      },
    });

    if (c.facture === "PAYEE") {
      await prisma.ecritureComptable.create({
        data: {
          hospital_id:    hospital.id,
          utilisateur_id: comptable.id,
          type_ecriture:  "RECETTE",
          libelle:        `Paiement ${numeroFacture} — ${patient.prenom} ${patient.nom}`,
          montant:        montantPatient,
          date_ecriture:  date,
          reference:      numeroFacture,
          facture_id:     facture.id,
          notes:          `Consultation — ${c.motif}`,
          created_at:     date,
        },
      });
    }
  }
  console.log(`📋 ${consultationsData.length} consultations + factures créées`);

  // ----------------------------------------------------------
  // 11. EXAMENS LABO — utilise le catalogue
  // ----------------------------------------------------------
  type LaboDef = {
    pIdx: number; mIdx: 0 | 1;
    type: "BILAN_SANGUIN" | "BILAN_URINAIRE" | "BACTERIOLOGIE" | "PARASITOLOGIE" | "SEROLOGIE" | "BIOCHIMIE" | "HEMATOLOGIE" | "AUTRE";
    examens: string[]; // noms du catalogue
    statut: "VALIDE" | "RESULTAT_SAISI" | "EN_COURS" | "EN_ATTENTE";
    factureStatut: "PAYEE" | "EN_ATTENTE";
    urgence: boolean;
    dayOffset: number; hour: number;
    notes: string; resultats: string | null;
  };

  const laboData: LaboDef[] = [
    { pIdx: 0,  mIdx: 0, type: "BIOCHIMIE",     examens: ["Urée", "Créatinine", "Transaminases (ASAT/ALAT)", "Bilirubine Totale"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 0,  hour: 11, notes: "Bilan hépatique gastrite", resultats: "ASAT : 24 UI/L\nALAT : 28 UI/L\nBilirubine totale : 8 µmol/L\nUrée : 5.1 mmol/L\nCréatinine : 78 µmol/L\nConclusion : Bilan hépatique et rénal normal" },
    { pIdx: 1,  mIdx: 1, type: "HEMATOLOGIE",   examens: ["NFS", "VS", "GS/RH"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 1,  hour: 12, notes: "Bilan annuel", resultats: "Hémoglobine : 13.2 g/dL\nGlobules blancs : 6800/mm³\nVS : 12 mm/h\nGroupe : O Rh+\nConclusion : Hémogramme normal" },
    { pIdx: 2,  mIdx: 0, type: "BIOCHIMIE",     examens: ["Cholestérol Total", "HDL Cholestérol", "LDL Cholestérol", "Triglycérides", "Glycémie à jeun"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 2,  hour: 11, notes: "Bilan lipidique HTA", resultats: "Cholestérol total : 2.1 g/L\nHDL : 0.5 g/L\nLDL : 1.4 g/L\nTriglycérides : 1.6 g/L\nGlycémie : 0.92 g/L\nConclusion : Bilan lipidique limite" },
    { pIdx: 3,  mIdx: 1, type: "HEMATOLOGIE",   examens: ["NFS", "GS/RH"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 3,  hour: 13, notes: "Bilan prénatal", resultats: "Hb : 11.8 g/dL\nGlobules blancs : 9200/mm³\nGroupe : AB Rh+\nConclusion : Légère anémie de grossesse" },
    { pIdx: 6,  mIdx: 0, type: "BIOCHIMIE",     examens: ["Glycémie à jeun", "HbA1c (Hb Glyquée)", "Créatinine"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 8,  hour: 10, notes: "Suivi diabète", resultats: "Glycémie : 1.85 g/L\nHbA1c : 8.4%\nCréatinine : 92 µmol/L\nConclusion : Diabète mal équilibré" },
    { pIdx: 7,  mIdx: 1, type: "BACTERIOLOGIE", examens: ["ECBU"], statut: "VALIDE", factureStatut: "PAYEE", urgence: true, dayOffset: 9,  hour: 11, notes: "Infection urinaire suspectée", resultats: "Leucocytes : 50000/ml (positif)\nNitrites : positif\nE. coli sensible Amoxicilline\nConclusion : Cystite à E. coli" },
    { pIdx: 12, mIdx: 0, type: "PARASITOLOGIE", examens: ["Goutte Épaisse", "Frottis Sanguin"], statut: "VALIDE", factureStatut: "PAYEE", urgence: true, dayOffset: 16, hour: 15, notes: "Suspicion paludisme", resultats: "Goutte épaisse : Plasmodium falciparum +\nParasitémie : 1.2%\nConclusion : Paludisme simple" },
    { pIdx: 14, mIdx: 0, type: "BIOCHIMIE",     examens: ["Urée", "Créatinine", "Transaminases (ASAT/ALAT)"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 18, hour: 10, notes: "Bilan ulcère", resultats: "Bilan biologique normal" },
    { pIdx: 19, mIdx: 1, type: "HEMATOLOGIE",   examens: ["NFS", "Réticulocytes", "VS"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 25, hour: 11, notes: "Bilan asthénie", resultats: "Hb : 8.2 g/dL\nVGM : 72 fL\nFerritine : 6 ng/ml\nConclusion : Anémie ferriprive" },
    { pIdx: 19, mIdx: 1, type: "BIOCHIMIE",     examens: ["Fer Sérique", "Ferritine"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 25, hour: 12, notes: "Compléter bilan anémie", resultats: "Fer sérique : 4 µmol/L (bas)\nFerritine : 6 ng/ml (bas)\nConclusion : Carence martiale" },
    { pIdx: 20, mIdx: 0, type: "BIOCHIMIE",     examens: ["Urée", "Créatinine", "Ionogramme Sanguin Complet"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 28, hour: 10, notes: "Suivi IRC", resultats: "Urée : 18 mmol/L (élevée)\nCréatinine : 220 µmol/L\nClairance : 32 ml/min\nConclusion : IRC stade 3" },
    { pIdx: 21, mIdx: 1, type: "BACTERIOLOGIE", examens: ["PV", "Chlamydiae"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 29, hour: 12, notes: "Suspicion salpingite", resultats: "PV : flore mixte\nChlamydiae : positif\nConclusion : Infection à Chlamydiae" },
    { pIdx: 23, mIdx: 1, type: "HEMATOLOGIE",   examens: ["NFS"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 31, hour: 11, notes: "Suivi hypothyroïdie", resultats: "NFS normale" },
    { pIdx: 23, mIdx: 1, type: "AUTRE",         examens: ["TSH US", "T3/T4"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 31, hour: 12, notes: "Suivi hypothyroïdie", resultats: "TSH : 2.4 mUI/L (normal)\nT4 : 14 pmol/L\nConclusion : Hypothyroïdie équilibrée sous lévothyrox" },
    { pIdx: 0,  mIdx: 0, type: "BIOCHIMIE",     examens: ["Transaminases (ASAT/ALAT)", "Gamma GT"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 35, hour: 10, notes: "Contrôle gastrite", resultats: "Bilan hépatique normal" },
    { pIdx: 6,  mIdx: 0, type: "BIOCHIMIE",     examens: ["Glycémie à jeun", "HbA1c (Hb Glyquée)"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 36, hour: 9,  notes: "Suivi diabète mensuel", resultats: "Glycémie : 1.42 g/L\nHbA1c : 7.6%\nConclusion : Amélioration partielle" },
    { pIdx: 3,  mIdx: 1, type: "HEMATOLOGIE",   examens: ["NFS"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 37, hour: 12, notes: "Suivi grossesse 22 SA", resultats: "Hb : 11.4 g/dL\nGlobules blancs : 8900/mm³\nConclusion : Anémie modérée — supplémentation à poursuivre" },
    { pIdx: 8,  mIdx: 0, type: "BIOCHIMIE",     examens: ["CPK", "CPK-MB", "LDH", "Transaminases (ASAT/ALAT)"], statut: "VALIDE", factureStatut: "PAYEE", urgence: true, dayOffset: 39, hour: 10, notes: "Bilan cardiaque", resultats: "CPK : 132 UI/L\nCPK-MB : 18 UI/L\nLDH : 220 UI/L\nConclusion : Pas de syndrome cardiaque aigu" },
    { pIdx: 18, mIdx: 0, type: "BIOCHIMIE",     examens: ["Cholestérol Total", "HDL Cholestérol", "LDL Cholestérol", "Triglycérides"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 24, hour: 15, notes: "Bilan lipidique", resultats: "Cholestérol : 2.4 g/L\nHDL : 0.45 g/L\nLDL : 1.7 g/L\nTriglycérides : 2.1 g/L\nConclusion : Dyslipidémie mixte" },
    { pIdx: 5,  mIdx: 1, type: "AUTRE",         examens: ["Facteur rhumatoïde", "AC antinucléaire"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 7,  hour: 11, notes: "Bilan dermatite", resultats: "FR : négatif\nAAN : négatif\nConclusion : Pas d'origine auto-immune" },
    // Mars 2026
    { pIdx: 16, mIdx: 0, type: "BIOCHIMIE",     examens: ["Glycémie à jeun", "Cholestérol Total", "Triglycérides"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 44, hour: 10, notes: "Bilan post-IDM", resultats: "Bilan favorable" },
    { pIdx: 12, mIdx: 1, type: "HEMATOLOGIE",   examens: ["NFS", "VS"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 43, hour: 11, notes: "Crise asthme", resultats: "Pas d'éosinophilie marquée" },
    { pIdx: 11, mIdx: 1, type: "BIOCHIMIE",     examens: ["CRP"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 38, hour: 12, notes: "Bilan asthme", resultats: "CRP : 4 mg/L (normal)" },
    { pIdx: 14, mIdx: 0, type: "BACTERIOLOGIE", examens: ["Hémoculture"], statut: "VALIDE", factureStatut: "PAYEE", urgence: true, dayOffset: 46, hour: 16, notes: "Bilan ulcère — H. pylori", resultats: "Hémoculture stérile" },
    { pIdx: 4,  mIdx: 0, type: "HEMATOLOGIE",   examens: ["NFS", "TP", "TCK"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 49, hour: 11, notes: "Bilan préopératoire", resultats: "Bilan compatible avec geste chirurgical" },
    { pIdx: 19, mIdx: 1, type: "HEMATOLOGIE",   examens: ["NFS", "Réticulocytes"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 52, hour: 12, notes: "Suivi anémie", resultats: "Hb : 9.8 g/dL\nRéticulocytes : 2.1%\nConclusion : Régénération en cours" },
    { pIdx: 20, mIdx: 0, type: "BIOCHIMIE",     examens: ["Urée", "Créatinine", "Ionogramme Sanguin Complet", "Calcémie", "Phosphore"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 53, hour: 11, notes: "Suivi IRC trimestriel", resultats: "Créatinine : 215 µmol/L\nClairance : 33 ml/min\nCalcémie : 2.1 mmol/L\nConclusion : IRC stable" },
    { pIdx: 21, mIdx: 1, type: "HEMATOLOGIE",   examens: ["NFS"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 56, hour: 12, notes: "Contrôle salpingite", resultats: "NFS normalisée" },
    { pIdx: 9,  mIdx: 0, type: "BIOCHIMIE",     examens: ["Glycémie à jeun", "HbA1c (Hb Glyquée)", "Créatinine", "Cholestérol Total"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 59, hour: 9,  notes: "Bilan complet", resultats: "Multi-pathologies stables" },
    { pIdx: 13, mIdx: 1, type: "AUTRE",         examens: ["BHCG"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 60, hour: 12, notes: "Suspicion grossesse", resultats: "BHCG : négatif\nConclusion : Pas de grossesse" },
    // Avril 2026
    { pIdx: 17, mIdx: 1, type: "HEMATOLOGIE",   examens: ["NFS"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 67, hour: 16, notes: "Bilan migraine", resultats: "NFS normale" },
    { pIdx: 7,  mIdx: 1, type: "BACTERIOLOGIE", examens: ["ECBU"], statut: "VALIDE", factureStatut: "PAYEE", urgence: true, dayOffset: 71, hour: 11, notes: "Récidive cystite", resultats: "Leucocytes positif\nE. coli sensible Amoxicilline" },
    { pIdx: 10, mIdx: 0, type: "BIOCHIMIE",     examens: ["CRP", "Ionogramme Sanguin Complet"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 72, hour: 10, notes: "Bilan BPCO", resultats: "CRP : 12 mg/L\nIonogramme normal" },
    { pIdx: 16, mIdx: 0, type: "BIOCHIMIE",     examens: ["CPK-MB", "LDH"], statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 74, hour: 9,  notes: "Bilan cardio", resultats: "Pas d'anomalie" },
    { pIdx: 20, mIdx: 0, type: "BIOCHIMIE",     examens: ["Urée", "Créatinine"], statut: "RESULTAT_SAISI", factureStatut: "EN_ATTENTE", urgence: false, dayOffset: 80, hour: 10, notes: "Suivi IRC mensuel", resultats: "Créatinine : 230 µmol/L\nClairance : 30 ml/min\nConclusion : Légère dégradation à surveiller" },
    { pIdx: 23, mIdx: 1, type: "AUTRE",         examens: ["TSH US"], statut: "RESULTAT_SAISI", factureStatut: "PAYEE", urgence: false, dayOffset: 84, hour: 11, notes: "Bilan thyroïdien", resultats: "TSH : 2.6 mUI/L\nConclusion : Équilibre maintenu" },
    { pIdx: 8,  mIdx: 0, type: "BIOCHIMIE",     examens: ["CPK-MB", "LDH", "Transaminases (ASAT/ALAT)"], statut: "RESULTAT_SAISI", factureStatut: "EN_ATTENTE", urgence: true, dayOffset: 86, hour: 9,  notes: "Bilan douleur thoracique", resultats: "CPK-MB : 35 UI/L (limite)\nConclusion : Surveillance — coronarographie demandée" },
    { pIdx: 9,  mIdx: 1, type: "HEMATOLOGIE",   examens: ["NFS"], statut: "EN_COURS", factureStatut: "EN_ATTENTE", urgence: false, dayOffset: 87, hour: 10, notes: "Suivi général", resultats: null },
    { pIdx: 21, mIdx: 1, type: "BACTERIOLOGIE", examens: ["PV", "Chlamydiae"], statut: "EN_ATTENTE", factureStatut: "EN_ATTENTE", urgence: false, dayOffset: 88, hour: 12, notes: "Récidive douleur pelvienne", resultats: null },
  ];

  for (const e of laboData) {
    const patient   = patients[e.pIdx];
    const medecin   = e.mIdx === 0 ? medecin1 : medecin2;
    const date      = addDays(DEBUT, e.dayOffset, e.hour);
    const dateValide = e.statut === "VALIDE" ? addDays(DEBUT, e.dayOffset, e.hour + 4) : null;

    // Calcul prix : somme des examens du catalogue
    const prixExamens = e.examens.map((nom) => cat(nom));
    const tarifTotal  = prixExamens.reduce((acc, c) => acc + c.prix, 0);

    const ph = await prisma.patientHospital.findFirst({
      where: { patient_id: patient.id, hospital_id: hospital.id },
    });
    const taux             = ph?.taux_couverture ?? 0;
    const montantAssurance = Math.round(tarifTotal * (taux / 100));
    const montantPatient   = tarifTotal - montantAssurance;

    factureCount++;
    const numeroFacture = `FAC-LABO-2026-${String(factureCount).padStart(5, "0")}`;

    const facture = await prisma.facture.create({
      data: {
        hospital_id:       hospital.id,
        patient_id:        patient.id,
        numero_facture:    numeroFacture,
        statut:            e.factureStatut,
        montant_total:     tarifTotal,
        montant_assurance: montantAssurance,
        montant_patient:   montantPatient,
        mode_paiement:     e.factureStatut === "PAYEE" ? "ESPECES" : null,
        date_paiement:     e.factureStatut === "PAYEE" ? date : null,
        notes:             `Examen labo — ${e.type}`,
        created_at:        date,
        lignes: {
          create: prixExamens.map((c) => ({
            description:   `Labo — ${c.nom}`,
            quantite:      1,
            prix_unitaire: c.prix,
            montant_total: c.prix,
          })),
        },
      },
    });

    const examenLabo = await prisma.examenLabo.create({
      data: {
        hospital_id:   hospital.id,
        patient_id:    patient.id,
        medecin_id:    medecin.id,
        type_examen:   e.type,
        statut:        e.statut,
        urgence:       e.urgence,
        notes:         e.notes,
        resultats:     e.resultats,
        valide_par:    dateValide ? laborantin.id : null,
        valide_le:     dateValide,
        prix_unitaire: tarifTotal,
        facture_id:    facture.id,
        created_at:    date,
        examens_details: {
          create: prixExamens.map((c) => ({
            catalogue_id:  c.id,
            prix_snapshot: c.prix,
          })),
        },
      },
    });

    if (e.factureStatut === "PAYEE") {
      await prisma.ecritureComptable.create({
        data: {
          hospital_id:    hospital.id,
          utilisateur_id: comptable.id,
          type_ecriture:  "RECETTE",
          libelle:        `Paiement ${numeroFacture} — ${patient.prenom} ${patient.nom}`,
          montant:        montantPatient,
          date_ecriture:  date,
          reference:      numeroFacture,
          facture_id:     facture.id,
          notes:          `Examen labo — ${e.type}`,
          created_at:     date,
        },
      });
    }

    void examenLabo;
  }
  console.log(`🔬 ${laboData.length} demandes labo créées (avec examens du catalogue)`);

  // ----------------------------------------------------------
  // 12. EXAMENS IMAGERIE
  // ----------------------------------------------------------
  type ImagerieDef = {
    pIdx: number; mIdx: 0 | 1;
    type: "RADIOGRAPHIE" | "ECHOGRAPHIE" | "SCANNER" | "IRM" | "MAMMOGRAPHIE" | "AUTRE";
    zone: string;
    statut: "VALIDE" | "RESULTAT_SAISI" | "EN_ATTENTE";
    factureStatut: "PAYEE" | "EN_ATTENTE";
    urgence: boolean;
    dayOffset: number; hour: number;
    notes: string; resultats: string | null;
  };

  const imagerieData: ImagerieDef[] = [
    { pIdx: 2,  mIdx: 0, type: "RADIOGRAPHIE", zone: "Thorax",   statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 2,  hour: 14, notes: "Contrôle cardio-pulmonaire HTA", resultats: "Silhouette cardiaque normale\nPas d'opacité parenchymateuse\nConclusion : Normal" },
    { pIdx: 3,  mIdx: 1, type: "ECHOGRAPHIE",  zone: "Abdomen",  statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 3,  hour: 14, notes: "Échographie obstétricale 16 SA", resultats: "Fœtus unique\nBiométrie cohérente 16 SA\nConclusion : Grossesse normale" },
    { pIdx: 4,  mIdx: 0, type: "RADIOGRAPHIE", zone: "Genou droit", statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 4,  hour: 16, notes: "Bilan entorse", resultats: "Pas de fracture\nLignement préservé\nConclusion : Entorse simple" },
    { pIdx: 8,  mIdx: 0, type: "ECHOGRAPHIE",  zone: "Cardiaque", statut: "VALIDE", factureStatut: "PAYEE", urgence: true, dayOffset: 10, hour: 11, notes: "Bilan angor", resultats: "FEVG : 48%\nHypokinésie inférieure\nConclusion : Coronaropathie connue" },
    { pIdx: 10, mIdx: 0, type: "RADIOGRAPHIE", zone: "Thorax",   statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 14, hour: 11, notes: "Bilan BPCO", resultats: "Distension thoracique\nPas de foyer\nConclusion : BPCO emphysémateuse" },
    { pIdx: 12, mIdx: 1, type: "RADIOGRAPHIE", zone: "Thorax",   statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 17, hour: 14, notes: "Toux fébrile", resultats: "Pas de foyer pneumonique\nConclusion : RAS" },
    { pIdx: 3,  mIdx: 1, type: "ECHOGRAPHIE",  zone: "Abdomen",  statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 17, hour: 16, notes: "Échographie obstétricale 20 SA", resultats: "Morphologie fœtale normale\nLA en quantité normale\nConclusion : Grossesse normale" },
    { pIdx: 13, mIdx: 1, type: "ECHOGRAPHIE",  zone: "Abdomen",  statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 22, hour: 11, notes: "Douleurs lombaires", resultats: "Reins de morphologie normale\nPas d'obstacle\nConclusion : Normal" },
    { pIdx: 16, mIdx: 0, type: "ECHOGRAPHIE",  zone: "Cardiaque", statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 22, hour: 14, notes: "Suivi post-IDM annuel", resultats: "FEVG : 52%\nFonction VG préservée" },
    { pIdx: 22, mIdx: 0, type: "SCANNER",      zone: "Crâne",    statut: "VALIDE", factureStatut: "PAYEE", urgence: true, dayOffset: 30, hour: 16, notes: "Vertige récent", resultats: "Pas d'AVC ni hémorragie\nConclusion : Pas d'urgence neuro" },
    { pIdx: 21, mIdx: 1, type: "ECHOGRAPHIE",  zone: "Pelvienne", statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 29, hour: 14, notes: "Salpingite", resultats: "Trompes épaissies\nÉpanchement Douglas modéré\nConclusion : Image de salpingite" },
    { pIdx: 3,  mIdx: 1, type: "ECHOGRAPHIE",  zone: "Abdomen",  statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 37, hour: 14, notes: "Échographie obstétricale 22 SA", resultats: "Croissance fœtale normale\nConclusion : Grossesse normale" },
    { pIdx: 11, mIdx: 1, type: "RADIOGRAPHIE", zone: "Thorax",   statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 38, hour: 12, notes: "Bilan asthme", resultats: "Pas de distension\nConclusion : Normal" },
    { pIdx: 14, mIdx: 0, type: "ECHOGRAPHIE",  zone: "Abdomen",  statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 46, hour: 11, notes: "Bilan ulcère", resultats: "Foie homogène\nVésicule normale\nConclusion : Normal" },
    { pIdx: 18, mIdx: 0, type: "ECHOGRAPHIE",  zone: "Cardiaque", statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 51, hour: 14, notes: "Bilan dyslipidémie", resultats: "Fonction VG normale\nConclusion : Normal" },
    { pIdx: 3,  mIdx: 1, type: "ECHOGRAPHIE",  zone: "Abdomen",  statut: "VALIDE", factureStatut: "PAYEE", urgence: false, dayOffset: 65, hour: 14, notes: "Échographie obstétricale 28 SA", resultats: "Croissance harmonieuse\nLA normale\nConclusion : Grossesse normale" },
    { pIdx: 16, mIdx: 0, type: "ECHOGRAPHIE",  zone: "Cardiaque", statut: "RESULTAT_SAISI", factureStatut: "EN_ATTENTE", urgence: false, dayOffset: 74, hour: 11, notes: "Suivi cardio", resultats: "FEVG : 50%\nConclusion : Stable" },
    { pIdx: 8,  mIdx: 0, type: "SCANNER",      zone: "Thorax",   statut: "EN_ATTENTE", factureStatut: "EN_ATTENTE", urgence: true, dayOffset: 86, hour: 14, notes: "Bilan douleurs thoraciques", resultats: null },
  ];

  for (const e of imagerieData) {
    const patient    = patients[e.pIdx];
    const medecin    = e.mIdx === 0 ? medecin1 : medecin2;
    const date       = addDays(DEBUT, e.dayOffset, e.hour);
    const dateValide = e.statut === "VALIDE" ? addDays(DEBUT, e.dayOffset, e.hour + 3) : null;
    const tarifExamen = TARIFS_IMAGERIE[e.type] ?? 35000;

    const ph = await prisma.patientHospital.findFirst({
      where: { patient_id: patient.id, hospital_id: hospital.id },
    });
    const taux             = ph?.taux_couverture ?? 0;
    const montantAssurance = Math.round(tarifExamen * (taux / 100));
    const montantPatient   = tarifExamen - montantAssurance;

    factureCount++;
    const numeroFacture = `FAC-IMG-2026-${String(factureCount).padStart(5, "0")}`;

    const facture = await prisma.facture.create({
      data: {
        hospital_id:       hospital.id,
        patient_id:        patient.id,
        numero_facture:    numeroFacture,
        statut:            e.factureStatut,
        montant_total:     tarifExamen,
        montant_assurance: montantAssurance,
        montant_patient:   montantPatient,
        mode_paiement:     e.factureStatut === "PAYEE" ? "ASSURANCE" : null,
        date_paiement:     e.factureStatut === "PAYEE" ? date : null,
        notes:             `Imagerie — ${e.type} (${e.zone})`,
        created_at:        date,
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
        patient_id:      patient.id,
        medecin_id:      medecin.id,
        type_examen:     e.type,
        zone_anatomique: e.zone,
        statut:          e.statut,
        urgence:         e.urgence,
        notes:           e.notes,
        resultats:       e.resultats,
        valide_par:      dateValide ? laborantin.id : null,
        valide_le:       dateValide,
        prix_unitaire:   tarifExamen,
        facture_id:      facture.id,
        created_at:      date,
      },
    });

    if (e.factureStatut === "PAYEE") {
      await prisma.ecritureComptable.create({
        data: {
          hospital_id:    hospital.id,
          utilisateur_id: comptable.id,
          type_ecriture:  "RECETTE",
          libelle:        `Paiement ${numeroFacture} — ${patient.prenom} ${patient.nom}`,
          montant:        montantPatient,
          date_ecriture:  date,
          reference:      numeroFacture,
          facture_id:     facture.id,
          notes:          `Imagerie — ${e.type}`,
          created_at:     date,
        },
      });
    }
  }
  console.log(`🩻 ${imagerieData.length} examens imagerie créés`);

  // ----------------------------------------------------------
  // 13. HOSPITALISATIONS
  // ----------------------------------------------------------
  const chVIP01 = chambres.find((c) => c.numero === "VIP-01")!;
  const ch201   = chambres.find((c) => c.numero === "201")!;
  const ch202   = chambres.find((c) => c.numero === "202")!;
  const ch102   = chambres.find((c) => c.numero === "102")!;
  const ch101   = chambres.find((c) => c.numero === "101")!;
  const ch103   = chambres.find((c) => c.numero === "103")!;
  const chREA01 = chambres.find((c) => c.numero === "REA-01")!;

  const para = articles.find((a) => a.code_article === "MED-001")!;
  const amox = articles.find((a) => a.code_article === "MED-002")!;
  const metf = articles.find((a) => a.code_article === "MED-005")!;
  const aml  = articles.find((a) => a.code_article === "MED-006")!;
  const peri = articles.find((a) => a.code_article === "MED-007")!;
  const ceft = articles.find((a) => a.code_article === "MED-008")!;
  const insu = articles.find((a) => a.code_article === "MED-009")!;
  const sero = articles.find((a) => a.code_article === "CON-001")!;

  type HospitDef = {
    pIdx: number; mIdx: 0 | 1; sIdx: number;
    chambre: typeof chVIP01;
    dayEntree: number; dureeJours: number | null; // null = en cours
    motif: string; diagnostic: string | null;
    statut: "SORTIE" | "EN_COURS";
    statutFacture: "PAYEE" | "EN_ATTENTE";
    paiement: "ASSURANCE" | "ESPECES" | "MOBILE_MONEY" | null;
    medics: Array<{ article: typeof para; quantite: number }>;
    actes: Array<{ description: string; quantite: number; prix: number }>;
    notes: string | null;
  };

  const hospitData: HospitDef[] = [
    // 1. Hospitalisation 1 — janvier 2026 — payée
    { pIdx: 2, mIdx: 0, sIdx: 4, chambre: chVIP01,
      dayEntree: 5, dureeJours: 4,
      motif: "Crise hypertensive — TA 18/11", diagnostic: "HTA stade 2 — stabilisée sous traitement",
      statut: "SORTIE", statutFacture: "PAYEE", paiement: "ASSURANCE",
      medics: [
        { article: para, quantite: 20 },
        { article: aml,  quantite: 30 },
        { article: peri, quantite: 30 },
      ],
      actes: [{ description: "Surveillance tensionnelle x4", quantite: 4, prix: 2500 }],
      notes: "Sorti avec ordonnance — contrôle 2 semaines",
    },
    // 2. Hospitalisation 2 — février — décompensation diabétique
    { pIdx: 8, mIdx: 1, sIdx: 4, chambre: ch201,
      dayEntree: 13, dureeJours: 5,
      motif: "Décompensation diabétique — glycémie 3.8 g/L",
      diagnostic: "Acidocétose diabétique modérée",
      statut: "SORTIE", statutFacture: "PAYEE", paiement: "ASSURANCE",
      medics: [
        { article: metf, quantite: 60 },
        { article: insu, quantite: 4 },
        { article: sero, quantite: 8 },
      ],
      actes: [
        { description: "Glycémie capillaire x10", quantite: 10, prix: 1500 },
        { description: "Pose voie veineuse + perfusion", quantite: 1, prix: 5000 },
      ],
      notes: "Suivi endocrinologie recommandé",
    },
    // 3. Hospitalisation 3 — mi-février — bronchite sévère
    { pIdx: 10, mIdx: 0, sIdx: 4, chambre: ch202,
      dayEntree: 20, dureeJours: 4,
      motif: "Exacerbation BPCO sévère",
      diagnostic: "Exacerbation BPCO — surinfection bronchique",
      statut: "SORTIE", statutFacture: "PAYEE", paiement: "ASSURANCE",
      medics: [
        { article: ceft, quantite: 5 },
        { article: para, quantite: 15 },
      ],
      actes: [{ description: "Aérosols + kiné respiratoire", quantite: 6, prix: 4000 }],
      notes: "Sortie avec O2 à domicile temporaire",
    },
    // 4. Hospitalisation 4 — mars — paludisme grave
    { pIdx: 12, mIdx: 0, sIdx: 0, chambre: ch102,
      dayEntree: 17, dureeJours: 3,
      motif: "Paludisme avec parasitémie 2%",
      diagnostic: "Paludisme à P. falciparum",
      statut: "SORTIE", statutFacture: "EN_ATTENTE", paiement: null,
      medics: [
        { article: para, quantite: 12 },
        { article: sero, quantite: 6 },
      ],
      actes: [{ description: "Surveillance parasitémie x3", quantite: 3, prix: 3000 }],
      notes: null,
    },
    // 5. Hospitalisation 5 — mars — salpingite
    { pIdx: 21, mIdx: 1, sIdx: 3, chambre: ch101,
      dayEntree: 30, dureeJours: 4,
      motif: "Salpingite aiguë avec fièvre",
      diagnostic: "Salpingite à Chlamydiae",
      statut: "SORTIE", statutFacture: "PAYEE", paiement: "ASSURANCE",
      medics: [
        { article: ceft, quantite: 4 },
        { article: amox, quantite: 30 },
        { article: para, quantite: 12 },
      ],
      actes: [{ description: "Antibiothérapie IV + suivi", quantite: 4, prix: 3500 }],
      notes: "Suivi gynéco à 1 mois",
    },
    // 6. Hospitalisation 6 — fin mars — anémie sévère
    { pIdx: 19, mIdx: 1, sIdx: 4, chambre: ch103,
      dayEntree: 53, dureeJours: 3,
      motif: "Anémie sévère Hb 6.8 — transfusion",
      diagnostic: "Anémie ferriprive sévère",
      statut: "SORTIE", statutFacture: "PAYEE", paiement: "ESPECES",
      medics: [
        { article: sero, quantite: 4 },
        { article: para, quantite: 6 },
      ],
      actes: [
        { description: "Transfusion CGR 2 unités", quantite: 2, prix: 25000 },
        { description: "Surveillance post-transfusion", quantite: 3, prix: 2000 },
      ],
      notes: "Bilan étiologique en ambulatoire",
    },
    // 7. Hospitalisation 7 — début avril — IRC décompensée
    { pIdx: 20, mIdx: 0, sIdx: 4, chambre: ch202,
      dayEntree: 60, dureeJours: 5,
      motif: "Œdèmes + dyspnée — décompensation IRC",
      diagnostic: "IRC stade 4 — surcharge hydrique",
      statut: "SORTIE", statutFacture: "EN_ATTENTE", paiement: null,
      medics: [
        { article: peri, quantite: 30 },
        { article: para, quantite: 10 },
      ],
      actes: [
        { description: "Diurétiques IV + bilan", quantite: 5, prix: 3500 },
        { description: "Surveillance clinique x10", quantite: 10, prix: 1500 },
      ],
      notes: "Référée néphrologue",
    },
    // 8. Hospitalisation 8 — avril — angor instable EN COURS
    { pIdx: 8, mIdx: 0, sIdx: 2, chambre: chREA01,
      dayEntree: 86, dureeJours: null,
      motif: "Angor instable — surveillance USIC",
      diagnostic: null,
      statut: "EN_COURS", statutFacture: "EN_ATTENTE", paiement: null,
      medics: [
        { article: aml, quantite: 5 },
        { article: para, quantite: 4 },
      ],
      actes: [
        { description: "Monitoring continu — j1 à j3", quantite: 3, prix: 5000 },
        { description: "Pose voie centrale", quantite: 1, prix: 15000 },
      ],
      notes: "Coronarographie programmée",
    },
  ];

  for (const h of hospitData) {
    const patient = patients[h.pIdx];
    const medecin = h.mIdx === 0 ? medecin1 : medecin2;
    const service = services[h.sIdx];
    const dateEntree = addDays(DEBUT, h.dayEntree, 8);
    const duree = h.dureeJours ?? Math.max(1, Math.floor((TODAY.getTime() - dateEntree.getTime()) / (24 * 3600 * 1000)));
    const dateSortie = h.dureeJours ? addDays(DEBUT, h.dayEntree + h.dureeJours, 11) : null;

    const ph = await prisma.patientHospital.findFirst({
      where: { patient_id: patient.id, hospital_id: hospital.id },
    });
    const taux = ph?.taux_couverture ?? 0;

    // Calcul montants
    const montantChambre  = h.chambre.prix_journalier * duree;
    const montantMedics   = h.medics.reduce((acc, m) => acc + m.article.prix_unitaire * m.quantite, 0);
    const montantActes    = h.actes.reduce((acc, a)  => acc + a.prix * a.quantite, 0);
    const montantTotal    = montantChambre + montantMedics + montantActes;
    const montantAssurance = Math.round(montantTotal * (taux / 100));
    const montantPatient   = montantTotal - montantAssurance;

    factureCount++;
    const numFact = `FAC-HOSPIT-2026-${String(factureCount).padStart(5, "0")}`;

    // Création facture
    const facture = await prisma.facture.create({
      data: {
        hospital_id:       hospital.id,
        patient_id:        patient.id,
        numero_facture:    numFact,
        statut:            h.statutFacture,
        montant_total:     montantTotal,
        montant_assurance: montantAssurance,
        montant_patient:   montantPatient,
        mode_paiement:     h.paiement,
        date_paiement:     h.statutFacture === "PAYEE" && dateSortie ? dateSortie : null,
        notes:             `Hospitalisation — ${h.motif}`,
        created_at:        dateEntree,
        lignes: {
          create: [
            { description: `Chambre ${h.chambre.numero} x${duree} jour(s)`, quantite: duree, prix_unitaire: h.chambre.prix_journalier, montant_total: montantChambre },
            ...h.medics.map((m) => ({
              description:   `${m.article.nom} x${m.quantite} ${m.article.unite}`,
              quantite:      m.quantite,
              prix_unitaire: m.article.prix_unitaire,
              montant_total: m.article.prix_unitaire * m.quantite,
            })),
            ...h.actes.map((a) => ({
              description:   a.description,
              quantite:      a.quantite,
              prix_unitaire: a.prix,
              montant_total: a.prix * a.quantite,
            })),
          ],
        },
      },
    });

    // Création hospit + lignes
    const lignesChambre = Array.from({ length: duree }).map((_, i) => ({
      type_ligne:    "CHAMBRE" as const,
      statut:        "SERVI" as const,
      description:   `Chambre ${h.chambre.numero} — Jour ${i + 1}`,
      quantite:      1,
      prix_unitaire: h.chambre.prix_journalier,
      montant_total: h.chambre.prix_journalier,
      prescrit_par:  `${admin.nom} ${admin.prenom}`,
      date_ligne:    addDays(DEBUT, h.dayEntree + i, 8),
    }));
    const lignesMedics = h.medics.map((m, i) => ({
      type_ligne:       "MEDICAMENT" as const,
      statut:           "SERVI" as const,
      description:      `${m.article.nom} x${m.quantite}`,
      quantite:         m.quantite,
      prix_unitaire:    m.article.prix_unitaire,
      montant_total:    m.article.prix_unitaire * m.quantite,
      article_stock_id: m.article.id,
      prescrit_par:     `${medecin.nom} ${medecin.prenom}`,
      date_ligne:       addDays(DEBUT, h.dayEntree, 10 + i),
    }));
    const lignesActes = h.actes.map((a, i) => ({
      type_ligne:    "ACTE_INFIRMIER" as const,
      statut:        "SERVI" as const,
      description:   a.description,
      quantite:      a.quantite,
      prix_unitaire: a.prix,
      montant_total: a.prix * a.quantite,
      prescrit_par:  `${infirmier.nom} ${infirmier.prenom}`,
      date_ligne:    addDays(DEBUT, h.dayEntree, 12 + i),
    }));

    await prisma.hospitalisation.create({
      data: {
        hospital_id:     hospital.id,
        patient_id:      patient.id,
        medecin_id:      medecin.id,
        chambre_id:      h.chambre.id,
        service_id:      service.id,
        statut:          h.statut,
        date_entree:     dateEntree,
        date_sortie:     dateSortie,
        motif_admission: h.motif,
        diagnostic:      h.diagnostic,
        notes:           h.notes,
        facture_id:      facture.id,
        created_at:      dateEntree,
        lignes: {
          create: [...lignesChambre, ...lignesMedics, ...lignesActes],
        },
      },
    });

    // Mouvements stock — sortie pour chaque médicament
    for (const m of h.medics) {
      const before = m.article.quantite_stock;
      const after  = Math.max(0, before - m.quantite);
      await prisma.mouvementStock.create({
        data: {
          hospital_id:    hospital.id,
          article_id:     m.article.id,
          type_mouvement: "SORTIE",
          quantite:       m.quantite,
          quantite_avant: before,
          quantite_apres: after,
          motif:          `Hospitalisation ${patient.prenom} ${patient.nom}`,
          utilisateur_id: pharmacien.id,
          created_at:     addDays(DEBUT, h.dayEntree, 10),
        },
      });
      m.article.quantite_stock = after;
    }

    // Si chambre prise = la marquer indisponible (uniquement EN_COURS)
    if (h.statut === "EN_COURS") {
      await prisma.chambre.update({
        where: { id: h.chambre.id },
        data:  { est_disponible: false },
      });
    }

    // Écriture comptable si facture payée
    if (h.statutFacture === "PAYEE" && dateSortie) {
      await prisma.ecritureComptable.create({
        data: {
          hospital_id:    hospital.id,
          utilisateur_id: comptable.id,
          type_ecriture:  "RECETTE",
          libelle:        `Hospit. ${numFact} — ${patient.prenom} ${patient.nom}`,
          montant:        montantPatient,
          date_ecriture:  dateSortie,
          reference:      numFact,
          facture_id:     facture.id,
          notes:          `Séjour ${duree} jour(s) — ${h.chambre.numero}`,
          created_at:     dateSortie,
        },
      });
    }
  }
  console.log(`🏥 ${hospitData.length} hospitalisations créées`);

  // Mettre à jour les quantités stock dans la BDD (synchroniser avec les sorties)
  for (const a of articles) {
    await prisma.articleStock.update({
      where: { id: a.id },
      data:  { quantite_stock: a.quantite_stock },
    });
  }

  // ----------------------------------------------------------
  // 14. DÉPENSES COMPTABLES — 3 mois
  // ----------------------------------------------------------
  const moisDepenses = [
    { mois: "Février 2026", offset: 6 },   // début février
    { mois: "Mars 2026",    offset: 35 },  // début mars
    { mois: "Avril 2026",   offset: 65 },  // début avril
  ];

  for (const m of moisDepenses) {
    const depensesMois = [
      { libelle: `Salaires personnel — ${m.mois}`,        montant: 3500000, categorie: "SALAIRES"    as const, jOff: 0 },
      { libelle: `Loyer locaux — ${m.mois}`,              montant: 600000,  categorie: "LOYER"       as const, jOff: 0 },
      { libelle: `Approvisionnement médicaments — ${m.mois}`, montant: 950000, categorie: "MEDICAMENTS" as const, jOff: 4 },
      { libelle: `Facture électricité — ${m.mois}`,       montant: 195000,  categorie: "ELECTRICITE" as const, jOff: 6 },
      { libelle: `Facture eau — ${m.mois}`,                montant: 48000,   categorie: "EAU"         as const, jOff: 6 },
      { libelle: `Abonnement téléphone + internet — ${m.mois}`, montant: 88000,  categorie: "TELEPHONE"   as const, jOff: 1 },
      { libelle: `Fournitures consommables médicaux — ${m.mois}`, montant: 340000, categorie: "FOURNITURES" as const, jOff: 9 },
      { libelle: `Maintenance équipements médicaux — ${m.mois}`, montant: 165000, categorie: "MAINTENANCE" as const, jOff: 12 },
    ];

    for (const d of depensesMois) {
      await prisma.ecritureComptable.create({
        data: {
          hospital_id:    hospital.id,
          utilisateur_id: comptable.id,
          type_ecriture:  "DEPENSE",
          categorie:      d.categorie,
          libelle:        d.libelle,
          montant:        d.montant,
          date_ecriture:  addDays(DEBUT, m.offset + d.jOff, 9),
          notes:          `Charge mensuelle ${m.mois}`,
          created_at:     addDays(DEBUT, m.offset + d.jOff, 9),
        },
      });
    }
  }
  console.log(`💰 ${moisDepenses.length * 8} dépenses comptables (3 mois) créées`);

  // ----------------------------------------------------------
  // 15. AUDIT TRAIL — quelques entrées représentatives
  // ----------------------------------------------------------
  for (let i = 0; i < Math.min(40, consultationsCreated.length); i++) {
    const c = consultationsCreated[i];
    const medecin = c.mIdx === 0 ? medecin1 : medecin2;
    await prisma.auditTrail.create({
      data: {
        hospital_id:     hospital.id,
        utilisateur_id:  medecin.id,
        utilisateur_nom: `${medecin.prenom} ${medecin.nom}`,
        type_action:     "CREATION",
        module:          "CONSULTATION",
        description:     `Création de consultation`,
        entite_id:       c.id,
        entite_nom:      `${patients[c.pIdx].prenom} ${patients[c.pIdx].nom}`,
        created_at:      addDays(DEBUT, c.dayOffset, 9),
      },
    });
  }
  // Quelques connexions
  for (const u of [admin, medecin1, medecin2, comptable, pharmacien]) {
    await prisma.auditTrail.create({
      data: {
        hospital_id:     hospital.id,
        utilisateur_id:  u.id,
        utilisateur_nom: `${u.prenom} ${u.nom}`,
        type_action:     "CONNEXION",
        module:          "AUTHENTIFICATION",
        description:     "Connexion à la plateforme",
        created_at:      addDays(TODAY, -1, 8),
      },
    });
  }
  console.log("📜 Audit trail peuplé");

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

  console.log("\n✅ Seed v4 terminé !");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📅 Période          : 2026-01-26 → 2026-04-26`);
  console.log(`🏥 Hôpital          : ${hospital.nom}`);
  console.log(`👥 Utilisateurs     : ${users.length} (conservés, non modifiés)`);
  console.log(`🩺 Services         : ${services.length}`);
  console.log(`🛏️  Chambres         : ${chambres.length}`);
  console.log(`🧪 Catalogue labo   : ${catalogue.length} examens`);
  console.log(`🧑 Patients         : ${patients.length}`);
  console.log(`📋 Consultations    : ${consultationsData.length}`);
  console.log(`🔬 Examens labo     : ${laboData.length} (avec ${laboData.reduce((s, x) => s + x.examens.length, 0)} examens du catalogue)`);
  console.log(`🩻 Examens imagerie : ${imagerieData.length}`);
  console.log(`🏥 Hospitalisations : ${hospitData.length}`);
  console.log(`💊 Articles stock   : ${articles.length}`);
  console.log(`💰 Recettes         : ${(totalRecettes._sum.montant ?? 0).toLocaleString("fr-FR")} XAF`);
  console.log(`💸 Dépenses         : ${(totalDepenses._sum.montant ?? 0).toLocaleString("fr-FR")} XAF`);
  console.log(`📈 Bénéfice net     : ${((totalRecettes._sum.montant ?? 0) - (totalDepenses._sum.montant ?? 0)).toLocaleString("fr-FR")} XAF`);
  console.log(`⏳ En attente       : ${facturesEnAttente._count} factures — ${(facturesEnAttente._sum.montant_patient ?? 0).toLocaleString("fr-FR")} XAF`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
