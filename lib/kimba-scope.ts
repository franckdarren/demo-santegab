// ============================================================
// PÉRIMÈTRE KIMBA CONNECT — Masquage des modules hors cahier des charges
//
// Le cahier des charges KIMBA (kimba.pdf) ne porte que sur la gestion du
// parcours médical du patient. Les modules de gestion financière et
// logistique de SANTÉGAB sortent de ce périmètre : on les MASQUE,
// on ne les supprime JAMAIS.
//
// Le code, les tables et les données restent intacts. La facturation
// automatique des consultations continue de tourner en arrière-plan :
// les factures sont créées mais simplement invisibles dans l'interface.
//
// ------------------------------------------------------------
// 🔄 POUR TOUT RÉAFFICHER : passer MASQUAGE_KIMBA_ACTIF à false.
//    Aucune autre modification n'est nécessaire.
// ------------------------------------------------------------
//
// ⚠️ Ce fichier ne doit contenir AUCUN import Prisma ni serveur —
//    il est importé dans des composants "use client"
//    (Sidebar.tsx, PatientTabs.tsx, StatsCards.tsx).
// ============================================================

// Interrupteur global du masquage
//
// Le type ": boolean" est explicite et VOLONTAIRE : sans lui, TypeScript
// déduirait le type littéral "true" et considérerait tout le code de
// réaffichage comme du code mort (avertissements de lint).
export const MASQUAGE_KIMBA_ACTIF: boolean = true;

// ============================================================
// Modules exclus du cahier des charges KIMBA
// ============================================================
export const MODULES_HORS_PERIMETRE = [
  "FACTURATION",
  "COMPTABILITE",
  "PHARMACIE",
  "HOSPITALISATION",
  "CHAMBRES",
] as const;

// ============================================================
// Routes correspondantes
//
// On raisonne aussi par route car « Chambres » n'est rattaché à aucun
// module de permission (module: null dans la Sidebar) : le filtrer par
// nom de module ne suffirait pas.
//
// SERVICES n'est PAS dans cette liste : Consultation.service_id l'utilise
// et le cahier des charges §5.5 exige qu'un acte soit rattaché à
// « un service médical ». Le masquer casserait une exigence du CDC.
// ============================================================
export const ROUTES_HORS_PERIMETRE = [
  "/dashboard/billing",
  "/dashboard/accounting",
  "/dashboard/pharmacy",
  "/dashboard/hospitalisations",
  "/dashboard/chambres",
] as const;

// ============================================================
// Indique si un module est hors périmètre KIMBA
// ============================================================
export function estHorsPerimetre(module: string | null): boolean {
  if (!MASQUAGE_KIMBA_ACTIF) return false;
  if (module === null) return false;

  return (MODULES_HORS_PERIMETRE as readonly string[]).includes(module);
}

// ============================================================
// Indique si une route est hors périmètre KIMBA
//
// Couvre la route elle-même et toutes ses sous-pages
// (ex : /dashboard/hospitalisations/[id])
// ============================================================
export function routeHorsPerimetre(href: string): boolean {
  if (!MASQUAGE_KIMBA_ACTIF) return false;

  return ROUTES_HORS_PERIMETRE.some(
    (route) => href === route || href.startsWith(`${route}/`)
  );
}
