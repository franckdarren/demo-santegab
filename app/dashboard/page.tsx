// ============================================================
// PAGE DASHBOARD — Vue d'ensemble
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShieldOff } from "lucide-react";
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

interface DashboardPageProps {
  searchParams: Promise<{ erreur?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const { erreur } = await searchParams;

  const [stats, consultationsParJour, revenusParAssurance, dernieres] =
    await Promise.all([
      getDashboardStats(utilisateur.hospital_id),
      getConsultationsParJour(utilisateur.hospital_id),
      getRevenusParAssurance(utilisateur.hospital_id),
      getDerniersConsultations(utilisateur.hospital_id),
    ]);

  return (
    <div className="space-y-6">

      {/* -------------------------------------------------- */}
      {/* BANNIÈRE ACCÈS REFUSÉ                             */}
      {/* Affichée quand withPermission redirige ici        */}
      {/* -------------------------------------------------- */}
      {erreur === "acces_refuse" && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <ShieldOff className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700">
              Accès refusé
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Vous n&apos;avez pas les permissions nécessaires pour accéder
              à cette section. Contactez votre administrateur.
            </p>
          </div>
        </div>
      )}

      {/* En-tête page */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Tableau de bord
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Vue d&apos;ensemble de l&apos;activité —{" "}
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            day:     "numeric",
            month:   "long",
            year:    "numeric",
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