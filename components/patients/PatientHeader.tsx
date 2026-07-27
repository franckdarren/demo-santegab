"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Phone, Calendar, Droplets, Shield,
  ArrowLeft, Stethoscope,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { formatDate, getInitials } from "@/lib/utils";
import { Sexe } from "@/app/generated/prisma/client";
import { ModifierPatientDialog } from "./ModifierPatientDialog";
import { SupprimerPatientDialog } from "./SupprimerPatientDialog";
import { NouvelleConsultationDepuisPatient } from "./NouvelleConsultationDepuisPatient";
import { QrCodeButton } from "./QrCodeButton";

interface PatientHeaderProps {
  patient: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
    date_naissance: Date | null;
    sexe: Sexe | null;
    telephone: string | null;
    groupe_sanguin: string | null;
    allergies: string | null;
    antecedents: string | null;
    adresse: string | null;
    email: string | null;
    assurance_nom: string | null;
    assurance_numero: string | null;
    taux_couverture: number | null;
    medecin_traitant: string | null;
  };
  hospitalId: string;
  medecinConnecteId: string;
  medecinConnecteNom: string;
  utilisateurId: string;  // ← pour audit modifier/supprimer
  utilisateurNom: string; // ← pour audit modifier/supprimer
  medecins: Array<{ id: string; nom: string; prenom: string }>;
  peutModifier: boolean;
  peutSupprimer: boolean;
  peutCreerConsultation: boolean;
}

// ============================================================
// SOUS-COMPOSANT — Une ligne d'information secondaire
//
// Déclaré EN DEHORS du composant parent (règle du projet).
//
// Mobile  : libellé à gauche, valeur alignée à droite — beaucoup
//           plus lisible qu'un empilement dans une colonne étroite.
// sm et + : valeur sous le libellé, en colonnes.
// ============================================================
interface LigneDetailProps {
  icone: LucideIcon;
  libelle: string;
  valeur: string;
}

function LigneDetail({ icone: Icone, libelle, valeur }: LigneDetailProps) {
  return (
    <div className="flex items-start gap-2 py-2.5 sm:py-0">
      <Icone className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1 flex items-start justify-between gap-3 sm:block">
        <p className="text-xs text-gray-400 shrink-0">{libelle}</p>
        <p className="min-w-0 text-sm font-medium text-gray-700 text-right sm:text-left wrap-break-word">
          {valeur}
        </p>
      </div>
    </div>
  );
}

