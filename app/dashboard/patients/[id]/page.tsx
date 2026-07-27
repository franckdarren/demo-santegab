import { notFound } from "next/navigation";
import { getPatientById } from "../actions";
import { getMedecins } from "@/app/dashboard/consultations/actions";
import { PatientHeader } from "@/components/patients/PatientHeader";
import { PatientTabs } from "@/components/patients/PatientTabs";
import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
import { enregistrerConsultationDossier } from "@/lib/audit";

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

  // ----------------------------------------------------------
  // Traçabilité de la lecture du dossier (CDC KIMBA §8)
  //
  // Placé APRÈS le notFound : on ne trace que les accès aboutis,
  // à un dossier réellement rattaché à cet établissement.
  //
  // L'appel ne bloque jamais l'affichage — en cas d'erreur,
  // enregistrerConsultationDossier se contente de logger.
  // ----------------------------------------------------------
  await enregistrerConsultationDossier({
    hospitalId:     utilisateur.hospital_id,
    utilisateurId:  utilisateur.id,
    utilisateurNom: `${utilisateur.prenom} ${utilisateur.nom}`,
    patientId:      patient.id,
    patientNom:     `${patient.prenom} ${patient.nom}`,
    numeroDossier:  patient.numero_dossier,
  });

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
      <PatientTabs
        patient={patient}
        hospitalId={utilisateur.hospital_id}
        patientId={patient.id}
        utilisateurId={utilisateur.id}
        utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        peutModifier={permsPatient.peut_modifier}
        peutSupprimer={permsPatient.peut_supprimer}
      />
    </div>
  );
}
