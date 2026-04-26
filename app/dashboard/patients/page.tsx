// ============================================================
// PAGE PATIENTS — Liste avec recherche
// ============================================================

import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
import { getPatients } from "./actions";
import { PatientsList } from "@/components/patients/PatientsList";

interface PatientsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const utilisateur = await withPermission("PATIENT", "peut_voir");

  const { q } = await searchParams;

  const [patients, perms] = await Promise.all([
    getPatients(utilisateur.hospital_id, q),
    getPermissionsModule(
      utilisateur.hospital_id,
      utilisateur.role,
      "PATIENT",
      utilisateur.role_personnalise_id
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {patients.length} patient{patients.length > 1 ? "s" : ""} enregistré{patients.length > 1 ? "s" : ""}
        </p>
      </div>
      <PatientsList
        patients={patients}
        searchQuery={q ?? ""}
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
