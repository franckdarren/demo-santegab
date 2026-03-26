// ============================================================
// PAGE CHAMBRES — Gestion des chambres et tarifs
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getChambres } from "./actions";
import { ChambresGrid } from "@/components/chambres/ChambresGrid";

export default async function ChambresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  // Seuls les admins peuvent gérer les chambres
  if (
    utilisateur.role !== "ADMIN" &&
    utilisateur.role !== "SUPER_ADMIN"
  ) {
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