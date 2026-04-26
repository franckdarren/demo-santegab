// ============================================================
// PAGE GESTION UTILISATEURS
// ============================================================

import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
import { prisma } from "@/lib/prisma";
import { UtilisateursList } from "@/components/users/UtilisateursList";

export default async function UsersPage() {
  const utilisateur = await withPermission("UTILISATEUR", "peut_voir");

  const [utilisateurs, perms] = await Promise.all([
    prisma.utilisateur.findMany({
      where:   { hospital_id: utilisateur.hospital_id },
      orderBy: [{ est_actif: "desc" }, { nom: "asc" }],
    }),
    getPermissionsModule(
      utilisateur.hospital_id,
      utilisateur.role,
      "UTILISATEUR",
      utilisateur.role_personnalise_id
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des utilisateurs
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Personnel et accès de votre établissement
        </p>
      </div>

      <UtilisateursList
        utilisateurs={utilisateurs}
        hospitalId={utilisateur.hospital_id}
        utilisateurConnecteId={utilisateur.id}
        utilisateurConnecteNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        peutCreer={perms.peut_creer}
        peutModifier={perms.peut_modifier}
      />
    </div>
  );
}