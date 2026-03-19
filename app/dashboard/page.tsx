// ============================================================
// PAGE DASHBOARD — Vue d'ensemble pour le directeur
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  getDashboardStats,
  getConsultationsParJour,
  getRevenusParAssurance,
  getDerniersConsultations,
} from "./actions";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ConsultationsChart } from "@/components/dashboard/ConsultationsChart";
import { AssuranceChart } from "@/components/dashboard/AssuranceChart";
import { DernieresConsultations } from "@/components/dashboard/DernieresConsultations";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  // Récupère toutes les données en parallèle
  const [stats, consultationsParJour, revenusParAssurance, dernieres] =
    await Promise.all([
      getDashboardStats(utilisateur.hospital_id),
      getConsultationsParJour(utilisateur.hospital_id),
      getRevenusParAssurance(utilisateur.hospital_id),
      getDerniersConsultations(utilisateur.hospital_id),
    ]);

  return (
    <div className="space-y-6">

      {/* En-tête page */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Vue d'ensemble de l'activité — {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* KPIs */}
      <StatsCards stats={stats} />

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConsultationsChart data={consultationsParJour} />
        </div>
        <div className="lg:col-span-1">
          <AssuranceChart data={revenusParAssurance} />
        </div>
      </div>

      {/* Tableau activité récente */}
      <DernieresConsultations consultations={dernieres} />

    </div>
  );
}