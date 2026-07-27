-- ============================================================
-- PHASE 2 KIMBA — ANTÉCÉDENTS STRUCTURÉS & ACTES MÉDICAUX
-- (CDC §5.1 traitements en cours, §5.5 actes, §5.6 antécédents)
--
-- OBJECTIF : créer la table des antécédents médicaux structurés
--            et ajouter la nature de l'acte aux consultations.
--
-- À exécuter dans : Supabase → SQL Editor
--
-- ✅ Aucune instruction ALTER TYPE ... ADD VALUE ici :
--    ce script peut être exécuté d'un SEUL bloc, contrairement
--    à celui de la Phase 1.
--
-- ✅ Aucune donnée existante n'est modifiée ni supprimée.
-- ============================================================


-- ============================================================
-- ÉTAPE 1 — Types enum
-- ============================================================

-- PostgreSQL ne connaît pas « CREATE TYPE IF NOT EXISTS »
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TypeAntecedent') THEN
    CREATE TYPE "TypeAntecedent" AS ENUM (
      'PATHOLOGIE',
      'HOSPITALISATION',
      'CHIRURGIE',
      'ALLERGIE',
      'TRAITEMENT_CHRONIQUE'  -- + est_actif = « traitement en cours » (CDC §5.1)
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TypeActe') THEN
    CREATE TYPE "TypeActe" AS ENUM ('CONSULTATION', 'SOIN');
  END IF;
END $$;


-- ============================================================
-- ÉTAPE 2 — Nature de l'acte sur les consultations (CDC §5.5)
--
-- La valeur par défaut CONSULTATION s'applique automatiquement
-- à toutes les lignes déjà présentes : rien à reprendre à la main.
-- ============================================================

ALTER TABLE "consultations"
  ADD COLUMN IF NOT EXISTS "type_acte" "TypeActe" NOT NULL DEFAULT 'CONSULTATION';


-- ============================================================
-- ÉTAPE 3 — Table des antécédents médicaux (CDC §5.6)
--
-- Le champ texte libre patients.antecedents est CONSERVÉ :
-- il sert de repli tant que les antécédents existants n'ont pas
-- été ressaisis un par un dans la nouvelle table.
-- ============================================================

CREATE TABLE IF NOT EXISTS "antecedents_medicaux" (
  "id"          TEXT NOT NULL,
  "hospital_id" TEXT NOT NULL,
  "patient_id"  TEXT NOT NULL,
  "type"        "TypeAntecedent" NOT NULL,
  "libelle"     TEXT NOT NULL,
  "date_debut"  TIMESTAMP(3),
  "date_fin"    TIMESTAMP(3),
  "est_actif"   BOOLEAN NOT NULL DEFAULT TRUE,
  "notes"       TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "antecedents_medicaux_pkey" PRIMARY KEY ("id"),

  -- Suppression de l'établissement → ses antécédents disparaissent
  CONSTRAINT "antecedents_medicaux_hospital_id_fkey"
    FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- Suppression du patient → ses antécédents disparaissent avec lui
  CONSTRAINT "antecedents_medicaux_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "antecedents_medicaux_hospital_id_idx"
  ON "antecedents_medicaux"("hospital_id");

CREATE INDEX IF NOT EXISTS "antecedents_medicaux_patient_id_idx"
  ON "antecedents_medicaux"("patient_id");

-- La fiche patient charge toujours les antécédents
-- d'un patient POUR un établissement donné
CREATE INDEX IF NOT EXISTS "antecedents_medicaux_patient_id_hospital_id_idx"
  ON "antecedents_medicaux"("patient_id", "hospital_id");


-- ============================================================
-- VÉRIFICATION — à exécuter après coup
-- ============================================================

-- La colonne type_acte est bien présente sur toutes les consultations ?
-- SELECT "type_acte", COUNT(*) AS nb
-- FROM "consultations"
-- GROUP BY "type_acte";

-- La table des antécédents existe ?
-- SELECT COUNT(*) AS nb_antecedents FROM "antecedents_medicaux";

-- Quels patients ont encore des antécédents en texte libre à reprendre ?
-- SELECT "id", "nom", "prenom", "antecedents"
-- FROM "patients"
-- WHERE "antecedents" IS NOT NULL AND "antecedents" <> '';


-- ============================================================
-- ROLLBACK — en cas de problème
--
-- ⚠️ Supprime la table ET tous les antécédents structurés saisis.
--    Le texte libre patients.antecedents n'est pas touché.
-- ============================================================

-- DROP TABLE IF EXISTS "antecedents_medicaux";
-- DROP TYPE IF EXISTS "TypeAntecedent";
-- ALTER TABLE "consultations" DROP COLUMN IF EXISTS "type_acte";
-- DROP TYPE IF EXISTS "TypeActe";
