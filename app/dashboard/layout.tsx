// ============================================================
// LAYOUT DASHBOARD — Avec SidebarProvider Shadcn
//
// SidebarProvider gère l'état ouvert/fermé de la sidebar
// automatiquement selon la taille d'écran.
// ============================================================

import { AppSidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where: { email: user.email! },
    include: { hospital: true },
  });

  if (!utilisateur) redirect("/login");

  return (
    // SidebarProvider gère l'état responsive de la sidebar
    <SidebarProvider>

      {/* Sidebar — se transforme en drawer sur mobile */}
      <AppSidebar
        role={utilisateur.role}
        hospitalNom={utilisateur.hospital.nom}
      />

      {/* Zone principale — s'adapte quand la sidebar s'ouvre/ferme */}
      <SidebarInset className="bg-gray-50">
        <Header
          utilisateur={{
            nom: utilisateur.nom,
            prenom: utilisateur.prenom,
            role: utilisateur.role,
            email: utilisateur.email,
          }}
          hospitalNom={utilisateur.hospital.nom}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>

    </SidebarProvider>
  );
}