// ============================================================
// LAYOUT DASHBOARD
//
// Layout principal de l'application après connexion.
// Contient la sidebar et le header, partagés entre toutes
// les pages du dashboard.
// ============================================================

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Récupère l'utilisateur connecté via Supabase Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Récupère le profil complet depuis la base de données
  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
    include: { hospital: true },
  });

  // Si l'utilisateur n'a pas de profil en base → déconnexion
  if (!utilisateur) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar fixe à gauche */}
      <Sidebar role={utilisateur.role} />

      {/* Contenu principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header en haut */}
        <Header
          utilisateur={{
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            role: utilisateur.role,
            email: utilisateur.email,
          }}
          hospitalNom={utilisateur.hospital.nom}
        />

        {/* Zone de contenu scrollable */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}