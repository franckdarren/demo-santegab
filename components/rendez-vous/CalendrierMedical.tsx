// ============================================================
// CALENDRIER MÉDICAL — Vue semaine + journée détaillée
//
// Répond à l'exigence §5.7 du cahier des charges KIMBA.
//
// Le bandeau du haut affiche les 7 jours de la semaine avec le
// nombre de rendez-vous. Le clic sur un jour recharge la page
// via l'URL (?date=YYYY-MM-DD) : l'état reste partageable.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Stethoscope,
  CalendarX,
  Loader2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { StatutRendezVous } from "@/app/generated/prisma/client";
import { changerStatutRendezVous } from "@/app/dashboard/rendez-vous/actions";
import { NouveauRendezVousDialog } from "./NouveauRendezVousDialog";
import { ModifierRendezVousDialog } from "./ModifierRendezVousDialog";

// ============================================================
// Libellés et couleurs des statuts
// ============================================================
const STATUT_RDV: Record<StatutRendezVous, { label: string; color: string }> = {
  PLANIFIE: { label: "Planifié", color: "bg-blue-100 text-blue-700" },
  CONFIRME: { label: "Confirmé", color: "bg-green-100 text-green-700" },
  HONORE:   { label: "Honoré",   color: "bg-gray-100 text-gray-600" },
  ANNULE:   { label: "Annulé",   color: "bg-red-100 text-red-700" },
  ABSENT:   { label: "Absent",   color: "bg-orange-100 text-orange-700" },
};

// ============================================================
// Types des données reçues du serveur
// ============================================================
interface RendezVousComplet {
  id: string;
  date_heure: Date;
  duree_min: number;
  statut: StatutRendezVous;
  motif: string | null;
  notes: string | null;
  patient: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
  };
  medecin: {
    id: string;
    nom: string;
    prenom: string;
  };
  service: {
    id: string;
    nom: string;
    couleur: string;
  } | null;
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

interface Service {
  id: string;
  nom: string;
  couleur: string;
}

// ============================================================
// SOUS-COMPOSANT — Bandeau des 7 jours de la semaine
//
// Déclaré EN DEHORS du composant parent (règle du projet) :
// sinon React le recréerait à chaque render.
// ============================================================
interface BandeauSemaineProps {
  jours: Date[];
  jourSelectionne: Date;
  comptesParJour: Map<string, number>;
  onSelectionner: (jour: Date) => void;
}

