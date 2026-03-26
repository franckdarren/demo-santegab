// ============================================================
// FICHE HOSPITALISATION — Détail complet d'un séjour
// Timeline des consommations + récapitulatif financier
// ============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, BedDouble, Pill, Stethoscope,
  LogOut, CreditCard, Plus, Clock,
  CheckCircle, AlertTriangle, Calendar, User,
} from "lucide-react";
import { formatDate, formatTime, formatCurrency, cn } from "@/lib/utils";
import { AjouterMedicamentDialog } from "./AjouterMedicamentDialog";
import { SortiePatientDialog } from "./SortiePatientDialog";
import { ajouterJourneeChambre } from "@/app/dashboard/hospitalisations/actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

// ============================================================
// Types
// ============================================================
interface Article {
  id:             string;
  nom:            string;
  unite:          string;
  quantite_stock: number;
  seuil_alerte:   number;
  prix_unitaire:  number;
  categorie:      string;
}

interface LigneHospitalisation {
  id:            string;
  type_ligne:    string;
  statut:        string;
  description:   string;
  quantite:      number;
  prix_unitaire: number;
  montant_total: number;
  prescrit_par:  string | null;
  notes:         string | null;
  date_ligne:    Date;
  article_stock: { nom: string; unite: string } | null;
}

interface Hospitalisation {
  id:              string;
  statut:          string;
  date_entree:     Date;
  date_sortie:     Date | null;
  motif_admission: string | null;
  diagnostic:      string | null;
  notes:           string | null;
  patient: {
    id:             string;
    nom:            string;
    prenom:         string;
    numero_dossier: string;
    groupe_sanguin: string | null;
    allergies:      string | null;
  };
  medecin: {
    id:     string;
    nom:    string;
    prenom: string;
  };
  chambre: {
    id:              string;
    numero:          string;
    type_chambre:    string;
    prix_journalier: number;
  } | null;
  facture: {
    id:               string;
    numero_facture:   string;
    statut:           string;
    montant_total:    number;
    montant_patient:  number;
    montant_assurance: number;
    lignes:           Array<{ description: string }>;
  } | null;
  lignes: LigneHospitalisation[];
}

interface FicheHospitalisationProps {
  hospitalisation: Hospitalisation;
  articles:        Article[];
  hospitalId:      string;
  utilisateurId:   string;
  utilisateurNom:  string;
}

// ============================================================
// Icône par type de ligne
// ============================================================
const ICONE_LIGNE: Record<string, React.ElementType> = {
  CHAMBRE:        BedDouble,
  MEDICAMENT:     Pill,
  ACTE_INFIRMIER: Stethoscope,
  EXAMEN:         CheckCircle,
  AUTRE:          Plus,
};

const COULEUR_LIGNE: Record<string, string> = {
  CHAMBRE:        "bg-blue-100 text-blue-700",
  MEDICAMENT:     "bg-purple-100 text-purple-700",
  ACTE_INFIRMIER: "bg-cyan-100 text-cyan-700",
  EXAMEN:         "bg-green-100 text-green-700",
  AUTRE:          "bg-gray-100 text-gray-700",
};

const LABEL_TYPE: Record<string, string> = {
  CHAMBRE:        "Chambre",
  MEDICAMENT:     "Médicament",
  ACTE_INFIRMIER: "Acte infirmier",
  EXAMEN:         "Examen",
  AUTRE:          "Autre",
};

