// ============================================================
// PAGE HOSPITALISATIONS — Vue kanban des séjours
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  getHospitalisations,
  getStatsHospitalisations,
} from "./actions";
import { getMedecins, getPatientsHospital } from "@/app/dashboard/consultations/actions";
import { getChambres } from "@/app/dashboard/chambres/actions";
import { HospitalisationsStats } from "@/components/hospitalisations/HospitalisationsStats";
import { KanbanHospitalisations } from "@/components/hospitalisations/KanbanHospitalisations";

export default async function HospitalisationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const [
    hospitalisationsEnCours,
    hospitalisationsSortie,
    stats,
    medecins,
    patients,
    chambres,
  ] = await Promise.all([
    getHospitalisations(utilisateur.hospital_id, "EN_COURS"),
    getHospitalisations(utilisateur.hospital_id, "SORTIE"),
    getStatsHospitalisations(utilisateur.hospital_id),
    getMedecins(utilisateur.hospital_id),
    getPatientsHospital(utilisateur.hospital_id),
    getChambres(utilisateur.hospital_id),
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
        hospitalId={utilisateur.hospital_id}
        utilisateurId={utilisateur.id}
        utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
      />
    </div>
  );
}