export function PatientHeader({
  patient,
  hospitalId,
  medecinConnecteId,
  medecinConnecteNom,
  utilisateurId,
  utilisateurNom,
  medecins,
  peutModifier,
  peutSupprimer,
  peutCreerConsultation,
}: PatientHeaderProps) {
  const nomComplet = `${patient.prenom} ${patient.nom}`;
  const [dialogConsultation, setDialogConsultation] = useState(false);

  const age = patient.date_naissance
    ? Math.floor(
        (new Date().getTime() - new Date(patient.date_naissance).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : null;

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/patients"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux patients
      </Link>

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="space-y-4 sm:px-5">

          {/* ------------------------------------------------ */}
          {/* IDENTITÉ                                          */}
          {/* ------------------------------------------------ */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0">
              <AvatarFallback className="bg-blue-700 text-white text-base sm:text-lg font-bold">
                {getInitials(nomComplet)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 wrap-break-word">
                  {nomComplet}
                </h1>
                {patient.groupe_sanguin && (
                  <Badge className="bg-red-50 text-red-600 border-0 text-xs">
                    <Droplets className="h-3 w-3 mr-1" />
                    {patient.groupe_sanguin}
                  </Badge>
                )}
                {patient.allergies && (
                  <Badge className="bg-orange-50 text-orange-600 border-0 text-xs">
                    ⚠️ Allergies
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {patient.numero_dossier}
                {patient.sexe && ` · ${patient.sexe === "MASCULIN" ? "Homme" : "Femme"}`}
                {age && ` · ${age} ans`}
              </p>
            </div>
          </div>

          {/* ------------------------------------------------ */}
          {/* INFOS SECONDAIRES                                 */}
          {/* Mobile : liste séparée par des filets.            */}
          {/* sm : 2 colonnes — lg : 4 colonnes.                */}
          {/* ------------------------------------------------ */}
          <div className="grid grid-cols-1 divide-y divide-gray-100 border-t border-gray-100 pt-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 sm:divide-y-0 sm:pt-4">
            {patient.telephone && (
              <LigneDetail
                icone={Phone}
                libelle="Téléphone"
                valeur={patient.telephone}
              />
            )}
            {patient.date_naissance && (
              <LigneDetail
                icone={Calendar}
                libelle="Date de naissance"
                valeur={formatDate(patient.date_naissance)}
              />
            )}
            {patient.assurance_nom && (
              <LigneDetail
                icone={Shield}
                libelle="Assurance"
                valeur={`${patient.assurance_nom} · ${patient.taux_couverture}%`}
              />
            )}
            {patient.medecin_traitant && (
              <LigneDetail
                icone={Stethoscope}
                libelle="Médecin traitant"
                valeur={patient.medecin_traitant}
              />
            )}
          </div>

          {/* Allergies — détail complet */}
          {patient.allergies && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-xs font-semibold text-orange-700 mb-0.5">
                ⚠️ Allergies connues
              </p>
              <p className="text-sm text-orange-600 wrap-break-word">
                {patient.allergies}
              </p>
            </div>
          )}
        </CardContent>

        {/* ------------------------------------------------ */}
        {/* ACTIONS — barre en pied de carte                  */}
        {/*                                                   */}
        {/* Regroupées ici plutôt qu'au milieu de la carte :  */}
        {/* sur mobile elles coupaient l'identité de ses      */}
        {/* informations. CardFooter fournit déjà le filet et */}
        {/* le fond gris, et Card retire son padding bas dès  */}
        {/* qu'un footer est présent.                         */}
        {/*                                                   */}
        {/* items-stretch : en colonne, les boutons prennent  */}
        {/* toute la largeur sans avoir à leur passer w-full. */}
        {/* ------------------------------------------------ */}
        <CardFooter className="flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-5">

          {/* Action principale */}
          {peutCreerConsultation && (
            <Button
              type="button"
              onClick={() => setDialogConsultation(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm sm:w-auto"
            >
              <Stethoscope className="h-4 w-4 mr-1.5" />
              Nouvelle consultation
            </Button>
          )}

          {/* Actions secondaires — colonnes de largeur égale sur   */}
          {/* mobile quel que soit leur nombre (auto-cols-fr), donc */}
          {/* la rangée reste équilibrée si une permission manque.  */}
          <div className="grid grid-flow-col auto-cols-fr gap-2 sm:flex sm:gap-2">
            <QrCodeButton
              patientId={patient.id}
              hospitalId={hospitalId}
              utilisateurId={medecinConnecteId}
              utilisateurNom={medecinConnecteNom}
              nomPatient={nomComplet}
            />

            {peutModifier && (
              <ModifierPatientDialog
                patient={patient}
                hospitalId={hospitalId}
                utilisateurId={utilisateurId}
                utilisateurNom={utilisateurNom}
              />
            )}

            {peutSupprimer && (
              <SupprimerPatientDialog
                patientId={patient.id}
                nomPatient={nomComplet}
                hospitalId={hospitalId}
                utilisateurId={utilisateurId}
                utilisateurNom={utilisateurNom}
              />
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Dialog nouvelle consultation — avec audit */}
      <NouvelleConsultationDepuisPatient
        open={dialogConsultation}
        onOpenChange={setDialogConsultation}
        hospitalId={hospitalId}
        medecinConnecteId={medecinConnecteId}
        medecinConnecteNom={medecinConnecteNom}
        medecins={medecins}
        patient={{
          id:             patient.id,
          nom:            patient.nom,
          prenom:         patient.prenom,
          numero_dossier: patient.numero_dossier,
        }}
      />
    </div>
  );
}
