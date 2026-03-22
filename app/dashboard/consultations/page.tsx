// ============================================================
// PAGE CONSULTATIONS — Liste avec recherche et filtres
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  getConsultations,
  getMedecins,
  getPatientsHospital,
} from "./actions";
import { ConsultationsList } from "@/components/consultations/ConsultationsList";

interface ConsultationsPageProps {
  searchParams: Promise<{ q?: string; statut?: string }>;
}

export default async function ConsultationsPage({
  searchParams,
}: ConsultationsPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const { q } = await searchParams;

  const [consultations, medecins, patients] = await Promise.all([
    getConsultations(utilisateur.hospital_id, q),
    getMedecins(utilisateur.hospital_id),
    getPatientsHospital(utilisateur.hospital_id),
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
        hospitalId={utilisateur.hospital_id}
        medecinConnecteId={utilisateur.id}
        medecinConnecteNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        searchQuery={q ?? ""}
      />
    </div>
  );
}