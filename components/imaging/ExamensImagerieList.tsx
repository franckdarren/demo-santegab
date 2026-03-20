"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Loader2, ScanLine, AlertTriangle } from "lucide-react";
import { formatDate, formatTime, getInitials, cn } from "@/lib/utils";
import { StatutExamen } from "@/app/generated/prisma/client";
import { NouvelleDemandeImagerieDialog } from "./NouvelleDemandeImagerieDialog";
import { ExamenImagerieDetailDialog } from "./ExamenImagerieDetailDialog";

const STATUT_CONFIG: Record<StatutExamen, { label: string; color: string }> = {
  EN_ATTENTE:     { label: "En attente", color: "bg-orange-100 text-orange-700" },
  EN_COURS:       { label: "En cours",   color: "bg-blue-100 text-blue-700" },
  RESULTAT_SAISI: { label: "À valider",  color: "bg-purple-100 text-purple-700" },
  VALIDE:         { label: "Validé",     color: "bg-green-100 text-green-700" },
  ANNULE:         { label: "Annulé",     color: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<string, string> = {
  RADIOGRAPHIE: "Radiographie",
  ECHOGRAPHIE:  "Échographie",
  SCANNER:      "Scanner",
  IRM:          "IRM",
  MAMMOGRAPHIE: "Mammographie",
  AUTRE:        "Autre",
};

const FILTRES = [
  { label: "Tous",       value: "" },
  { label: "En attente", value: "EN_ATTENTE" },
  { label: "En cours",   value: "EN_COURS" },
  { label: "À valider",  value: "RESULTAT_SAISI" },
  { label: "Validés",    value: "VALIDE" },
];

interface ExamenImagerie {
  id: string;
  statut: StatutExamen;
  type_examen: string;
  urgence: boolean;
  resultats: string | null;
  fichier_url: string | null;
  fichier_nom: string | null;
  valide_par: string | null;
  valide_le: Date | null;
  notes: string | null;
  zone_anatomique: string | null;
  created_at: Date;
  updated_at: Date;
  patient: { id: string; nom: string; prenom: string; numero_dossier: string };
  medecin: { id: string; nom: string; prenom: string };
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

interface ExamensImagerieListProps {
  examens: ExamenImagerie[];
  medecins: Medecin[];
  patients: PatientHospital[];
  hospitalId: string;
  utilisateurId: string;
  searchQuery: string;
}

export function ExamensImagerieList({
  examens,
  medecins,
  patients,
  hospitalId,
  utilisateurId,
  searchQuery,
}: ExamensImagerieListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchQuery);
  const [isPending, startTransition] = useTransition();
  const [filtreStatut, setFiltreStatut] = useState("");
  const [dialogCreer, setDialogCreer] = useState(false);
  const [examenSelectionne, setExamenSelectionne] =
    useState<ExamenImagerie | null>(null);

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const examensFiltres = examens.filter((e) =>
    filtreStatut ? e.statut === filtreStatut : true
  );

  return (
    <div className="space-y-4">

      {/* Barre de recherche + bouton */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par patient, type d'examen, zone anatomique..."
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
          <span className="hidden sm:inline">Nouvelle demande</span>
        </Button>
      </div>

      {/* Filtres */}
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
                ({examens.filter((e) => e.statut === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {examensFiltres.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <ScanLine className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun examen trouvé</p>
              <p className="text-gray-400 text-sm mt-1">
                {search
                  ? `Aucun résultat pour "${search}"`
                  : "Aucune demande enregistrée"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {examensFiltres.map((examen) => {
                const statut = STATUT_CONFIG[examen.statut];
                const nomPatient = `${examen.patient.prenom} ${examen.patient.nom}`;

                return (
                  <button
                    key={examen.id}
                    type="button"
                    onClick={() => setExamenSelectionne(examen)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold text-sm">
                        {getInitials(nomPatient)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {nomPatient}
                        </p>
                        {examen.urgence && (
                          <Badge className="text-[10px] bg-red-100 text-red-700 border-0 py-0 px-1.5 flex items-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            URGENT
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {TYPE_LABELS[examen.type_examen] ?? examen.type_examen}
                        {examen.zone_anatomique && ` — ${examen.zone_anatomique}`}
                        {" · "}Dr. {examen.medecin.nom}
                      </p>
                    </div>

                    {examen.fichier_url && (
                      <span className="hidden md:flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg shrink-0">
                        📄 PDF
                      </span>
                    )}

                    <div className="hidden sm:block text-right shrink-0">
                      <p className="text-xs font-medium text-gray-700">
                        {formatDate(examen.created_at)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(examen.created_at)}
                      </p>
                    </div>

                    <Badge className={cn("text-xs border-0 shrink-0", statut.color)}>
                      {statut.label}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <NouvelleDemandeImagerieDialog
        open={dialogCreer}
        onOpenChange={setDialogCreer}
        hospitalId={hospitalId}
        medecins={medecins}
        patients={patients}
        medecinConnecteId={utilisateurId}
      />

      {examenSelectionne && (
        <ExamenImagerieDetailDialog
          examen={examenSelectionne}
          hospitalId={hospitalId}
          utilisateurId={utilisateurId}
          open={!!examenSelectionne}
          onOpenChange={(open) => {
            if (!open) setExamenSelectionne(null);
          }}
        />
      )}
    </div>
  );
}