// ============================================================
// SIDEBAR — Navigation principale (Shadcn Sidebar)
//
// Utilise le composant Sidebar de Shadcn qui gère :
//   - Desktop : sidebar fixe à gauche
//   - Mobile  : drawer qui s'ouvre/ferme avec un bouton
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Role } from "@/app/generated/prisma/client";
import { UsersRound } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FlaskConical,
  Pill,
  Receipt,
  BarChart3,
  Settings,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScanLine } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Role[] | null;
  comingSoon?: boolean;
};

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: null,
  },
  {
    label: "Patients",
    href: "/dashboard/patients",
    icon: Users,
    roles: null,
  },
  {
    label: "Consultations",
    href: "/dashboard/consultations",
    icon: Stethoscope,
    roles: ["ADMIN", "MEDECIN", "INFIRMIER"],
  },
  {
    label: "Facturation",
    href: "/dashboard/billing",
    icon: Receipt,
    roles: ["ADMIN", "COMPTABLE"],
  },
  {
    label: "Laboratoire",
    href: "/dashboard/laboratory",
    icon: FlaskConical,
    roles: ["ADMIN", "LABORANTIN", "MEDECIN"],
    comingSoon: false,
  },

  {
    label: "Imagerie",
    href: "/dashboard/imaging",
    icon: ScanLine,
    roles: ["ADMIN", "RADIOLOGUE", "MEDECIN"],
    comingSoon: false
  },

  {
    label: "Pharmacie",
    href: "/dashboard/pharmacy",
    icon: Pill,
    roles: ["ADMIN", "PHARMACIEN"],
    comingSoon: false,
  },

  {
    label: "Utilisateurs",
    href: "/dashboard/users",
    icon: UsersRound,
    roles: ["ADMIN", "SUPER_ADMIN"],
    comingSoon: false,
  },

  {
    label: "Statistiques",
    href: "/dashboard/stats",
    icon: BarChart3,
    roles: ["ADMIN", "SUPER_ADMIN"],
    comingSoon: false,
  },
];

interface AppSidebarProps {
  role: Role;
  hospitalNom: string;
}

export function AppSidebar({ role, hospitalNom }: AppSidebarProps) {
  const pathname = usePathname();

  const visibleItems = navigation.filter(
    (item) => item.roles === null || item.roles.includes(role)
  );

  // Sépare les items actifs des "bientôt disponible"
  const activeItems = visibleItems.filter((i) => !i.comingSoon);
  const comingSoonItems = visibleItems.filter((i) => i.comingSoon);

  return (
    <Sidebar className="border-r-0">
      {/* -------------------------------------------------- */}
      {/* HEADER SIDEBAR — Logo SANTÉGAB                     */}
      {/* -------------------------------------------------- */}
      <SidebarHeader className="bg-blue-950 border-b border-blue-800">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-lg">🏥</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-wide">
              SANTÉGAB
            </p>
            <p className="text-blue-300 text-xs">Gestion Hospitalière</p>
          </div>
        </div>
      </SidebarHeader>

      {/* -------------------------------------------------- */}
      {/* CONTENU — Navigation                               */}
      {/* -------------------------------------------------- */}
      <SidebarContent className="bg-blue-950">

        {/* Modules actifs */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-400 text-xs uppercase tracking-widest px-4 mt-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {activeItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "text-blue-200 hover:text-white hover:bg-white/10",
                        isActive && "bg-white/15 text-white font-medium"
                      )}
                    >
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Modules bientôt disponibles */}
        {comingSoonItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-blue-400/50 text-xs uppercase tracking-widest px-4">
              Bientôt disponible
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {comingSoonItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        disabled
                        className="text-blue-400/40 cursor-not-allowed hover:bg-transparent hover:text-blue-400/40"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-blue-700/50 text-blue-500/50 py-0 px-1.5 ml-auto"
                        >
                          Bientôt
                        </Badge>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>

      {/* -------------------------------------------------- */}
      {/* FOOTER SIDEBAR — Hôpital actif                     */}
      {/* -------------------------------------------------- */}
      <SidebarFooter className="bg-blue-950 border-t border-blue-800">
        <div className="flex items-center gap-2 px-4 py-3">
          <Building2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span className="text-xs text-blue-400 truncate">{hospitalNom}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}