// ============================================================
// Composant principal
// ============================================================
export function FicheHospitalisation({
  hospitalisation,
  articles,
  hospitalId,
  utilisateurId,
  utilisateurNom,
}: FicheHospitalisationProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogMedicament, setDialogMedicament] = useState(false);
  const [dialogSortie,     setDialogSortie]     = useState(false);

  const nomPatient     = `${hospitalisation.patient.prenom} ${hospitalisation.patient.nom}`;
  const estEnCours     = hospitalisation.statut === "EN_COURS";
  const estSortie      = hospitalisation.statut === "SORTIE";
  const facturePay     = hospitalisation.facture?.statut === "PAYEE";

  // Calcul durée séjour
  const fin    = hospitalisation.date_sortie ?? new Date();
  const jours  = Math.max(1, Math.ceil(
    (new Date(fin).getTime() - new Date(hospitalisation.date_entree).getTime())
    / (1000 * 60 * 60 * 24)
  ));

  // Lignes en attente stock
  const lignesEnAttente = hospitalisation.lignes.filter(
    (l) => l.statut === "EN_ATTENTE"
  );

  // Groupes de lignes par type pour la timeline
  const lignesServies = hospitalisation.lignes.filter(
    (l) => l.statut === "SERVI"
  );

  function handleAjouterJournee() {
    startTransition(async () => {
      await ajouterJourneeChambre(
        hospitalisation.id,
        hospitalId,
        utilisateurId,
        utilisateurNom
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">

      {/* Retour */}
      <Link
        href="/dashboard/hospitalisations"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux hospitalisations
      </Link>

      {/* -------------------------------------------------- */}
      {/* HEADER — Info patient + statut + actions           */}
      {/* -------------------------------------------------- */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">

            {/* Infos patient */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{nomPatient}</h1>
                <Badge className={cn(
                  "text-xs border-0",
                  estEnCours  ? "bg-blue-100 text-blue-700"   :
                  estSortie   ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-500"
                )}>
                  {estEnCours ? "🏥 En cours" : estSortie ? "🚪 Sorti" : "✅ Clôturé"}
                </Badge>
                {facturePay && (
                  <Badge className="text-xs border-0 bg-green-100 text-green-700">
                    ✅ Payé
                  </Badge>
                )}
              </div>

              {/* Grille infos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Entrée</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatDate(hospitalisation.date_entree)}
                    </p>
                  </div>
                </div>
                {hospitalisation.date_sortie && (
                  <div className="flex items-center gap-2">
                    <LogOut className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Sortie</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatDate(hospitalisation.date_sortie)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Durée</p>
                    <p className="text-sm font-medium text-gray-700">
                      {jours} jour{jours > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Médecin</p>
                    <p className="text-sm font-medium text-gray-700">
                      Dr. {hospitalisation.medecin.nom}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chambre */}
              {hospitalisation.chambre && (
                <div className="flex items-center gap-2">
                  <BedDouble className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-600">
                    Chambre <strong>{hospitalisation.chambre.numero}</strong>
                    {" — "}
                    {hospitalisation.chambre.type_chambre}
                    {" — "}
                    {formatCurrency(hospitalisation.chambre.prix_journalier)}/jour
                  </p>
                </div>
              )}

              {/* Motif */}
              {hospitalisation.motif_admission && (
                <p className="text-sm text-gray-500 italic">
                  Motif : {hospitalisation.motif_admission}
                </p>
              )}

              {/* Allergies */}
              {hospitalisation.patient.allergies && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 rounded-lg border border-orange-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                  <p className="text-xs font-medium text-orange-700">
                    Allergies : {hospitalisation.patient.allergies}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            {estEnCours && (
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  type="button"
                  onClick={() => setDialogMedicament(true)}
                  className="bg-purple-700 hover:bg-purple-800 text-white text-sm"
                >
                  <Pill className="h-4 w-4 mr-1.5" />
                  Médicament
                </Button>
                {hospitalisation.chambre && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    onClick={handleAjouterJournee}
                    className="text-blue-700 border-blue-200 hover:bg-blue-50 text-sm"
                  >
                    <BedDouble className="h-4 w-4 mr-1.5" />
                    + Journée
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => setDialogSortie(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-sm"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  Sortie patient
                </Button>
              </div>
            )}

            {/* Bouton paiement si sorti non payé */}
            {estSortie && !facturePay && (
              <Button
                type="button"
                onClick={() => setDialogSortie(true)}
                className="bg-green-600 hover:bg-green-700 text-white shrink-0"
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                Encaisser {formatCurrency(hospitalisation.facture?.montant_patient ?? 0)}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerte lignes en attente */}
      {lignesEnAttente.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-700">
              {lignesEnAttente.length} médicament{lignesEnAttente.length > 1 ? "s" : ""} en attente de stock
            </p>
            <ul className="mt-1 space-y-0.5">
              {lignesEnAttente.map((l) => (
                <li key={l.id} className="text-xs text-orange-600">
                  • {l.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* -------------------------------------------------- */}
        {/* TIMELINE DES CONSOMMATIONS                        */}
        {/* -------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Timeline des consommations
          </h2>

          {lignesServies.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <p className="text-sm text-gray-400">Aucune consommation enregistrée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lignesServies.map((ligne) => {
                const Icon = ICONE_LIGNE[ligne.type_ligne] ?? Plus;
                const couleur = COULEUR_LIGNE[ligne.type_ligne] ?? "bg-gray-100 text-gray-700";
                return (
                  <div
                    key={ligne.id}
                    className="flex items-start gap-3 p-3.5 bg-white border border-gray-100 rounded-xl"
                  >
                    {/* Icône */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      couleur
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">
                          {ligne.description}
                        </p>
                        <Badge className={cn("text-[10px] border-0", couleur)}>
                          {LABEL_TYPE[ligne.type_ligne] ?? ligne.type_ligne}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-gray-400">
                          {formatDate(ligne.date_ligne)} à {formatTime(ligne.date_ligne)}
                        </p>
                        {ligne.prescrit_par && (
                          <p className="text-xs text-gray-400">
                            par {ligne.prescrit_par}
                          </p>
                        )}
                      </div>
                      {ligne.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {ligne.notes}
                        </p>
                      )}
                    </div>

                    {/* Montant */}
                    <p className="text-sm font-bold text-gray-900 shrink-0">
                      {formatCurrency(ligne.montant_total)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* -------------------------------------------------- */}
        {/* RÉCAPITULATIF FINANCIER                           */}
        {/* -------------------------------------------------- */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Récapitulatif
          </h2>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-4 space-y-3">

              {/* Numéro facture */}
              {hospitalisation.facture && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Facture</span>
                  <span className="font-mono font-medium text-gray-700">
                    {hospitalisation.facture.numero_facture}
                  </span>
                </div>
              )}

              <Separator />

              {/* Détail par type */}
              {(["CHAMBRE", "MEDICAMENT", "ACTE_INFIRMIER", "EXAMEN", "AUTRE"] as const).map((type) => {
                const total = lignesServies
                  .filter((l) => l.type_ligne === type)
                  .reduce((sum, l) => sum + l.montant_total, 0);
                if (total === 0) return null;
                const Icon = ICONE_LIGNE[type];
                return (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-gray-600">{LABEL_TYPE[type]}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                );
              })}

              <Separator />

              {/* Totaux */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total séjour</span>
                  <span className="font-semibold">
                    {formatCurrency(hospitalisation.facture?.montant_total ?? 0)}
                  </span>
                </div>
                {(hospitalisation.facture?.montant_assurance ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Part assurance</span>
                    <span className="text-green-600 font-medium">
                      -{formatCurrency(hospitalisation.facture?.montant_assurance ?? 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
                  <span className="text-gray-900">À payer</span>
                  <span className="text-blue-700">
                    {formatCurrency(hospitalisation.facture?.montant_patient ?? 0)}
                  </span>
                </div>
              </div>

              {/* Statut paiement */}
              <div className={cn(
                "p-2.5 rounded-lg text-center text-xs font-semibold",
                facturePay
                  ? "bg-green-100 text-green-700"
                  : estSortie
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
              )}>
                {facturePay
                  ? "✅ Payé"
                  : estSortie
                  ? "⏳ En attente de paiement"
                  : "🏥 Séjour en cours"}
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic de sortie */}
          {hospitalisation.diagnostic && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Diagnostic de sortie
                </p>
                <p className="text-sm text-gray-700">
                  {hospitalisation.diagnostic}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AjouterMedicamentDialog
        open={dialogMedicament}
        onOpenChange={setDialogMedicament}
        hospitalisationId={hospitalisation.id}
        hospitalId={hospitalId}
        utilisateurId={utilisateurId}
        utilisateurNom={utilisateurNom}
        articles={articles}
      />

      <SortiePatientDialog
        open={dialogSortie}
        onOpenChange={setDialogSortie}
        hospitalisationId={hospitalisation.id}
        hospitalId={hospitalId}
        utilisateurId={utilisateurId}
        utilisateurNom={utilisateurNom}
        nomPatient={nomPatient}
        statut={hospitalisation.statut}
        montantTotal={hospitalisation.facture?.montant_total ?? 0}
        montantPatient={hospitalisation.facture?.montant_patient ?? 0}
        montantAssurance={hospitalisation.facture?.montant_assurance ?? 0}
        nbLignesAttente={lignesEnAttente.length}
      />
    </div>
  );
}