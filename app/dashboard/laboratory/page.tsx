// ============================================================
// PAGE LABORATOIRE — Liste des examens avec KPIs
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getExamensLabo, getStatsLabo } from "./actions";
import { getMedecins, getPatientsHospital } from "@/app/dashboard/consultations/actions";
import { LaboStats } from "@/components/laboratory/LaboStats";
import { ExamensLaboList } from "@/components/laboratory/ExamensLaboList";

interface LaboPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function LaboPage({ searchParams }: LaboPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const { q } = await searchParams;

  const [examens, stats, medecins, patients] = await Promise.all([
    getExamensLabo(utilisateur.hospital_id, q),
    getStatsLabo(utilisateur.hospital_id),
    getMedecins(utilisateur.hospital_id),
    getPatientsHospital(utilisateur.hospital_id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laboratoire</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gestion des examens et résultats biologiques
        </p>
      </div>

      <LaboStats stats={stats} />

      <ExamensLaboList
        examens={examens}
        medecins={medecins}
        patients={patients}
        hospitalId={utilisateur.hospital_id}
        utilisateurId={utilisateur.id}
        utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        searchQuery={q ?? ""}
      />
    </div>
  );
}