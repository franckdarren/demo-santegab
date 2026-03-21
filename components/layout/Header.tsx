"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { LogOut, User, Building2, ChevronDown } from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import { Role } from "@/app/generated/prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN:   "Super Admin",
  ADMIN:         "Administrateur",
  MEDECIN:       "Médecin",
  INFIRMIER:     "Infirmier(e)",
  LABORANTIN:    "Laborantin",
  RADIOLOGUE:    "Radiologue",
  PHARMACIEN:    "Pharmacien",
  COMPTABLE:     "Comptable",
  ADMINISTRATIF: "Administratif",
};

const ROLE_COLORS: Partial<Record<Role, string>> = {
  MEDECIN:     "bg-green-100 text-green-700",
  ADMIN:       "bg-blue-100 text-blue-700",
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  INFIRMIER:   "bg-cyan-100 text-cyan-700",
  COMPTABLE:   "bg-orange-100 text-orange-700",
};

interface HeaderProps {
  utilisateur: {
    nom: string;
    prenom: string;
    email: string;
    role: Role;
  };
  hospitalNom: string;
}

export function Header({ utilisateur, hospitalNom }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const [ouvert, setOuvert] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const initiales = getInitials(`${utilisateur.prenom} ${utilisateur.nom}`);
  const roleLabel = ROLE_LABELS[utilisateur.role];
  const roleColor = ROLE_COLORS[utilisateur.role] ?? "bg-gray-100 text-gray-700";

  function handleOuvrir() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setOuvert((v) => !v);
  }

  // Ferme le menu si clic en dehors — mais pas pendant le logout
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (loggingOut) return; // Bloque la fermeture pendant le logout
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOuvert(false);
      }
    }
    if (ouvert || loggingOut) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ouvert, loggingOut]);

  // Ferme sur Escape — mais pas pendant le logout
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (loggingOut) return;
      if (e.key === "Escape") setOuvert(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [loggingOut]);

  async function handleLogout() {
    setLoggingOut(true);
    // On ne ferme PAS le menu pour que le spinner reste visible
    await supabase.auth.signOut();
    // Délai pour que le spinner soit visible avant la redirection
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">

      {/* -------------------------------------------------- */}
      {/* GAUCHE — Trigger sidebar + nom hôpital             */}
      {/* -------------------------------------------------- */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-gray-500 hover:text-gray-800" />
        <Separator orientation="vertical" className="h-5 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            {hospitalNom}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* DROITE — Bouton profil                             */}
      {/* -------------------------------------------------- */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOuvrir}
        disabled={loggingOut}
        className="flex items-center gap-2 h-10 px-3 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-700 text-white text-xs font-semibold">
            {initiales}
          </AvatarFallback>
        </Avatar>

        <div className="hidden sm:flex flex-col text-left leading-tight">
          <span className="text-sm font-medium text-gray-900">
            {utilisateur.prenom}
          </span>
          <span className="text-xs text-gray-400">{roleLabel}</span>
        </div>

        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform duration-200",
          ouvert && "rotate-180"
        )} />
      </button>

      {/* ============================================================
          Menu dropdown — position:fixed
          Reste visible pendant le logout (ouvert || loggingOut)
          pour que le spinner soit toujours affiché
          ============================================================ */}
      {(ouvert || loggingOut) && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: position.top,
            right: position.right,
            zIndex: 99999,
          }}
          className="w-64 rounded-xl border border-gray-200 bg-white shadow-xl p-2"
        >
          {/* Carte utilisateur */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700 shrink-0 text-sm">
              {initiales}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {utilisateur.prenom} {utilisateur.nom}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {utilisateur.email}
              </p>
              <Badge className={`mt-1 w-fit text-[10px] border-0 ${roleColor}`}>
                {roleLabel}
              </Badge>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2" />

          {/* Actions */}
          <div className="space-y-0.5">

            {/* Mon profil — désactivé pour la démo */}
            <button
              type="button"
              disabled
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 cursor-not-allowed"
            >
              <User className="h-4 w-4" />
              Mon profil
            </button>

            {/* Déconnexion avec spinner */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loggingOut ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Déconnexion en cours...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </>
              )}
            </button>

          </div>
        </div>
      )}
    </header>
  );
}