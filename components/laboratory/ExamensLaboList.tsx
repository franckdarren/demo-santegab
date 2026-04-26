// ============================================================
// EXAMENS LABO LIST — Liste avec filtres et actions
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Loader2, FlaskConical, AlertTriangle, CalendarIcon, X } from "lucide-react";
import { formatDate, formatTime, getInitials, cn } from "@/lib/utils";
import { StatutExamen } from "@/app/generated/prisma/client";
import { NouvelleDemandeLaboDialog } from "./NouvelleDemandeLaboDialog";
import { ExamenLaboDetailDialog } from "./ExamenLaboDetailDialog";

const STATUT_CONFIG: Record<StatutExamen, { label: string; color: string }> = {
  EN_ATTENTE:     { label: "En attente",    color: "bg-orange-100 text-orange-700" },
  EN_COURS:       { label: "En cours",      color: "bg-blue-100 text-blue-700" },
  RESULTAT_SAISI: { label: "Saisi",     color: "bg-purple-100 text-purple-700" },
  VALIDE:         { label: "Validé",        color: "bg-green-100 text-green-700" },
  ANNULE:         { label: "Annulé",        color: "bg-red-100 text-red-700" },
};

const TYPE_LABELS: Record<string, string> = {
  BILAN_SANGUIN:  "Bilan sanguin",
  BILAN_URINAIRE: "Bilan urinaire",
  BACTERIOLOGIE:  "Bactériologie",
  PARASITOLOGIE:  "Parasitologie",
  SEROLOGIE:      "Sérologie",
  BIOCHIMIE:      "Biochimie",
  HEMATOLOGIE:    "Hématologie",
  AUTRE:          "Autre",
};

const FILTRES = [
  { label: "Tous",       value: "" },
  { label: "En attente", value: "EN_ATTENTE" },
  { label: "En cours",   value: "EN_COURS" },
  { label: "Saisis",  value: "RESULTAT_SAISI" },
  { label: "Validés",    value: "VALIDE" },
];

interface ExamenLaboExamenDetail {
  id: string;
  prix_snapshot: number;
  catalogue: { id: string; nom: string; famille: string };
}

interface ExamenLabo {
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
  prix_unitaire: number | null;
  facture_id: string | null;
  created_at: Date;
  updated_at: Date;
  patient: { id: string; nom: string; prenom: string; numero_dossier: string };
  medecin: { id: string; nom: string; prenom: string };
  examens_details: ExamenLaboExamenDetail[];
}

interface CatalogueItem {
  id: string;
  famille: string;
  nom: string;
  prix: number;
  actif: boolean;
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

interface ExamensLaboListProps {
  examens: ExamenLabo[];
  medecins: Medecin[];
  patients: PatientHospital[];
  catalogue: CatalogueItem[];
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
  searchQuery: string;
  peutCreer: boolean;
  peutModifier: boolean;
  peutSupprimer: boolean;
}

export function ExamensLaboList({
  examens,
  medecins,
  patients,
  catalogue,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  searchQuery,
  peutCreer,
  peutModifier,
  peutSupprimer,
}: ExamensLaboListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchQuery);
  const [isPending, startTransition] = useTransition();
  const [filtreStatut, setFiltreStatut] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin]   = useState("");
  const [dialogCreer, setDialogCreer] = useState(false);
  const [examenSelectionne, setExamenSelectionne] =
    useState<ExamenLabo | null>(null);

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const examensFiltres = examens.filter((e) => {
    if (filtreStatut && e.statut !== filtreStatut) return false;

    if (dateDebut) {
      const debut = new Date(dateDebut);
      debut.setHours(0, 0, 0, 0);
      if (new Date(e.created_at) < debut) return false;
    }
    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      if (new Date(e.created_at) > fin) return false;
    }

    return true;
  });

  const aFiltreDateActif = dateDebut || dateFin;

  return (
    <div className="space-y-4">

      {/* Barre de recherche + bouton */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par patient, type d'examen..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200"
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>
        {peutCreer && (
          <Button
            type="button"
            onClick={() => setDialogCreer(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nouvelle demande</span>
          </Button>
        )}
      </div>

      {/* Filtres statut */}
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

      {/* Filtre par date */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>Période :</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <span className="text-xs text-gray-400">—</span>
          <input
            type="date"
            value={dateFin}
            min={dateDebut || undefined}
            onChange={(e) => setDateFin(e.target.value)}
            className="h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {aFiltreDateActif && (
            <button
              type="button"
              onClick={() => { setDateDebut(""); setDateFin(""); }}
              className="flex items-center gap-1 px-2 h-8 rounded-lg text-xs text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <X className="h-3 w-3" />
              Effacer
            </button>
          )}
        </div>
        {aFiltreDateActif && (
          <span className="text-xs text-blue-600 font-medium">
            {examensFiltres.length} résultat{examensFiltres.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Liste */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {examensFiltres.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <FlaskConical className="h-5 w-5 text-gray-400" />
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
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-cyan-100 text-cyan-700 font-semibold text-sm">
                        {getInitials(nomPatient)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {nomPatient}
                        </p>
                        {/* Badge urgence */}
                        {examen.urgence && (
                          <Badge className="text-[10px] bg-red-100 text-red-700 border-0 py-0 px-1.5 flex items-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            URGENT
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {examen.examens_details.length > 0
                          ? examen.examens_details.map((d) => d.catalogue.nom).join(", ")
                          : (TYPE_LABELS[examen.type_examen] ?? examen.type_examen)}
                        {" · "}Dr. {examen.medecin.nom}
                      </p>
                    </div>

                    {/* Fichier PDF si disponible */}
                    {examen.fichier_url && (
                      <span className="hidden md:flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg shrink-0">
                        📄 PDF
                      </span>
                    )}

                    {/* Date */}
                    <div className="hidden sm:block text-right shrink-0">
                      <p className="text-xs font-medium text-gray-700">
                        {formatDate(examen.created_at)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(examen.created_at)}
                      </p>
                    </div>

                    {/* Statut */}
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

      {/* Dialog nouvelle demande */}
      <NouvelleDemandeLaboDialog
        open={dialogCreer}
        onOpenChange={setDialogCreer}
        hospitalId={hospitalId}
        medecins={medecins}
        patients={patients}
        catalogue={catalogue}
        medecinConnecteId={utilisateurId}
        medecinConnecteNom={utilisateurNom}
      />

      {/* Dialog détail examen */}
      {examenSelectionne && (
        <ExamenLaboDetailDialog
          examen={examenSelectionne}
          hospitalId={hospitalId}
          utilisateurId={utilisateurId}
          utilisateurNom={utilisateurNom}
          open={!!examenSelectionne}
          peutModifier={peutModifier}
          onOpenChange={(open) => {
            if (!open) setExamenSelectionne(null);
          }}
        />
      )}
    </div>
  );
}