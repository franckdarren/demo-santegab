// ============================================================
// PAGE FICHE HOSPITALISATION — Détail d'un séjour
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getHospitalisationById } from "@/app/dashboard/hospitalisations/actions";
import { getArticlesStock } from "@/app/dashboard/pharmacy/actions";
import { FicheHospitalisation } from "@/components/hospitalisations/FicheHospitalisation";

interface HospitalisationPageProps {
  params: Promise<{ id: string }>;
}

export default async function HospitalisationPage({
  params,
}: HospitalisationPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const { id } = await params;

  const hospitalisation = await getHospitalisationById(
    id,
    utilisateur.hospital_id
  );

  if (!hospitalisation) notFound();

  // Récupère les médicaments disponibles en stock pour le bon de commande
  const articles = await getArticlesStock(utilisateur.hospital_id);

  return (
    <FicheHospitalisation
      hospitalisation={hospitalisation}
      articles={articles}
      hospitalId={utilisateur.hospital_id}
      utilisateurId={utilisateur.id}
      utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
    />
  );
}