// ============================================================
// DERNIÈRES CONSULTATIONS — Tableau d'activité récente
// ============================================================

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, formatTime, getInitials } from "@/lib/utils";
import { StatutConsultation } from "@/app/generated/prisma/client";

// Labels et couleurs des statuts
const STATUT_CONFIG: Record<StatutConsultation, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente", color: "bg-orange-100 text-orange-700" },
  EN_COURS:   { label: "En cours",   color: "bg-blue-100 text-blue-700" },
  TERMINEE:   { label: "Terminée",   color: "bg-green-100 text-green-700" },
  ANNULEE:    { label: "Annulée",    color: "bg-red-100 text-red-700" },
};

interface Consultation {
  id: string;
  statut: StatutConsultation;
  motif: string | null;
  date_consultation: Date;
  patient: { nom: string; prenom: string };
  medecin: { nom: string; prenom: string };
}

interface DernieresConsultationsProps {
  consultations: Consultation[];
}

export function DernieresConsultations({
  consultations,
}: DernieresConsultationsProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-800">
          Activité récente
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          5 dernières consultations
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {consultations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Aucune consultation enregistrée
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {consultations.map((c) => {
              const statutConfig = STATUT_CONFIG[c.statut];
              const nomPatient = `${c.patient.prenom} ${c.patient.nom}`;
              const nomMedecin = `Dr. ${c.medecin.nom}`;

              return (
                <div
                  key={c.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar patient */}
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                      {getInitials(nomPatient)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Infos consultation */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {nomPatient}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {c.motif ?? "Consultation générale"} · {nomMedecin}
                    </p>
                  </div>

                  {/* Date + heure */}
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-xs font-medium text-gray-700">
                      {formatDate(c.date_consultation)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(c.date_consultation)}
                    </p>
                  </div>

                  {/* Badge statut */}
                  <Badge
                    className={`text-xs shrink-0 border-0 ${statutConfig.color}`}
                  >
                    {statutConfig.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}