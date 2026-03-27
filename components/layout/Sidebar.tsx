// ============================================================
// SIDEBAR — Navigation principale avec permissions dynamiques
//
// Les liens sont masqués si l'utilisateur n'a pas la
// permission "peut_voir" sur le module correspondant.
// ADMIN et SUPER_ADMIN voient tout.
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Role } from "@/app/generated/prisma/client";
import { type PermissionModule } from "@/lib/permissions";
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
  Building2,
  ScanLine,
  BookOpen,
  ClipboardList,
  UsersRound,
  Bed,
  DoorOpen,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ============================================================
// Type d'un lien de navigation
// ============================================================
type NavItem = {
  label:   string;
  href:    string;
  icon:    React.ElementType;
  // Module de permission requis (null = toujours visible)
  module:  string | null;
  // Si true → visible uniquement pour ADMIN/SUPER_ADMIN
  adminSeulement?: boolean;
  comingSoon?:     boolean;
};

// ============================================================
// Liens de navigation
// ============================================================
const NAVIGATION: NavItem[] = [
  {
    label:  "Dashboard",
    href:   "/dashboard",
    icon:   LayoutDashboard,
    module: null,
  },
  {
    label:  "Patients",
    href:   "/dashboard/patients",
    icon:   Users,
    module: "PATIENT",
  },
  {
    label:  "Consultations",
    href:   "/dashboard/consultations",
    icon:   Stethoscope,
    module: "CONSULTATION",
  },
  {
    label:  "Hospitalisations",
    href:   "/dashboard/hospitalisations",
    icon:   Bed,
    module: "HOSPITALISATION",
  },
  {
    label:          "Chambres",
    href:           "/dashboard/chambres",
    icon:           DoorOpen,
    module:         null,
    adminSeulement: true,
  },
  {
    label:  "Laboratoire",
    href:   "/dashboard/laboratory",
    icon:   FlaskConical,
    module: "LABORATOIRE",
  },
  {
    label:  "Imagerie",
    href:   "/dashboard/imaging",
    icon:   ScanLine,
    module: "IMAGERIE",
  },
  {
    label:  "Pharmacie",
    href:   "/dashboard/pharmacy",
    icon:   Pill,
    module: "PHARMACIE",
  },
  {
    label:  "Facturation",
    href:   "/dashboard/billing",
    icon:   Receipt,
    module: "FACTURATION",
  },
  {
    label:  "Comptabilité",
    href:   "/dashboard/accounting",
    icon:   BookOpen,
    module: "COMPTABILITE",
  },
  {
    label:  "Statistiques",
    href:   "/dashboard/stats",
    icon:   BarChart3,
    module: "STATISTIQUES",
  },
  {
    label:          "Utilisateurs",
    href:           "/dashboard/users",
    icon:           UsersRound,
    module:         "UTILISATEUR",
  },
  {
    label:          "Roles et Permissions",
    href:           "/dashboard/permissions",
    icon:           ShieldCheck,
    module:         null,
    adminSeulement: true,
  },
  {
    label:  "Journal audit",
    href:   "/dashboard/audit",
    icon:   ClipboardList,
    module: "AUDIT",
  },
];

// ============================================================
// Props
// ============================================================
interface AppSidebarProps {
  role:        Role;
  hospitalNom: string;
  permissions: Record<string, PermissionModule>;
}

// ============================================================
// Composant
// ============================================================
export function AppSidebar({
  role,
  hospitalNom,
  permissions,
}: AppSidebarProps) {
  const pathname = usePathname();

  const estAdmin =
    role === "ADMIN" || role === "SUPER_ADMIN";

  // --------------------------------------------------------
  // Filtre les liens selon les permissions
  // --------------------------------------------------------
  function estVisible(item: NavItem): boolean {
    // Liens admin uniquement
    if (item.adminSeulement && !estAdmin) return false;

    // Liens sans module → toujours visible (dashboard)
    if (item.module === null) return true;

    // ADMIN/SUPER_ADMIN voient tout
    if (estAdmin) return true;

    // Vérifie la permission peut_voir
    return permissions[item.module]?.peut_voir ?? false;
  }

  const itemsVisibles  = NAVIGATION.filter(estVisible).filter((i) => !i.comingSoon);
  const itemsBientot   = NAVIGATION.filter(estVisible).filter((i) => i.comingSoon);

  return (
    <Sidebar className="border-r-0">

      {/* -------------------------------------------------- */}
      {/* HEADER — Logo SANTÉGAB                            */}
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
      {/* CONTENU — Navigation filtrée par permissions       */}
      {/* -------------------------------------------------- */}
      <SidebarContent className="bg-blue-950">

        {/* Liens actifs */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-400 text-xs uppercase tracking-widest px-4 mt-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemsVisibles.map((item) => {
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

        {/* Liens bientôt disponibles */}
        {itemsBientot.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-blue-400/50 text-xs uppercase tracking-widest px-4">
              Bientôt disponible
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {itemsBientot.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        disabled
                        className="text-blue-400/40 cursor-not-allowed hover:bg-transparent"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-blue-700/50 text-blue-500/70 py-0 px-1.5 ml-auto"
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
      {/* FOOTER — Hôpital actif                            */}
      {/* -------------------------------------------------- */}
      <SidebarFooter className="bg-blue-950 border-t border-blue-800">
        <div className="flex items-center gap-2 px-4 py-3">
          <Building2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span className="text-xs text-blue-400 truncate">
            {hospitalNom}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}