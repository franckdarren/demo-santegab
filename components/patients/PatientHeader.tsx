// ============================================================
// PATIENT HEADER — Avec boutons Modifier et Supprimer
// ============================================================

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Phone, Calendar, Droplets, Shield,
  ArrowLeft, Stethoscope, Pencil, Trash2,
} from "lucide-react";
import Link from "next/link";
import { formatDate, getInitials } from "@/lib/utils";
import { Sexe } from "@/app/generated/prisma/client";
import { ModifierPatientDialog } from "./ModifierPatientDialog";
import { SupprimerPatientDialog } from "./SupprimerPatientDialog";

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
}

export function PatientHeader({ patient, hospitalId }: PatientHeaderProps) {
  const nomComplet = `${patient.prenom} ${patient.nom}`;

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
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">

            {/* Avatar + nom */}
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarFallback className="bg-blue-700 text-white text-lg font-bold">
                  {getInitials(nomComplet)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">
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

            {/* Actions */}
            <div className="flex gap-2 shrink-0 flex-wrap">
              <Button
                className="bg-blue-700 hover:bg-blue-800 text-white text-sm"
                disabled
              >
                <Stethoscope className="h-4 w-4 mr-1.5" />
                Nouvelle consultation
              </Button>

              {/* Boutons modifier et supprimer — composants client */}
              <ModifierPatientDialog patient={patient} hospitalId={hospitalId} />
              <SupprimerPatientDialog
                patientId={patient.id}
                nomPatient={nomComplet}
                hospitalId={hospitalId}
              />
            </div>
          </div>

          {/* Infos secondaires */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-gray-100">
            {patient.telephone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Téléphone</p>
                  <p className="text-sm font-medium text-gray-700">{patient.telephone}</p>
                </div>
              </div>
            )}
            {patient.date_naissance && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Date de naissance</p>
                  <p className="text-sm font-medium text-gray-700">
                    {formatDate(patient.date_naissance)}
                  </p>
                </div>
              </div>
            )}
            {patient.assurance_nom && (
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Assurance</p>
                  <p className="text-sm font-medium text-gray-700">
                    {patient.assurance_nom} · {patient.taux_couverture}%
                  </p>
                </div>
              </div>
            )}
            {patient.medecin_traitant && (
              <div className="flex items-center gap-2">
                <Stethoscope className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Médecin traitant</p>
                  <p className="text-sm font-medium text-gray-700">
                    {patient.medecin_traitant}
                  </p>
                </div>
              </div>
            )}
          </div>

          {patient.allergies && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-xs font-semibold text-orange-700 mb-0.5">
                ⚠️ Allergies connues
              </p>
              <p className="text-sm text-orange-600">{patient.allergies}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}