import { AppSidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getPermissionsEffectives } from "@/lib/permissions.server"; // ← getPermissionsEffectives

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const utilisateur = await prisma.utilisateur.findFirst({
    where:   { email: user.email! },
    include: { hospital: true },
  });
  if (!utilisateur) redirect("/login");

  // Résout les permissions en tenant compte du rôle personnalisé
  // si l'utilisateur en a un, sinon utilise le rôle système
  const permissions = await getPermissionsEffectives(
    utilisateur.hospital_id,
    utilisateur.role,
    utilisateur.role_personnalise_id // ← peut être null
  );

  return (
    <SidebarProvider>
      <AppSidebar
        role={utilisateur.role}
        hospitalNom={utilisateur.hospital.nom}
        permissions={permissions}
      />
      <div className="relative flex flex-col flex-1 min-h-svh bg-gray-50 peer-data-[variant=inset]:min-h-[calc(100svh-(--spacing(4)))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow">
        <Header
          utilisateur={{
            nom:    utilisateur.nom,
            prenom: utilisateur.prenom,
            role:   utilisateur.role,
            email:  utilisateur.email,
          }}
          hospitalNom={utilisateur.hospital.nom}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}