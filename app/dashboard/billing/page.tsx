// ============================================================
// PAGE FACTURATION — Liste avec KPIs et actions
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getFactures, getStatsFacturation } from "./actions";
import { getPatientsHospital } from "@/app/dashboard/consultations/actions";
import { BillingStats } from "@/components/billing/BillingStats";
import { FacturesList } from "@/components/billing/FacturesList";

interface BillingPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  // --------------------------------------------------------
  // Auth
  // --------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const { q } = await searchParams;

  // --------------------------------------------------------
  // Données en parallèle
  // --------------------------------------------------------
  const [factures, stats, patients, hospital] = await Promise.all([
    getFactures(utilisateur.hospital_id, q),
    getStatsFacturation(utilisateur.hospital_id),
    getPatientsHospital(utilisateur.hospital_id),
    prisma.hospital.findUnique({
      where: { id: utilisateur.hospital_id },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gestion des factures et paiements
        </p>
      </div>

      {/* KPIs */}
      <BillingStats stats={stats} />

      {/* Liste des factures */}
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
        searchQuery={q ?? ""}
      />
    </div>
  );
}