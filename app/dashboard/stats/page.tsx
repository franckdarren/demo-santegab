// ============================================================
// PAGE STATISTIQUES & REPORTING
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getStatsGenerales, getStatsActivite, getStatsFinancieres, getStatsStock } from "./actions";
import { StatsGenerales } from "@/components/stats/StatsGenerales";
import { ActiviteChart } from "@/components/stats/ActiviteChart";
import { StatsFinancieres } from "@/components/stats/StatsFinancieres";
import { StatsStock } from "@/components/stats/StatsStock";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const [generales, activite, financieres, stock] = await Promise.all([
    getStatsGenerales(utilisateur.hospital_id),
    getStatsActivite(utilisateur.hospital_id),
    getStatsFinancieres(utilisateur.hospital_id),
    getStatsStock(utilisateur.hospital_id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Statistiques & Reporting
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Vue d'ensemble de l'activité de votre établissement
        </p>
      </div>

      <StatsGenerales stats={generales} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiviteChart data={activite} />
        <StatsFinancieres stats={financieres} />
      </div>

      <StatsStock stats={stock} />
    </div>
  );
}