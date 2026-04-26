import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
import { getExamensImagerie, getStatsImagerie } from "./actions";
import { getMedecins, getPatientsHospital } from "@/app/dashboard/consultations/actions";
import { ImagerieStats } from "@/components/imaging/ImagerieStats";
import { ExamensImagerieList } from "@/components/imaging/ExamensImagerieList";

interface ImagingPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ImagingPage({ searchParams }: ImagingPageProps) {
  const utilisateur = await withPermission("IMAGERIE", "peut_voir");

  const { q } = await searchParams;

  const [examens, stats, medecins, patients, perms] = await Promise.all([
    getExamensImagerie(utilisateur.hospital_id, q),
    getStatsImagerie(utilisateur.hospital_id),
    getMedecins(utilisateur.hospital_id),
    getPatientsHospital(utilisateur.hospital_id),
    getPermissionsModule(
      utilisateur.hospital_id,
      utilisateur.role,
      "IMAGERIE",
      utilisateur.role_personnalise_id
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Imagerie médicale</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Radiographies, échographies, scanners et IRM
        </p>
      </div>

      <ImagerieStats stats={stats} />

      <ExamensImagerieList
        examens={examens}
        medecins={medecins}
        patients={patients}
        hospitalId={utilisateur.hospital_id}
        utilisateurId={utilisateur.id}
        utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        searchQuery={q ?? ""}
        peutCreer={perms.peut_creer}
        peutModifier={perms.peut_modifier}
        peutSupprimer={perms.peut_supprimer}
      />
    </div>
  );
}
