// ============================================================
// KANBAN HOSPITALISATIONS — 3 colonnes : En cours / Sortie / Payées
// ============================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BedDouble, LogOut, CheckCircle,
  Plus, ChevronRight, Clock, AlertTriangle,
} from "lucide-react";
import { formatDate, formatCurrency, getInitials, cn } from "@/lib/utils";
import { AdmissionDialog } from "./AdmissionDialog";

// ============================================================
// Types
// ============================================================
interface Chambre {
  id:              string;
  numero:          string;
  type_chambre:    string;
  prix_journalier: number;
  est_disponible:  boolean;
}

interface Medecin {
  id:     string;
  nom:    string;
  prenom: string;
}

interface PatientHospital {
  patient: {
    id:             string;
    nom:            string;
    prenom:         string;
    numero_dossier: string;
  };
}

interface Hospitalisation {
  id:              string;
  statut:          string;
  date_entree:     Date;
  date_sortie:     Date | null;
  motif_admission: string | null;
  patient: {
    id:     string;
    nom:    string;
    prenom: string;
  };
  medecin: {
    id:     string;
    nom:    string;
    prenom: string;
  };
  chambre: Chambre | null;
  lignes:  Array<{
    id:            string;
    type_ligne:    string;
    statut:        string;
    montant_total: number;
  }>;
  facture: {
    id:             string;
    numero_facture: string;
    statut:         string;
    montant_total:  number;
    montant_patient: number;
  } | null;
}

interface KanbanHospitalisationsProps {
  hospitalisationsEnCours: Hospitalisation[];
  hospitalisationsSortie:  Hospitalisation[];
  medecins:                Medecin[];
  patients:                PatientHospital[];
  chambres:                Chambre[];
  hospitalId:              string;
  utilisateurId:           string;
  utilisateurNom:          string;
}

// ============================================================
// Calcule le nombre de jours d'hospitalisation
// ============================================================
function nbJours(dateEntree: Date, dateSortie?: Date | null): number {
  const fin = dateSortie ?? new Date();
  return Math.max(
    1,
    Math.ceil((fin.getTime() - new Date(dateEntree).getTime()) / (1000 * 60 * 60 * 24))
  );
}

