// ============================================================
// PAGE FACTURATION — Liste avec KPIs et actions
// ============================================================

import { withPermission } from "@/lib/withPermission";
import { getPermissionsModule } from "@/lib/permissions.server";
import { prisma } from "@/lib/prisma";
import { getFactures, getStatsFacturation } from "./actions";
import { getPatientsHospital } from "@/app/dashboard/consultations/actions";
import { BillingStats } from "@/components/billing/BillingStats";
import { FacturesList } from "@/components/billing/FacturesList";

interface BillingPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const utilisateur = await withPermission("FACTURATION", "peut_voir");

  const { q } = await searchParams;

  const [factures, stats, patients, hospital, perms] = await Promise.all([
    getFactures(utilisateur.hospital_id, q),
    getStatsFacturation(utilisateur.hospital_id),
    getPatientsHospital(utilisateur.hospital_id),
    prisma.hospital.findUnique({
      where: { id: utilisateur.hospital_id },
    }),
    getPermissionsModule(
      utilisateur.hospital_id,
      utilisateur.role,
      "FACTURATION",
      utilisateur.role_personnalise_id
    ),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gestion des factures et paiements
        </p>
      </div>

      <BillingStats stats={stats} />

      <FacturesList
        factures={factures}
        patients={patients}
        hospitalId={utilisateur.hospital_id}
        hospital={{
          nom:       hospital?.nom       ?? "Clinique",
          adresse:   hospital?.adresse   ?? null,
          ville:     hospital?.ville     ?? null,
          telephone: hospital?.telephone ?? null,
          email:     hospital?.email     ?? null,
        }}
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
