// ============================================================
// HEADER — Barre supérieure du dashboard
// ============================================================

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Building2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Role } from "@/app/generated/prisma/client";

// Labels français pour les rôles
const ROLE_LABELS: Record<Role, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Administrateur",
    MEDECIN: "Médecin",
    INFIRMIER: "Infirmier(e)",
    LABORANTIN: "Laborantin",
    RADIOLOGUE: "Radiologue",
    PHARMACIEN: "Pharmacien",
    COMPTABLE: "Comptable",
    ADMINISTRATIF: "Administratif",
};

// Couleurs des badges par rôle
const ROLE_COLORS: Partial<Record<Role, string>> = {
    MEDECIN: "bg-green-100 text-green-700",
    ADMIN: "bg-blue-100 text-blue-700",
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
    INFIRMIER: "bg-cyan-100 text-cyan-700",
    COMPTABLE: "bg-orange-100 text-orange-700",
};

interface HeaderProps {
    utilisateur: {
        nom: string;
        prenom: string;
        role: Role;
        email: string;
    };
    hospitalNom: string;
}

export function Header({ utilisateur, hospitalNom }: HeaderProps) {
    const router = useRouter();
    const supabase = createClient();

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    const initiales = getInitials(`${utilisateur.prenom} ${utilisateur.nom}`);
    const roleLabel = ROLE_LABELS[utilisateur.role];
    const roleColor = ROLE_COLORS[utilisateur.role] ?? "bg-gray-100 text-gray-700";

    return (
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">

            {/* Nom de l'hôpital */}
            <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{hospitalNom}</span>
            </div>

            {/* Profil utilisateur */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2.5 h-9 px-2 hover:bg-gray-100"
                    >
                        <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-blue-700 text-white text-xs font-semibold">
                                {initiales}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-medium text-gray-800 leading-none">
                                {utilisateur.prenom} {utilisateur.nom}
                            </p>
                        </div>
                        <Badge className={`text-xs font-medium hidden sm:flex ${roleColor}`}>
                            {roleLabel}
                        </Badge>
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="font-normal">
                        <p className="text-sm font-medium">{utilisateur.prenom} {utilisateur.nom}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{utilisateur.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-gray-400 cursor-not-allowed">
                        <User className="mr-2 h-4 w-4" />
                        Mon profil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Se déconnecter
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

        </header>
    );
}