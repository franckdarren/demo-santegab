import { notFound } from "next/navigation";
import { getPatientById } from "../actions";
import { getMedecins } from "@/app/dashboard/consultations/actions";
import { PatientHeader } from "@/components/patients/PatientHeader";
import { PatientTabs } from "@/components/patients/PatientTabs";
import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";

interface PatientPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientPage({ params }: PatientPageProps) {
  const utilisateur = await withPermission("PATIENT", "peut_voir");

  const { id } = await params;

  const [patient, medecins, permsPatient, permsConsultation] = await Promise.all([
    getPatientById(id, utilisateur.hospital_id),
    getMedecins(utilisateur.hospital_id),
    getPermissionsModule(utilisateur.hospital_id, utilisateur.role, "PATIENT", utilisateur.role_personnalise_id),
    getPermissionsModule(utilisateur.hospital_id, utilisateur.role, "CONSULTATION", utilisateur.role_personnalise_id),
  ]);

  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <PatientHeader
        patient={patient}
        hospitalId={utilisateur.hospital_id}
        medecinConnecteId={utilisateur.id}
        medecinConnecteNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        utilisateurId={utilisateur.id}
        utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        medecins={medecins}
        peutModifier={permsPatient.peut_modifier}
        peutSupprimer={permsPatient.peut_supprimer}
        peutCreerConsultation={permsConsultation.peut_creer}
      />
      <PatientTabs patient={patient} />
    </div>
  );
}
