import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
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
  const utilisateur = await withPermission("COMPTABILITE", "peut_voir");

  const [ecritures, stats, evolution, depensesCategories, perms] = await Promise.all([
    getEcritures(utilisateur.hospital_id),
    getStatsComptables(utilisateur.hospital_id),
    getEvolutionMensuelle(utilisateur.hospital_id),
    getDepensesParCategorie(utilisateur.hospital_id),
    getPermissionsModule(
      utilisateur.hospital_id,
      utilisateur.role,
      "COMPTABILITE",
      utilisateur.role_personnalise_id
    ),
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
        peutCreer={perms.peut_creer}
        peutModifier={perms.peut_modifier}
        peutSupprimer={perms.peut_supprimer}
      />
    </div>
  );
}
