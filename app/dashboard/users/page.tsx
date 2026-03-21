// ============================================================
// PAGE GESTION UTILISATEURS
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UtilisateursList } from "@/components/users/UtilisateursList";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  // Seuls les admins peuvent gérer les utilisateurs
  if (utilisateur.role !== "ADMIN" && utilisateur.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const utilisateurs = await prisma.utilisateur.findMany({
    where: { hospital_id: utilisateur.hospital_id },
    orderBy: [{ est_actif: "desc" }, { nom: "asc" }],
  });

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
      />
    </div>
  );
}