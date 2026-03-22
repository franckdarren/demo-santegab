// ============================================================
// CONSULTATIONS LIST — Tableau avec filtres et actions
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search, Plus, Loader2, Stethoscope,
  Clock, CheckCircle, XCircle,
} from "lucide-react";
import { formatDate, formatTime, getInitials, cn } from "@/lib/utils";
import { StatutConsultation } from "@/app/generated/prisma/client";
import { NouvelleConsultationDialog } from "./NouvelleConsultationDialog";
import { ConsultationDetailDialog } from "./ConsultationDetailDialog";

const STATUT_CONFIG: Record<StatutConsultation, {
  label: string;
  color: string;
  icon: React.ElementType;
}> = {
  EN_ATTENTE: { label: "En attente", color: "bg-orange-100 text-orange-700", icon: Clock },
  EN_COURS:   { label: "En cours",   color: "bg-blue-100 text-blue-700",    icon: Stethoscope },
  TERMINEE:   { label: "Terminée",   color: "bg-green-100 text-green-700",  icon: CheckCircle },
  ANNULEE:    { label: "Annulée",    color: "bg-red-100 text-red-700",      icon: XCircle },
};

const FILTRES = [
  { label: "Toutes",     value: "" },
  { label: "En attente", value: "EN_ATTENTE" },
  { label: "En cours",   value: "EN_COURS" },
  { label: "Terminées",  value: "TERMINEE" },
];

interface Consultation {
  id: string;
  statut: StatutConsultation;
  motif: string | null;
  diagnostic: string | null;
  date_consultation: Date;
  tension: string | null;
  poids_kg: number | null;
  temperature: number | null;
  notes: string | null;
  taille_cm: number | null;
  patient: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
  };
  medecin: { id: string; nom: string; prenom: string };
  prescriptions: Array<{
    id: string;
    medicament: string;
    dosage: string | null;
    frequence: string | null;
    duree: string | null;
  }>;
  facture: { id: string } | null;
}

interface Medecin {
  id: string;
  nom: string;
  prenom: string;
}

interface PatientHospital {
  patient: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
  };
}

interface ConsultationsListProps {
  consultations: Consultation[];
  medecins: Medecin[];
  patients: PatientHospital[];
  hospitalId: string;
  medecinConnecteId: string;
  medecinConnecteNom: string; // ← ajouté pour l'audit
  searchQuery: string;
}

export function ConsultationsList({
  consultations,
  medecins,
  patients,
  hospitalId,
  medecinConnecteId,
  medecinConnecteNom, // ← ajouté
  searchQuery,
}: ConsultationsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchQuery);
  const [isPending, startTransition] = useTransition();
  const [filtreStatut, setFiltreStatut] = useState("");
  const [dialogCreer, setDialogCreer] = useState(false);
  const [consultationSelectionnee, setConsultationSelectionnee] =
    useState<Consultation | null>(null);

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const consultationsFiltrees = consultations.filter((c) =>
    filtreStatut ? c.statut === filtreStatut : true
  );

  return (
    <div className="space-y-4">

      {/* Barre de recherche + bouton */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par patient, motif, diagnostic..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200"
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>
        <Button
          type="button"
          onClick={() => setDialogCreer(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nouvelle consultation</span>
        </Button>
      </div>

      {/* Filtres rapides */}
      <div className="flex gap-2 flex-wrap">
        {FILTRES.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltreStatut(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              filtreStatut === f.value
                ? "bg-blue-700 text-white border-blue-700"
                : "border-gray-200 text-gray-600 hover:border-blue-300 bg-white"
            )}
          >
            {f.label}
            {f.value && (
              <span className="ml-1.5 opacity-60">
                ({consultations.filter((c) => c.statut === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {consultationsFiltrees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Stethoscope className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">
                Aucune consultation trouvée
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {search
                  ? `Aucun résultat pour "${search}"`
                  : "Aucune consultation enregistrée"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {consultationsFiltrees.map((c) => {
                const statut     = STATUT_CONFIG[c.statut];
                const StatutIcon = statut.icon;
                const nomPatient = `${c.patient.prenom} ${c.patient.nom}`;
                const nomMedecin = `Dr. ${c.medecin.nom}`;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setConsultationSelectionnee(c)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                        {getInitials(nomPatient)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {nomPatient}
                        </p>
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          {c.patient.numero_dossier}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {c.motif ?? "Consultation générale"} · {nomMedecin}
                      </p>
                    </div>

                    {c.prescriptions.length > 0 && (
                      <span className="hidden md:flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg shrink-0">
                        💊 {c.prescriptions.length} prescription
                        {c.prescriptions.length > 1 ? "s" : ""}
                      </span>
                    )}

                    <div className="hidden sm:block text-right shrink-0">
                      <p className="text-xs font-medium text-gray-700">
                        {formatDate(c.date_consultation)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(c.date_consultation)}
                      </p>
                    </div>

                    <Badge className={cn(
                      "text-xs border-0 shrink-0 flex items-center gap-1",
                      statut.color
                    )}>
                      <StatutIcon className="h-3 w-3" />
                      <span className="hidden sm:inline">{statut.label}</span>
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog nouvelle consultation */}
      <NouvelleConsultationDialog
        open={dialogCreer}
        onOpenChange={setDialogCreer}
        hospitalId={hospitalId}
        medecinConnecteId={medecinConnecteId}
        medecinConnecteNom={medecinConnecteNom} // ← ajouté
        medecins={medecins}
        patients={patients}
      />

      {/* Dialog détail consultation */}
      {consultationSelectionnee && (
        <ConsultationDetailDialog
          consultation={consultationSelectionnee}
          hospitalId={hospitalId}
          utilisateurId={medecinConnecteId}
          utilisateurNom={medecinConnecteNom} // ← ajouté
          open={!!consultationSelectionnee}
          onOpenChange={(open) => {
            if (!open) setConsultationSelectionnee(null);
          }}
        />
      )}
    </div>
  );
}