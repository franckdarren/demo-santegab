// ============================================================
// UTILISATEURS LIST — Tableau avec actions
// ============================================================

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus } from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import { Role } from "@/app/generated/prisma/client";
import { NouvelUtilisateurDialog } from "./NouvelUtilisateurDialog";
import { ModifierUtilisateurDialog } from "./ModifierUtilisateurDialog";

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

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN:   "bg-purple-100 text-purple-700",
  ADMIN:         "bg-blue-100 text-blue-700",
  MEDECIN:       "bg-green-100 text-green-700",
  INFIRMIER:     "bg-cyan-100 text-cyan-700",
  LABORANTIN:    "bg-yellow-100 text-yellow-700",
  RADIOLOGUE:    "bg-violet-100 text-violet-700",
  PHARMACIEN:    "bg-pink-100 text-pink-700",
  COMPTABLE:     "bg-orange-100 text-orange-700",
  ADMINISTRATIF: "bg-gray-100 text-gray-700",
};

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: Role;
  est_actif: boolean;
  avatar_url: string | null;
}

interface UtilisateursListProps {
  utilisateurs: Utilisateur[];
  hospitalId: string;
  utilisateurConnecteId: string;
}

export function UtilisateursList({
  utilisateurs,
  hospitalId,
  utilisateurConnecteId,
}: UtilisateursListProps) {
  const [dialogCreer, setDialogCreer] = useState(false);

  const actifs = utilisateurs.filter((u) => u.est_actif);
  const inactifs = utilisateurs.filter((u) => !u.est_actif);

  return (
    <div className="space-y-4">

      {/* Header avec stats + bouton */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">
              {actifs.length} actif{actifs.length > 1 ? "s" : ""}
            </span>
          </div>
          {inactifs.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-400">
                {inactifs.length} désactivé{inactifs.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={() => setDialogCreer(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nouvel utilisateur</span>
        </Button>
      </div>

      {/* Liste */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {utilisateurs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun utilisateur</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {utilisateurs.map((u) => {
                const nomComplet = `${u.prenom} ${u.nom}`;
                const estMoi = u.id === utilisateurConnecteId;

                return (
                  <div
                    key={u.id}
                    className={cn(
                      "flex items-center gap-4 px-5 py-3.5",
                      !u.est_actif && "opacity-50"
                    )}
                  >
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className={cn(
                        "font-semibold text-sm",
                        u.est_actif
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-400"
                      )}>
                        {getInitials(nomComplet)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {nomComplet}
                        </p>
                        {estMoi && (
                          <Badge className="text-[10px] bg-blue-50 text-blue-600 border-0 py-0 px-1.5">
                            Moi
                          </Badge>
                        )}
                        {!u.est_actif && (
                          <Badge className="text-[10px] bg-gray-100 text-gray-500 border-0 py-0 px-1.5">
                            Désactivé
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {u.email}
                        {u.telephone && ` · ${u.telephone}`}
                      </p>
                    </div>

                    {/* Rôle */}
                    <Badge className={cn(
                      "text-xs border-0 hidden sm:flex",
                      ROLE_COLORS[u.role]
                    )}>
                      {ROLE_LABELS[u.role]}
                    </Badge>

                    {/* Actions — ne peut pas se modifier soi-même */}
                    {!estMoi && (
                      <ModifierUtilisateurDialog
                        utilisateur={u}
                        hospitalId={hospitalId}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog nouvel utilisateur */}
      <NouvelUtilisateurDialog
        open={dialogCreer}
        onOpenChange={setDialogCreer}
        hospitalId={hospitalId}
      />
    </div>
  );
}