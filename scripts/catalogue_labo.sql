-- ============================================================
-- 1. CRÉATION DES TABLES (si pas encore fait)
-- ============================================================

CREATE TABLE IF NOT EXISTS examens_catalogue (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  hospital_id TEXT NOT NULL REFERENCES hospitals(id),
  famille     TEXT NOT NULL,
  nom         TEXT NOT NULL,
  description TEXT,
  prix        FLOAT NOT NULL DEFAULT 0,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  ordre       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS examens_catalogue_hospital_id_idx
  ON examens_catalogue(hospital_id);

CREATE TABLE IF NOT EXISTS examen_labo_examens (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  examen_labo_id TEXT NOT NULL REFERENCES examens_labo(id) ON DELETE CASCADE,
  catalogue_id   TEXT NOT NULL REFERENCES examens_catalogue(id),
  prix_snapshot  FLOAT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS examen_labo_examens_examen_labo_id_idx
  ON examen_labo_examens(examen_labo_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_examens_catalogue_updated_at ON examens_catalogue;
CREATE TRIGGER set_examens_catalogue_updated_at
  BEFORE UPDATE ON examens_catalogue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. SEED CATALOGUE — Clinique El Rapha
-- hospital_id fixe seed : 11111111-1111-1111-1111-111111111111
-- Les prix sont des tarifs indicatifs en XAF (modifiables via le CRUD)
-- ============================================================

INSERT INTO examens_catalogue (hospital_id, famille, nom, prix, ordre) VALUES

-- HEMATOLOGIE
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'NFS',                                       5000,  1),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'GS/RH',                                     3000,  2),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Réticulocytes',                              5000,  3),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'TP',                                         5000,  4),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'TCK',                                        5000,  5),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'INR',                                        5000,  6),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'VS',                                         3000,  7),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Goutte Épaisse',                             5000,  8),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Frottis Sanguin',                            5000,  9),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'RMF',                                        5000, 10),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Électrophorèse de HB',                      15000, 11),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Héparinémie',                               15000, 12),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Hémocystémie',                              15000, 13),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Fibrinogène',                               10000, 14),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Antithrombine III',                         15000, 15),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Protéine C / Protéine S',                   20000, 16),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Facteur VIII et IX',                        25000, 17),
('11111111-1111-1111-1111-111111111111', 'HEMATOLOGIE', 'Recherche des anticorps irréguliers (RAI)', 20000, 18),

-- HORMONES
('11111111-1111-1111-1111-111111111111', 'HORMONES', 'TSH US',       15000, 1),
('11111111-1111-1111-1111-111111111111', 'HORMONES', 'T3/T4',        20000, 2),
('11111111-1111-1111-1111-111111111111', 'HORMONES', 'PTH',          25000, 3),
('11111111-1111-1111-1111-111111111111', 'HORMONES', 'BHCG',         15000, 4),
('11111111-1111-1111-1111-111111111111', 'HORMONES', 'PROLACTINE',   20000, 5),
('11111111-1111-1111-1111-111111111111', 'HORMONES', 'OESTRADIOL',   20000, 6),
('11111111-1111-1111-1111-111111111111', 'HORMONES', 'LH',           20000, 7),
('11111111-1111-1111-1111-111111111111', 'HORMONES', 'FSH',          20000, 8),

-- SEROLOGIE
('11111111-1111-1111-1111-111111111111', 'SEROLOGIE', 'ASLO',             10000,  1),
('11111111-1111-1111-1111-111111111111', 'SEROLOGIE', 'BW (TPHA-VDRL)',   10000,  2),
('11111111-1111-1111-1111-111111111111', 'SEROLOGIE', 'Widal et Felix',   10000,  3),
('11111111-1111-1111-1111-111111111111', 'SEROLOGIE', 'Antigène HBs',     15000,  4),
('11111111-1111-1111-1111-111111111111', 'SEROLOGIE', 'HVC',              15000,  5),
('11111111-1111-1111-1111-111111111111', 'SEROLOGIE', 'Chlamydiae',       20000,  6),
('11111111-1111-1111-1111-111111111111', 'SEROLOGIE', 'VIH 1 et 2',       10000,  7),
('11111111-1111-1111-1111-111111111111', 'SEROLOGIE', 'Toxoplasmose',     15000,  8),
('11111111-1111-1111-1111-111111111111', 'SEROLOGIE', 'AMISE',            15000,  9),
('11111111-1111-1111-1111-111111111111', 'SEROLOGIE', 'Bilharziose',      15000, 10),

