import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getPatientById } from "../actions";
import { getMedecins } from "@/app/dashboard/consultations/actions";
import { PatientHeader } from "@/components/patients/PatientHeader";
import { PatientTabs } from "@/components/patients/PatientTabs";

interface PatientPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientPage({ params }: PatientPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const { id } = await params;

  const [patient, medecins] = await Promise.all([
    getPatientById(id, utilisateur.hospital_id),
    getMedecins(utilisateur.hospital_id),
  ]);

  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <PatientHeader
        patient={patient}
        hospitalId={utilisateur.hospital_id}
        medecinConnecteId={utilisateur.id}
        medecinConnecteNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        medecins={medecins}
      />
      <PatientTabs patient={patient} />
    </div>
  );
}