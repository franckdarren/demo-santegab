-- ============================================================
-- PHASE 1 KIMBA — MODULE RENDEZ-VOUS (CDC §5.7)
--
-- OBJECTIF : créer la table des rendez-vous, la valeur d'enum
--            nécessaire à l'audit, et les permissions du module.
--
-- À exécuter dans : Supabase → SQL Editor
--
-- ⚠️ ORDRE IMPORTANT : exécuter l'ÉTAPE 1 SEULE d'abord,
--    puis les étapes 2 et 3 (voir explication ci-dessous).
-- ============================================================


-- ============================================================
-- ÉTAPE 1 — Valeur d'enum pour le journal d'audit
--
-- ⚠️ À EXÉCUTER SEULE, dans une exécution séparée.
--
-- PostgreSQL interdit ALTER TYPE ... ADD VALUE à l'intérieur
-- d'un bloc transactionnel. Si vous collez tout le fichier d'un
-- coup, l'éditeur Supabase enveloppe le tout dans une
-- transaction et cette instruction échoue avec :
--   « ALTER TYPE ... ADD VALUE cannot run inside a transaction block »
--
-- Sélectionnez donc UNIQUEMENT la ligne ci-dessous et exécutez-la.
-- ============================================================

ALTER TYPE "ModuleAction" ADD VALUE IF NOT EXISTS 'RENDEZ_VOUS';


-- ============================================================
-- ÉTAPE 2 — Type enum des statuts + table rendez_vous
--
-- Peut être exécutée d'un seul bloc.
-- ============================================================

-- PostgreSQL ne connaît pas « CREATE TYPE IF NOT EXISTS » :
-- on teste donc l'existence du type avant de le créer.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'StatutRendezVous'
  ) THEN
    CREATE TYPE "StatutRendezVous" AS ENUM (
      'PLANIFIE',   -- créé, pas encore confirmé par le patient
      'CONFIRME',   -- le patient a confirmé sa venue
      'HONORE',     -- le patient est venu
      'ANNULE',     -- annulé par le patient ou l'établissement
      'ABSENT'      -- le patient n'est pas venu sans prévenir
    );
  END IF;
END $$;

-- Table des rendez-vous
-- Les types de colonnes reprennent exactement ce que Prisma attend
-- (TIMESTAMP(3) pour les DateTime, TEXT pour les identifiants uuid).
CREATE TABLE IF NOT EXISTS "rendez_vous" (
  "id"          TEXT NOT NULL,
  "hospital_id" TEXT NOT NULL,
  "patient_id"  TEXT NOT NULL,
  "medecin_id"  TEXT NOT NULL,
  "service_id"  TEXT,
  "date_heure"  TIMESTAMP(3) NOT NULL,
  "duree_min"   INTEGER NOT NULL DEFAULT 30,
  "statut"      "StatutRendezVous" NOT NULL DEFAULT 'PLANIFIE',
  "motif"       TEXT,
  "notes"       TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "rendez_vous_pkey" PRIMARY KEY ("id"),

  -- Si l'établissement est supprimé, ses rendez-vous le sont aussi
  CONSTRAINT "rendez_vous_hospital_id_fkey"
    FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  -- On empêche la suppression d'un patient qui a des rendez-vous
  CONSTRAINT "rendez_vous_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT "rendez_vous_medecin_id_fkey"
    FOREIGN KEY ("medecin_id") REFERENCES "utilisateurs"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,

  -- Le service est facultatif : sa suppression vide simplement le champ
  CONSTRAINT "rendez_vous_service_id_fkey"
    FOREIGN KEY ("service_id") REFERENCES "services"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- Index — le calendrier filtre en permanence par établissement et par date
CREATE INDEX IF NOT EXISTS "rendez_vous_hospital_id_idx"
  ON "rendez_vous"("hospital_id");

CREATE INDEX IF NOT EXISTS "rendez_vous_patient_id_idx"
  ON "rendez_vous"("patient_id");

CREATE INDEX IF NOT EXISTS "rendez_vous_medecin_id_idx"
  ON "rendez_vous"("medecin_id");

CREATE INDEX IF NOT EXISTS "rendez_vous_hospital_id_date_heure_idx"
  ON "rendez_vous"("hospital_id", "date_heure");


-- ============================================================
-- ÉTAPE 3 — Permissions du module RENDEZ_VOUS
--
-- Sans ces lignes, le module passe de 11 à 12 modules mais
-- AUCUN rôle non-admin n'y a accès (getPermissionsModule
-- renvoie false par défaut quand la ligne est absente).
--
-- ADMIN et SUPER_ADMIN ne sont pas concernés : ils contournent
-- entièrement le système de permissions.
--
-- Note : permissions.module est une colonne TEXT (pas un enum),
-- cette étape ne dépend donc pas de l'ÉTAPE 1.
--
-- Les permissions sont créées pour TOUS les établissements
-- présents en base (multi-tenant).
-- ============================================================

INSERT INTO "permissions" (
  "id", "hospital_id", "role", "module",
  "peut_voir", "peut_creer", "peut_modifier", "peut_supprimer",
  "created_at", "updated_at"
)
SELECT
  gen_random_uuid()::TEXT,
  h."id",
  r.role::"Role",
  'RENDEZ_VOUS',
  r.voir,
  r.creer,
  r.modifier,
  r.supprimer,
  NOW(),
  NOW()
FROM "hospitals" h
CROSS JOIN (VALUES
  -- rôle,             voir,  créer, modifier, supprimer
  ('MEDECIN',          TRUE,  TRUE,  TRUE,  FALSE),
  ('INFIRMIER',        TRUE,  TRUE,  TRUE,  FALSE),
  -- L'accueil est le principal gestionnaire des rendez-vous
  ('ADMINISTRATIF',    TRUE,  TRUE,  TRUE,  TRUE),
  -- Ces rôles n'ont pas besoin du calendrier
  ('LABORANTIN',       FALSE, FALSE, FALSE, FALSE),
  ('RADIOLOGUE',       FALSE, FALSE, FALSE, FALSE),
  ('PHARMACIEN',       FALSE, FALSE, FALSE, FALSE),
  ('COMPTABLE',        FALSE, FALSE, FALSE, FALSE)
) AS r(role, voir, creer, modifier, supprimer)
-- Relançable sans risque : les lignes déjà présentes sont ignorées
ON CONFLICT DO NOTHING;


-- ============================================================
-- VÉRIFICATION — à exécuter après coup pour contrôler
-- ============================================================

-- La table existe et est vide ?
-- SELECT COUNT(*) AS nb_rendez_vous FROM "rendez_vous";

-- Les permissions ont bien été créées (7 lignes par établissement) ?
-- SELECT "role", "peut_voir", "peut_creer", "peut_modifier", "peut_supprimer"
-- FROM "permissions"
-- WHERE "module" = 'RENDEZ_VOUS'
-- ORDER BY "role";

-- La valeur d'enum est bien présente ?
-- SELECT unnest(enum_range(NULL::"ModuleAction")) AS valeurs;


-- ============================================================
-- ROLLBACK — en cas de problème
--
-- ⚠️ Supprime la table ET tous les rendez-vous qu'elle contient.
--
-- La valeur 'RENDEZ_VOUS' de l'enum "ModuleAction" n'est pas
-- retirée : PostgreSQL ne sait pas supprimer une valeur d'enum
-- sans recréer le type entier. Elle reste inoffensive.
-- ============================================================

-- DROP TABLE IF EXISTS "rendez_vous";
-- DROP TYPE IF EXISTS "StatutRendezVous";
-- DELETE FROM "permissions" WHERE "module" = 'RENDEZ_VOUS';
