// ============================================================
// LIB PERMISSIONS — Constantes et types uniquement
// Ce fichier est importable côté client ET serveur.
// Il ne contient AUCUN import Prisma.
// ============================================================

import { Role } from "@/app/generated/prisma/client";

// ============================================================
// Modules disponibles dans l'application
// ============================================================
export const MODULES = [
  "PATIENT",
  "CONSULTATION",
  "LABORATOIRE",
  "IMAGERIE",
  "PHARMACIE",
  "HOSPITALISATION",
  "FACTURATION",
  "COMPTABILITE",
  "UTILISATEUR",
  "STATISTIQUES",
  "AUDIT",
] as const;

export type Module = typeof MODULES[number];

// ============================================================
// Labels lisibles pour l'UI
// ============================================================
export const MODULE_LABELS: Record<Module, string> = {
  PATIENT:          "Patients",
  CONSULTATION:     "Consultations",
  LABORATOIRE:      "Laboratoire",
  IMAGERIE:         "Imagerie",
  PHARMACIE:        "Pharmacie & Stocks",
  HOSPITALISATION:  "Hospitalisations",
  FACTURATION:      "Facturation",
  COMPTABILITE:     "Comptabilité",
  UTILISATEUR:      "Utilisateurs",
  STATISTIQUES:     "Statistiques",
  AUDIT:            "Journal d'audit",
};

// ============================================================
// Type d'une permission sur un module
// ============================================================
export interface PermissionModule {
  peut_voir:      boolean;
  peut_creer:     boolean;
  peut_modifier:  boolean;
  peut_supprimer: boolean;
}

// ============================================================
// Rôles qui bypassent toutes les permissions
// ============================================================
export const ROLES_ADMIN: Role[] = ["ADMIN", "SUPER_ADMIN"];