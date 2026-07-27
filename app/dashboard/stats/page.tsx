// ============================================================
// PAGE STATISTIQUES & REPORTING
// ============================================================

import { withPermission } from "@/lib/withPermission";
import { Suspense } from "react";
import {
  getStatsGenerales,
  getStatsActivite,
  getStatsFinancieres,
  getStatsStock,
} from "./actions";
import { StatsGenerales } from "@/components/stats/StatsGenerales";
import { ActiviteChart } from "@/components/stats/ActiviteChart";
import { StatsFinancieres } from "@/components/stats/StatsFinancieres";
import { StatsStock } from "@/components/stats/StatsStock";
import { StatsControles } from "@/components/stats/StatsControles";
import { MASQUAGE_KIMBA_ACTIF } from "@/lib/kimba-scope";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ debut?: string; fin?: string }>;
}) {
  const utilisateur = await withPermission("STATISTIQUES", "peut_voir");

  const { debut, fin } = await searchParams;

  const [generales, activite] = await Promise.all([
    getStatsGenerales(utilisateur.hospital_id, debut, fin),
    getStatsActivite(utilisateur.hospital_id, debut, fin),
  ]);

  // ----------------------------------------------------------
  // Statistiques financières et de stock — hors périmètre du
  // cahier des charges KIMBA. Requêtes évitées si masquage actif.
  // ----------------------------------------------------------
  const financieres = MASQUAGE_KIMBA_ACTIF
    ? null
    : await getStatsFinancieres(utilisateur.hospital_id, debut, fin);

  const stock = MASQUAGE_KIMBA_ACTIF
    ? null
    : await getStatsStock(utilisateur.hospital_id);

  // Label de période affiché dans les composants
  const labelPeriode = debut ? "sur la période" : "ce mois";

  return (
    <div className="space-y-6">
      {/* En-tête + contrôles filtre/export */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Statistiques & Reporting
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Vue d'ensemble de l'activité de votre établissement
          </p>
        </div>
        {/* Suspense requis car StatsControles utilise useSearchParams */}
        <Suspense
          fallback={
            <div className="h-9 w-96 bg-gray-200 animate-pulse rounded-md" />
          }
        >
          <StatsControles hospitalId={utilisateur.hospital_id} />
        </Suspense>
      </div>

      <StatsGenerales stats={generales} labelPeriode={labelPeriode} />

      {/* Sans le bloc financier (hors périmètre KIMBA),         */}
      {/* le graphique d'activité occupe toute la largeur.       */}
      <div
        className={
          financieres
            ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
            : "grid grid-cols-1 gap-6"
        }
      >
        <ActiviteChart data={activite} labelPeriode={labelPeriode} />
        {financieres && (
          <StatsFinancieres stats={financieres} labelPeriode={labelPeriode} />
        )}
      </div>

      {stock && <StatsStock stats={stock} />}
    </div>
  );
}
