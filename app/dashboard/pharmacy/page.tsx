import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
import {
  getArticlesStock,
  getStatsPharmacieAction,
  getMouvementsStock,
} from "./actions";
import { PharmacieStats } from "@/components/pharmacy/PharmacieStats";
import { ArticlesStockList } from "@/components/pharmacy/ArticlesStockList";

interface PharmacyPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function PharmacyPage({ searchParams }: PharmacyPageProps) {
  const utilisateur = await withPermission("PHARMACIE", "peut_voir");

  const { q } = await searchParams;

  const [articles, stats, mouvements, perms] = await Promise.all([
    getArticlesStock(utilisateur.hospital_id, {
      search:         q,
      avecMouvements: true,
    }),
    getStatsPharmacieAction(utilisateur.hospital_id),
    getMouvementsStock(utilisateur.hospital_id),
    getPermissionsModule(
      utilisateur.hospital_id,
      utilisateur.role,
      "PHARMACIE",
      utilisateur.role_personnalise_id
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pharmacie & Stocks</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gestion des médicaments et consommables
        </p>
      </div>

      <PharmacieStats stats={stats} />

      <ArticlesStockList
        articles={articles}
        mouvements={mouvements}
        hospitalId={utilisateur.hospital_id}
        utilisateurId={utilisateur.id}
        utilisateurNom={`${utilisateur.prenom} ${utilisateur.nom}`}
        searchQuery={q ?? ""}
        peutCreer={perms.peut_creer}
        peutModifier={perms.peut_modifier}
        peutSupprimer={perms.peut_supprimer}
      />
    </div>
  );
}
