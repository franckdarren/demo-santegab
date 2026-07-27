// ============================================================
// REDIRECTION APRÈS CONNEXION
//
// Valide le paramètre ?next= de la page /login.
// Utilisé par le middleware ET par le formulaire de connexion,
// pour que les deux appliquent exactement la même règle.
// ============================================================

/** Page affichée après connexion quand aucune destination valide n'est fournie */
export const DESTINATION_PAR_DEFAUT = "/dashboard";

/**
 * Retourne une destination interne sûre après connexion.
 *
 * Refuse :
 * - null / chaîne vide
 * - les URLs absolues (https://site.com) et protocol-relative (//site.com)
 *   qui feraient sortir l'utilisateur du domaine → faille "open redirect"
 * - "/" qui affiche la page d'accueil au lieu du dashboard
 */
export function destinationApresConnexion(next: string | null): string {
  if (!next) return DESTINATION_PAR_DEFAUT;

  // Doit être un chemin interne : commence par "/" mais pas par "//" ni "/\"
  const estCheminInterne =
    next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");

  if (!estCheminInterne) return DESTINATION_PAR_DEFAUT;

  // La racine ne contient aucune page utile → on envoie sur le dashboard
  if (next === "/") return DESTINATION_PAR_DEFAUT;

  return next;
}