function BandeauSemaine({
  jours,
  jourSelectionne,
  comptesParJour,
  onSelectionner,
}: BandeauSemaineProps) {
  // 7 colonnes fixes : l'écart est réduit sur mobile pour que
  // les 7 jours tiennent sans débordement horizontal
  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {jours.map((jour) => {
        const estSelectionne = isSameDay(jour, jourSelectionne);
        const estAujourdhui  = isSameDay(jour, new Date());
        const nombre = comptesParJour.get(format(jour, "yyyy-MM-dd")) ?? 0;

        return (
          <button
            key={jour.toISOString()}
            onClick={() => onSelectionner(jour)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border p-2 sm:p-3 transition-colors",
              estSelectionne
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 bg-white hover:bg-gray-50"
            )}
          >
            <span className="text-[10px] sm:text-xs uppercase text-gray-400">
              {format(jour, "EEE", { locale: fr })}
            </span>
            <span
              className={cn(
                "text-base sm:text-lg font-bold",
                estSelectionne ? "text-blue-700" : "text-gray-800",
                estAujourdhui && !estSelectionne && "text-blue-600"
              )}
            >
              {format(jour, "d")}
            </span>
            {nombre > 0 ? (
              <Badge className="bg-blue-100 text-blue-700 text-[10px] py-0 px-1.5 border-0">
                {nombre}
              </Badge>
            ) : (
              <span className="text-[10px] text-gray-300">—</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// SOUS-COMPOSANT — Carte d'un rendez-vous
// ============================================================
interface CarteRendezVousProps {
  rdv: RendezVousComplet;
  peutModifier: boolean;
  enCours: boolean;
  onChangerStatut: (rdvId: string, statut: StatutRendezVous) => void;
  onModifier: (rdv: RendezVousComplet) => void;
}

function CarteRendezVous({
  rdv,
  peutModifier,
  enCours,
  onChangerStatut,
  onModifier,
}: CarteRendezVousProps) {
  const statut = STATUT_RDV[rdv.statut];
  const heureDebut = format(rdv.date_heure, "HH:mm");

  // Heure de fin calculée à partir de la durée
  const heureFin = format(
    new Date(rdv.date_heure.getTime() + rdv.duree_min * 60_000),
    "HH:mm"
  );

  // Un rendez-vous annulé ou déjà honoré n'a plus d'action à proposer
  const actionsDisponibles = peutModifier && rdv.statut !== "ANNULE" && rdv.statut !== "HONORE";

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">

          {/* Créneau horaire */}
          <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-0 sm:w-24 shrink-0">
            <p className="text-lg font-bold text-gray-900">{heureDebut}</p>
            <p className="text-xs text-gray-400">→ {heureFin}</p>
          </div>

          {/* Détails */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-900">
                {rdv.patient.prenom} {rdv.patient.nom}
              </p>
              <Badge className={cn("text-xs border-0", statut.color)}>
                {statut.label}
              </Badge>
              {rdv.service && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: rdv.service.couleur }}
                  />
                  {rdv.service.nom}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-1">
              {rdv.patient.numero_dossier}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Stethoscope className="h-3.5 w-3.5 shrink-0" />
              Dr. {rdv.medecin.prenom} {rdv.medecin.nom}
            </div>

            {rdv.motif && (
              <p className="text-sm text-gray-600 mt-2">{rdv.motif}</p>
            )}
          </div>

          {/* Actions de statut */}
          {actionsDisponibles && (
            <div className="flex flex-wrap gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={enCours}
                onClick={() => onModifier(rdv)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Modifier
              </Button>
              {rdv.statut === "PLANIFIE" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={enCours}
                  onClick={() => onChangerStatut(rdv.id, "CONFIRME")}
                >
                  Confirmer
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={enCours}
                onClick={() => onChangerStatut(rdv.id, "HONORE")}
              >
                Honoré
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={enCours}
                onClick={() => onChangerStatut(rdv.id, "ABSENT")}
              >
                Absent
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={enCours}
                className="text-red-600 hover:text-red-700"
                onClick={() => onChangerStatut(rdv.id, "ANNULE")}
              >
                Annuler
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
interface CalendrierMedicalProps {
  rendezVousSemaine: RendezVousComplet[];
  debutSemaine: Date;
  jourSelectionne: Date;
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
  medecins: Medecin[];
  patients: PatientHospital[];
  services: Service[];
  peutCreer: boolean;
  peutModifier: boolean;
}

export function CalendrierMedical({
  rendezVousSemaine,
  debutSemaine,
  jourSelectionne,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  medecins,
  patients,
  services,
  peutCreer,
  peutModifier,
}: CalendrierMedicalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [erreur, setErreur] = useState("");

  // Rendez-vous en cours de modification (null = dialog fermé)
  const [rdvAModifier, setRdvAModifier] = useState<RendezVousComplet | null>(null);

  // Les 7 jours de la semaine affichée
  const jours = Array.from({ length: 7 }, (_, i) => addDays(debutSemaine, i));

  // Nombre de rendez-vous par jour, pour les badges du bandeau
  const comptesParJour = new Map<string, number>();
  for (const rdv of rendezVousSemaine) {
    const cle = format(rdv.date_heure, "yyyy-MM-dd");
    comptesParJour.set(cle, (comptesParJour.get(cle) ?? 0) + 1);
  }

  // Rendez-vous du jour sélectionné uniquement
  const rendezVousDuJour = rendezVousSemaine.filter((rdv) =>
    isSameDay(rdv.date_heure, jourSelectionne)
  );

  // La navigation passe par l'URL : l'état reste partageable et
  // le serveur recharge la bonne semaine si on change de semaine.
  function allerA(jour: Date) {
    router.push(`/dashboard/rendez-vous?date=${format(jour, "yyyy-MM-dd")}`);
  }

  function handleChangerStatut(rdvId: string, statut: StatutRendezVous) {
    setErreur("");
    startTransition(async () => {
      try {
        await changerStatutRendezVous(
          rdvId,
          hospitalId,
          statut,
          utilisateurId,
          utilisateurNom
        );
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erreur lors de la mise à jour du rendez-vous.";
        setErreur(message);
        console.error(error);
      }
    });
  }

  return (
    <div className="space-y-6">

      {/* En-tête + navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-500 text-sm mt-0.5 capitalize">
            {format(jourSelectionne, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => allerA(addDays(jourSelectionne, -7))}
            aria-label="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => allerA(new Date())}>
            Aujourd&apos;hui
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => allerA(addDays(jourSelectionne, 7))}
            aria-label="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {peutCreer && (
            <Button onClick={() => setDialogOuvert(true)}>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
          )}
        </div>
      </div>

      {/* Bandeau semaine */}
      <BandeauSemaine
        jours={jours}
        jourSelectionne={jourSelectionne}
        comptesParJour={comptesParJour}
        onSelectionner={allerA}
      />

      {erreur && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <CalendarX className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{erreur}</p>
        </div>
      )}

      {/* Liste du jour */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Mise à jour...
        </div>
      )}

      {rendezVousDuJour.length === 0 ? (
        <Card className="border border-gray-200">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12">
            <Clock className="h-8 w-8 text-gray-300" />
            <p className="text-gray-400 text-sm">
              Aucun rendez-vous ce jour-là
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rendezVousDuJour.map((rdv) => (
            <CarteRendezVous
              key={rdv.id}
              rdv={rdv}
              peutModifier={peutModifier}
              enCours={isPending}
              onChangerStatut={handleChangerStatut}
              onModifier={setRdvAModifier}
            />
          ))}
        </div>
      )}

      {/* Dialog de création */}
      {peutCreer && (
        <NouveauRendezVousDialog
          open={dialogOuvert}
          onOpenChange={setDialogOuvert}
          hospitalId={hospitalId}
          utilisateurId={utilisateurId}
          utilisateurNom={utilisateurNom}
          medecins={medecins}
          patients={patients}
          services={services}
          dateParDefaut={format(jourSelectionne, "yyyy-MM-dd")}
        />
      )}

      {/* Dialog de modification */}
      {/* La clé force le remontage à chaque rendez-vous : le */}
      {/* formulaire se pré-remplit sans useEffect.           */}
      {peutModifier && rdvAModifier && (
        <ModifierRendezVousDialog
          key={rdvAModifier.id}
          open={true}
          onOpenChange={(ouvert) => {
            if (!ouvert) setRdvAModifier(null);
          }}
          hospitalId={hospitalId}
          utilisateurId={utilisateurId}
          utilisateurNom={utilisateurNom}
          medecins={medecins}
          services={services}
          rendezVous={rdvAModifier}
        />
      )}
    </div>
  );
}