-- BACTERIOLOGIE
('11111111-1111-1111-1111-111111111111', 'BACTERIOLOGIE', 'ECBU',                            15000, 1),
('11111111-1111-1111-1111-111111111111', 'BACTERIOLOGIE', 'Hémoculture',                     25000, 2),
('11111111-1111-1111-1111-111111111111', 'BACTERIOLOGIE', 'PV',                              15000, 3),
('11111111-1111-1111-1111-111111111111', 'BACTERIOLOGIE', 'Mycoplasme',                      20000, 4),
('11111111-1111-1111-1111-111111111111', 'BACTERIOLOGIE', 'LCS',                             25000, 5),
('11111111-1111-1111-1111-111111111111', 'BACTERIOLOGIE', 'Coproculture',                    15000, 6),
('11111111-1111-1111-1111-111111111111', 'BACTERIOLOGIE', 'Liquide de ponction d''Ascite',   25000, 7),
('11111111-1111-1111-1111-111111111111', 'BACTERIOLOGIE', 'Liquide de ponction articulaire', 25000, 8),
('11111111-1111-1111-1111-111111111111', 'BACTERIOLOGIE', 'Prélèvement local',               15000, 9),

-- BIOCHIMIE
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Urée',                              3000,  1),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Créatinine',                        3000,  2),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Glycémie à jeun',                   3000,  3),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'HbA1c (Hb Glyquée)',                10000,  4),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Calcémie',                          3000,  5),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Phosphore',                         3000,  6),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'CRP',                               5000,  7),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Magnésium',                         3000,  8),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Gamma GT',                          3000,  9),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Transaminases (ASAT/ALAT)',          5000, 10),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Bilirubine Totale',                  3000, 11),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Bilirubine Libre',                   3000, 12),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Phosphatases Alcalines (PAL)',       3000, 13),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Cholestérol Total',                  3000, 14),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'HDL Cholestérol',                    3000, 15),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'LDL Cholestérol',                    3000, 16),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Triglycérides',                      3000, 17),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Protidémie',                         3000, 18),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'CPK',                               5000, 19),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'CPK-MB',                            8000, 20),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'LDH',                               5000, 21),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Fer Sérique',                       5000, 22),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Ferritine',                         8000, 23),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Ionogramme Sanguin Complet',        10000, 24),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Lipasémie',                         5000, 25),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Amylasémie',                        5000, 26),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Électrophorèse de HB',             15000, 27),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Électrophorèse des Protéines Sériques', 15000, 28),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Vitamine D',                       15000, 29),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Protéinurie',                       5000, 30),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Ionogramme Urinaire',               5000, 31),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Bandelette Urinaire',               2000, 32),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'LCS (Biochimie)',                  15000, 33),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Liquide d''Ascite (Biochimie)',    15000, 34),
('11111111-1111-1111-1111-111111111111', 'BIOCHIMIE', 'Liquide Pleural (Biochimie)',       15000, 35),

-- IMMUNOLOGIE / MARQUEURS TUMORAUX
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'Facteur rhumatoïde',    10000,  1),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'Waaler Rose',           10000,  2),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'AC antiphospholipides', 20000,  3),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'AC anti CCP',           20000,  4),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'AC anti SSA/SSB',       20000,  5),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'AC antinucléaire',      20000,  6),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'AC anti Musk',          25000,  7),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'AC anti Rach',          25000,  8),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'ACE',                   20000,  9),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'Facteur intrinsèque',   20000, 10),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'PSA',                   20000, 11),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'CA 19-9',               25000, 12),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'CA 125',                25000, 13),
('11111111-1111-1111-1111-111111111111', 'IMMUNOLOGIE / MARQUEURS TUMORAUX', 'CA 15-3',               25000, 14);
