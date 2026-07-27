// ============================================================
// PAGE FICHE HOSPITALISATION — Détail d'un séjour
// ============================================================

import { notFound, redirect } from "next/navigation";
import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
import { MASQUAGE_KIMBA_ACTIF } from "@/lib/kimba-scope";
import { getHospitalisationById } from "@/app/dashboard/hospitalisations/actions";
import { getArticlesStock } from "@/app/dashboard/pharmacy/actions";
import { FicheHospitalisation } from "@/components/hospitalisations/FicheHospitalisation";

interface HospitalisationPageProps {
  params: Promise<{ id: string }>;
}

export default async function HospitalisationPage({
  params,
}: HospitalisationPageProps) {
  // Module hors périmètre du cahier des charges KIMBA → accès URL direct bloqué
  if (MASQUAGE_KIMBA_ACTIF) redirect("/dashboard");

  const utilisateur = await withPermission("HOSPITALISATION", "peut_voir");

  const { id } = await params;

  const [hospitalisation, articles, perms] = await Promise.all([
    getHospitalisationById(id, utilisateur.hospital_id),
    getArticlesStock(utilisateur.hospital_id),
    getPermissionsModule(
      utilisateur.hospital_id,
      utilisateur.role,
      "HOSPITALISATION",
      utilisateur.role_personnalise_id
    ),
  ]);

  if (!hospitalisation) notFound();

  return (
    <FicheHospitalisation
      hospitalisation={hospitalisation}
      articles={articles}
      hospitalId={utilisateur.hospital_id}
      utilisateurId={utilisateur.id}
      utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
      peutModifier={perms.peut_modifier}
    />
  );
}