// ============================================================
// Carte d'une hospitalisation EN COURS
// ============================================================
function CarteEnCours({ hospit }: { hospit: Hospitalisation }) {
  const nomPatient  = `${hospit.patient.prenom} ${hospit.patient.nom}`;
  const jours       = nbJours(hospit.date_entree);
  const nbEnAttente = hospit.lignes.filter((l) => l.statut === "EN_ATTENTE").length;
  const totalFact   = hospit.facture?.montant_patient ?? 0;

  return (
    <Link
      href={`/dashboard/hospitalisations/${hospit.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all group"
    >
      {/* Header carte */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
              {getInitials(nomPatient)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-gray-900">{nomPatient}</p>
            <p className="text-xs text-gray-400">
              Dr. {hospit.medecin.nom}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 shrink-0 mt-1 transition-colors" />
      </div>

      {/* Chambre + durée */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {hospit.chambre ? (
          <Badge className="text-[10px] bg-blue-50 text-blue-700 border-0">
            🛏 Chambre {hospit.chambre.numero}
          </Badge>
        ) : (
          <Badge className="text-[10px] bg-gray-100 text-gray-500 border-0">
            Sans chambre
          </Badge>
        )}
        <Badge className="text-[10px] bg-orange-50 text-orange-700 border-0 flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          J+{jours}
        </Badge>
        {nbEnAttente > 0 && (
          <Badge className="text-[10px] bg-red-50 text-red-700 border-0 flex items-center gap-0.5">
            <AlertTriangle className="h-2.5 w-2.5" />
            {nbEnAttente} en attente stock
          </Badge>
        )}
      </div>

      {/* Motif */}
      {hospit.motif_admission && (
        <p className="text-xs text-gray-500 truncate mb-3">
          {hospit.motif_admission}
        </p>
      )}

      {/* Montant en cours */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Depuis le {formatDate(hospit.date_entree)}
        </span>
        <span className="text-sm font-bold text-blue-700">
          {formatCurrency(totalFact)}
        </span>
      </div>
    </Link>
  );
}

// ============================================================
// Carte d'une hospitalisation SORTIE (en attente paiement)
// ============================================================
function CarteSortie({
  hospit,
  utilisateurId,
  utilisateurNom,
  hospitalId,
}: {
  hospit:         Hospitalisation;
  utilisateurId:  string;
  utilisateurNom: string;
  hospitalId:     string;
}) {
  const nomPatient = `${hospit.patient.prenom} ${hospit.patient.nom}`;
  const jours      = nbJours(hospit.date_entree, hospit.date_sortie);

  return (
    <Link
      href={`/dashboard/hospitalisations/${hospit.id}`}
      className="block bg-white border border-amber-200 rounded-xl p-4 hover:border-amber-400 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-amber-100 text-amber-700 font-semibold text-sm">
              {getInitials(nomPatient)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-gray-900">{nomPatient}</p>
            <p className="text-xs text-gray-400">
              Sorti le {hospit.date_sortie ? formatDate(hospit.date_sortie) : "—"}
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 shrink-0 mt-1 transition-colors" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Badge className="text-[10px] bg-amber-50 text-amber-700 border-0">
          {jours} jour{jours > 1 ? "s" : ""}
        </Badge>
        {hospit.chambre && (
          <Badge className="text-[10px] bg-gray-100 text-gray-500 border-0">
            Chambre {hospit.chambre.numero}
          </Badge>
        )}
      </div>

      {/* Montant à encaisser */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs font-semibold text-amber-700">
          ⏳ En attente paiement
        </span>
        <span className="text-sm font-bold text-amber-700">
          {formatCurrency(hospit.facture?.montant_patient ?? 0)}
        </span>
      </div>
    </Link>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL — Kanban 3 colonnes
// ============================================================
export function KanbanHospitalisations({
  hospitalisationsEnCours,
  hospitalisationsSortie,
  medecins,
  patients,
  chambres,
  hospitalId,
  utilisateurId,
  utilisateurNom,
}: KanbanHospitalisationsProps) {
  const [dialogAdmission, setDialogAdmission] = useState(false);

  // Filtre les hospitalisations sortie payées vs en attente
  const sortieEnAttente = hospitalisationsSortie.filter(
    (h) => h.facture?.statut !== "PAYEE"
  );
  const sortiePayees = hospitalisationsSortie.filter(
    (h) => h.facture?.statut === "PAYEE"
  );

  return (
    <div className="space-y-4">

      {/* Bouton admission */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => setDialogAdmission(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Admettre un patient
        </Button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* -------------------------------------------------- */}
        {/* COLONNE 1 — En cours                              */}
        {/* -------------------------------------------------- */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              En cours
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {hospitalisationsEnCours.length}
            </span>
          </div>

          {hospitalisationsEnCours.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <BedDouble className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucun patient hospitalisé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hospitalisationsEnCours.map((h) => (
                <CarteEnCours key={h.id} hospit={h} />
              ))}
            </div>
          )}
        </div>

        {/* -------------------------------------------------- */}
        {/* COLONNE 2 — Sortie (en attente paiement)          */}
        {/* -------------------------------------------------- */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Sortie — À encaisser
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {sortieEnAttente.length}
            </span>
          </div>

          {sortieEnAttente.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <LogOut className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune facture en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortieEnAttente.map((h) => (
                <CarteSortie
                  key={h.id}
                  hospit={h}
                  utilisateurId={utilisateurId}
                  utilisateurNom={utilisateurNom}
                  hospitalId={hospitalId}
                />
              ))}
            </div>
          )}
        </div>

        {/* -------------------------------------------------- */}
        {/* COLONNE 3 — Payées ce mois                        */}
        {/* -------------------------------------------------- */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Payées ce mois
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {sortiePayees.length}
            </span>
          </div>

          {sortiePayees.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <CheckCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucune ce mois</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortiePayees.map((h) => {
                const nomPatient = `${h.patient.prenom} ${h.patient.nom}`;
                return (
                  <Link
                    key={h.id}
                    href={`/dashboard/hospitalisations/${h.id}`}
                    className="block bg-green-50 border border-green-200 rounded-xl p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-xs">
                            {getInitials(nomPatient)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {nomPatient}
                          </p>
                          <p className="text-xs text-gray-400">
                            {h.date_sortie ? formatDate(h.date_sortie) : "—"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-green-700">
                        {formatCurrency(h.facture?.montant_patient ?? 0)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialog admission */}
      <AdmissionDialog
        open={dialogAdmission}
        onOpenChange={setDialogAdmission}
        medecins={medecins}
        patients={patients}
        chambres={chambres}
        hospitalId={hospitalId}
        utilisateurId={utilisateurId}
        utilisateurNom={utilisateurNom}
      />
    </div>
  );
}