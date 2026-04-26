// ============================================================
// PAGE CHAMBRES — Gestion des chambres et tarifs
// ============================================================

import { getUtilisateurConnecte } from "@/lib/withPermission";
import { redirect } from "next/navigation";
import { getChambres } from "./actions";
import { ChambresGrid } from "@/components/chambres/ChambresGrid";

export default async function ChambresPage() {
  const utilisateur = await getUtilisateurConnecte();

  // Page réservée aux admins
  if (utilisateur.role !== "ADMIN" && utilisateur.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const chambres = await getChambres(utilisateur.hospital_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des chambres
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Chambres et tarifs journaliers de votre établissement
        </p>
      </div>

      <ChambresGrid
        chambres={chambres}
        hospitalId={utilisateur.hospital_id}
        utilisateurId={utilisateur.id}
        utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
      />
    </div>
  );
}