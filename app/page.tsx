// ============================================================
// PAGE D'ACCUEIL — Redirection
//
// La racine du site n'affiche aucun contenu : elle renvoie
// directement vers le dashboard.
// Si l'utilisateur n'est pas connecté, le middleware intercepte
// avant et le renvoie vers /login.
// ============================================================

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
