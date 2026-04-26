// ============================================================
// PAGE SERVICES — Gestion des services médicaux (Admin)
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServices } from "./actions";
import { ServicesManager } from "@/components/services/ServicesManager";

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  // Seul un Admin ou Super Admin peut accéder à cette page
  if (utilisateur.role !== "ADMIN" && utilisateur.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const services = await getServices(utilisateur.hospital_id);

  return (
    <ServicesManager
      services={services}
      hospitalId={utilisateur.hospital_id}
      utilisateurId={utilisateur.id}
      utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
    />
  );
}
