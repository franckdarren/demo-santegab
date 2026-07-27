// ============================================================
// RENDEZ-VOUS DU JOUR — Encart du dashboard
//
// Tient lieu de « notification » pour le module Rendez-vous :
// pas d'email ni de SMS, un simple rappel visuel à la connexion.
// ============================================================

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { StatutRendezVous } from "@/app/generated/prisma/client";

// Libellé + couleur par statut.
// Les rendez-vous annulés sont déjà exclus par getRendezVousDuJour,
// mais on couvre tous les statuts pour éviter tout affichage erroné.
const STATUT_RDV: Record<StatutRendezVous, { label: string; color: string }> = {
  PLANIFIE: { label: "Planifié", color: "bg-blue-100 text-blue-700" },
  CONFIRME: { label: "Confirmé", color: "bg-green-100 text-green-700" },
  HONORE:   { label: "Honoré",   color: "bg-gray-100 text-gray-600" },
  ANNULE:   { label: "Annulé",   color: "bg-red-100 text-red-700" },
  ABSENT:   { label: "Absent",   color: "bg-orange-100 text-orange-700" },
};

interface RendezVousDuJourProps {
  rendezVous: Array<{
    id: string;
    date_heure: Date;
    statut: StatutRendezVous;
    motif: string | null;
    patient: {
      nom: string;
      prenom: string;
    };
    medecin: {
      nom: string;
      prenom: string;
    };
  }>;
}

export function RendezVousDuJour({ rendezVous }: RendezVousDuJourProps) {
  // On n'affiche que les 5 prochains pour garder l'encart compact
  const apercu = rendezVous.slice(0, 5);

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-5">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Rendez-vous du jour
              </p>
              <p className="text-xs text-gray-400">
                {rendezVous.length === 0
                  ? "Aucun rendez-vous prévu"
                  : `${rendezVous.length} rendez-vous prévu${rendezVous.length > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/rendez-vous"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Voir le calendrier
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Liste */}
        {apercu.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6">
            <Clock className="h-4 w-4 text-gray-300" />
            <p className="text-sm text-gray-400">
              Journée libre — aucun rendez-vous planifié
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {apercu.map((rdv) => (
              <div
                key={rdv.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50"
              >
                <span className="text-sm font-bold text-gray-900 w-12 shrink-0">
                  {format(rdv.date_heure, "HH:mm")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {rdv.patient.prenom} {rdv.patient.nom}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    Dr. {rdv.medecin.prenom} {rdv.medecin.nom}
                    {rdv.motif ? ` — ${rdv.motif}` : ""}
                  </p>
                </div>
                <Badge
                  className={`text-[10px] py-0 px-1.5 border-0 shrink-0 ${STATUT_RDV[rdv.statut].color}`}
                >
                  {STATUT_RDV[rdv.statut].label}
                </Badge>
              </div>
            ))}

            {rendezVous.length > apercu.length && (
              <p className="text-xs text-gray-400 pt-1">
                + {rendezVous.length - apercu.length} autre
                {rendezVous.length - apercu.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
