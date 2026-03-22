import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  getEcritures,
  getStatsComptables,
  getEvolutionMensuelle,
  getDepensesParCategorie,
} from "./actions";
import { ComptabiliteStats } from "@/components/accounting/ComptabiliteStats";
import { JournalComptable } from "@/components/accounting/JournalComptable";
import { EvolutionChart } from "@/components/accounting/EvolutionChart";
import { DepensesChart } from "@/components/accounting/DepensesChart";

export default async function AccountingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const [ecritures, stats, evolution, depensesCategories] = await Promise.all([
    getEcritures(utilisateur.hospital_id),
    getStatsComptables(utilisateur.hospital_id),
    getEvolutionMensuelle(utilisateur.hospital_id),
    getDepensesParCategorie(utilisateur.hospital_id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comptabilité</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Journal comptable et suivi financier
        </p>
      </div>

      <ComptabiliteStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EvolutionChart data={evolution} />
        </div>
        <div className="lg:col-span-1">
          <DepensesChart data={depensesCategories} />
        </div>
      </div>

      <JournalComptable
        ecritures={ecritures}
        hospitalId={utilisateur.hospital_id}
        utilisateurId={utilisateur.id}
        utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
      />
    </div>
  );
}