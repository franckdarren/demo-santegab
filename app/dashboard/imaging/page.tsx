import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getExamensImagerie, getStatsImagerie } from "./actions";
import { getMedecins, getPatientsHospital } from "@/app/dashboard/consultations/actions";
import { ImagerieStats } from "@/components/imaging/ImagerieStats";
import { ExamensImagerieList } from "@/components/imaging/ExamensImagerieList";

interface ImagingPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ImagingPage({ searchParams }: ImagingPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const { q } = await searchParams;

  const [examens, stats, medecins, patients] = await Promise.all([
    getExamensImagerie(utilisateur.hospital_id, q),
    getStatsImagerie(utilisateur.hospital_id),
    getMedecins(utilisateur.hospital_id),
    getPatientsHospital(utilisateur.hospital_id),
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
        searchQuery={q ?? ""}
      />
    </div>
  );
}