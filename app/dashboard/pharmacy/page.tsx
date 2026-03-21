import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
  });
  if (!utilisateur) redirect("/login");

  const { q } = await searchParams;

  const [articles, stats, mouvements] = await Promise.all([
    getArticlesStock(utilisateur.hospital_id, q),
    getStatsPharmacieAction(utilisateur.hospital_id),
    getMouvementsStock(utilisateur.hospital_id),
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
        searchQuery={q ?? ""}
      />
    </div>
  );
}