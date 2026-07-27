// ============================================================
// PAGE HOSPITALISATIONS — Vue kanban des séjours
// ============================================================

import { redirect } from "next/navigation";
import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
import { MASQUAGE_KIMBA_ACTIF } from "@/lib/kimba-scope";
import {
  getHospitalisations,
  getStatsHospitalisations,
} from "./actions";
import { getMedecins, getPatientsHospital } from "@/app/dashboard/consultations/actions";
import { getChambres } from "@/app/dashboard/chambres/actions";
import { getServices } from "@/app/dashboard/services/actions";
import { HospitalisationsStats } from "@/components/hospitalisations/HospitalisationsStats";
import { KanbanHospitalisations } from "@/components/hospitalisations/KanbanHospitalisations";

export default async function HospitalisationsPage() {
  // Module hors périmètre du cahier des charges KIMBA → accès URL direct bloqué
  if (MASQUAGE_KIMBA_ACTIF) redirect("/dashboard");

  const utilisateur = await withPermission("HOSPITALISATION", "peut_voir");

  const [
    hospitalisationsEnCours,
    hospitalisationsSortie,
    stats,
    medecins,
    patients,
    chambres,
    services,
    perms,
  ] = await Promise.all([
    getHospitalisations(utilisateur.hospital_id, "EN_COURS"),
    getHospitalisations(utilisateur.hospital_id, "SORTIE"),
    getStatsHospitalisations(utilisateur.hospital_id),
    getMedecins(utilisateur.hospital_id),
    getPatientsHospital(utilisateur.hospital_id),
    getChambres(utilisateur.hospital_id),
    getServices(utilisateur.hospital_id),
    getPermissionsModule(
      utilisateur.hospital_id,
      utilisateur.role,
      "HOSPITALISATION",
      utilisateur.role_personnalise_id
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hospitalisations</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gestion des séjours et suivi des consommations
        </p>
      </div>

      <HospitalisationsStats stats={stats} />

      <KanbanHospitalisations
        hospitalisationsEnCours={hospitalisationsEnCours}
        hospitalisationsSortie={hospitalisationsSortie}
        medecins={medecins}
        patients={patients}
        chambres={chambres}
        services={services}
        hospitalId={utilisateur.hospital_id}
        utilisateurId={utilisateur.id}
        utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        peutCreer={perms.peut_creer}
        peutModifier={perms.peut_modifier}
        peutSupprimer={perms.peut_supprimer}
      />
    </div>
  );
}
