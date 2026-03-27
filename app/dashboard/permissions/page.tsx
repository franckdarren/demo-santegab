import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getPermissionsHospital, getRolesPersonnalises } from "./actions";
import { PermissionsTable } from "@/components/permissions/PermissionsTable";
import { RolesPersonnalisesManager } from "@/components/permissions/RolesPersonnalisesManager";
import { initialiserPermissionsDefaut } from "@/lib/permissions.server";

export default async function PermissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  if (
    utilisateur.role !== "ADMIN" &&
    utilisateur.role !== "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const count = await prisma.permission.count({
    where: { hospital_id: utilisateur.hospital_id },
  });
  if (count === 0) {
    await initialiserPermissionsDefaut(utilisateur.hospital_id);
  }

  const [permissions, rolesPersonnalises, tousUtilisateurs] = await Promise.all([
    getPermissionsHospital(utilisateur.hospital_id),
    getRolesPersonnalises(utilisateur.hospital_id),
    prisma.utilisateur.findMany({
      where:   { hospital_id: utilisateur.hospital_id, est_actif: true },
      select:  { id: true, nom: true, prenom: true, role: true, role_personnalise_id: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion des permissions
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Configurez les droits d&apos;accès des rôles système et créez des rôles personnalisés
        </p>
      </div>

      {/* -------------------------------------------------- */}
      {/* SECTION 1 — Rôles personnalisés                   */}
      {/* -------------------------------------------------- */}
      <RolesPersonnalisesManager
        rolesPersonnalises={rolesPersonnalises}
        utilisateurs={tousUtilisateurs}
        hospitalId={utilisateur.hospital_id}
        adminId={utilisateur.id}
        adminNom={`${utilisateur.prenom} ${utilisateur.nom}`}
      />

      {/* -------------------------------------------------- */}
      {/* SECTION 2 — Rôles système                         */}
      {/* -------------------------------------------------- */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Rôles système
          </h2>
          <p className="text-sm text-gray-500">
            Permissions des rôles prédéfinis de l&apos;application
          </p>
        </div>
        <PermissionsTable
          permissions={permissions}
          hospitalId={utilisateur.hospital_id}
          adminId={utilisateur.id}
          adminNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        />
      </div>
    </div>
  );
}