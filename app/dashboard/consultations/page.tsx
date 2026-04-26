// ============================================================
// PAGE CONSULTATIONS — Liste avec recherche et filtres
// ============================================================

import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
import {
  getConsultations,
  getMedecins,
  getPatientsHospital,
  getServicesConsultation,
} from "./actions";
import { ConsultationsList } from "@/components/consultations/ConsultationsList";

interface ConsultationsPageProps {
  searchParams: Promise<{ q?: string; statut?: string }>;
}

export default async function ConsultationsPage({
  searchParams,
}: ConsultationsPageProps) {
  const utilisateur = await withPermission("CONSULTATION", "peut_voir");

  const { q } = await searchParams;

  const [consultations, medecins, patients, services, perms] = await Promise.all([
    getConsultations(utilisateur.hospital_id, q),
    getMedecins(utilisateur.hospital_id),
    getPatientsHospital(utilisateur.hospital_id),
    getServicesConsultation(utilisateur.hospital_id),
    getPermissionsModule(
      utilisateur.hospital_id,
      utilisateur.role,
      "CONSULTATION",
      utilisateur.role_personnalise_id
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {consultations.length} consultation
          {consultations.length > 1 ? "s" : ""} enregistrée
          {consultations.length > 1 ? "s" : ""}
        </p>
      </div>

      <ConsultationsList
        consultations={consultations}
        medecins={medecins}
        patients={patients}
        services={services}
        hospitalId={utilisateur.hospital_id}
        medecinConnecteId={utilisateur.id}
        medecinConnecteNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        searchQuery={q ?? ""}
        peutCreer={perms.peut_creer}
        peutModifier={perms.peut_modifier}
        peutSupprimer={perms.peut_supprimer}
      />
    </div>
  );
}
