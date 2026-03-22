// ============================================================
// PAGE PATIENTS — Liste avec recherche
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getPatients } from "./actions";
import { PatientsList } from "@/components/patients/PatientsList";

interface PatientsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const { q } = await searchParams;
  const patients = await getPatients(utilisateur.hospital_id, q);

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
      />
    </div>
  );
}