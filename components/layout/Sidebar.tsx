// ============================================================
// SIDEBAR — Navigation principale
//
// Affiche les modules disponibles selon le rôle de l'utilisateur.
// Certains modules sont désactivés (bientôt disponible) pour
// montrer la vision produit sans les avoir développés.
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Role } from "@/app/generated/prisma/client";
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

// Définition de chaque entrée de navigation
type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  // Rôles autorisés à voir ce module (null = tous)
  roles: Role[] | null;
  // Si true → affiché mais non cliquable (bientôt disponible)
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
    comingSoon: true,
  },
  {
    label: "Pharmacie",
    href: "/dashboard/pharmacy",
    icon: Pill,
    roles: ["ADMIN", "PHARMACIEN"],
    comingSoon: true,
  },
  {
    label: "Statistiques",
    href: "/dashboard/stats",
    icon: BarChart3,
    roles: ["ADMIN", "SUPER_ADMIN"],
    comingSoon: true,
  },
];

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  // Filtre les items selon le rôle de l'utilisateur
  const visibleItems = navigation.filter(
    (item) => item.roles === null || item.roles.includes(role)
  );

  return (
    <aside className="w-64 bg-blue-950 flex flex-col h-full shrink-0">

      {/* Logo SANTÉGAB */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-800">
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          if (item.comingSoon) {
            // Item désactivé — bientôt disponible
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-400/50 cursor-not-allowed"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm flex-1">{item.label}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-blue-700 text-blue-500 py-0 px-1.5"
                >
                  Bientôt
                </Badge>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
                isActive
                  ? "bg-white/15 text-white font-medium"
                  : "text-blue-200 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bas de sidebar — Paramètres */}
      <div className="px-3 py-4 border-t border-blue-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-400/50 cursor-not-allowed">
          <Settings className="h-4 w-4 shrink-0" />
          <span className="text-sm flex-1">Paramètres</span>
          <Badge
            variant="outline"
            className="text-[10px] border-blue-700 text-blue-500 py-0 px-1.5"
          >
            Bientôt
          </Badge>
        </div>
        <div className="flex items-center gap-2 px-3 mt-3">
          <Building2 className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs text-blue-400">Clinique El Rapha</span>
        </div>
      </div>

    </aside>
  );
}