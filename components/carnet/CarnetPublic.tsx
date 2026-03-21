// ============================================================
// CARNET PUBLIC — Affichage du carnet de santé via QR Code
// ============================================================

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Heart, FlaskConical, Pill,
  Calendar, User, Clock, Shield,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface CarnetPublicProps {
  patient: {
    nom: string;
    prenom: string;
    date_naissance: Date | null;
    sexe: string | null;
    groupe_sanguin: string | null;
    allergies: string | null;
    antecedents: string | null;
    consultations: Array<{
      id: string;
      date_consultation: Date;
      motif: string | null;
      diagnostic: string | null;
      medecin: { nom: string; prenom: string };
      prescriptions: Array<{
        medicament: string;
        dosage: string | null;
        frequence: string | null;
        duree: string | null;
      }>;
    }>;
    examens_labo: Array<{
      id: string;
      type_examen: string;
      created_at: Date;
      resultats: string | null;
      medecin: { nom: string; prenom: string };
    }>;
  };
  hospital: {
    nom: string;
    ville: string | null;
    telephone: string | null;
  } | null;
  expireAt: Date;
}

const TYPE_EXAMEN_LABELS: Record<string, string> = {
  BILAN_SANGUIN:  "Bilan sanguin",
  BILAN_URINAIRE: "Bilan urinaire",
  BACTERIOLOGIE:  "Bactériologie",
  PARASITOLOGIE:  "Parasitologie",
  SEROLOGIE:      "Sérologie",
  BIOCHIMIE:      "Biochimie",
  HEMATOLOGIE:    "Hématologie",
  AUTRE:          "Autre",
};

export function CarnetPublic({
  patient,
  hospital,
  expireAt,
}: CarnetPublicProps) {
  const minutesRestantes = Math.max(
    0,
    Math.round((new Date(expireAt).getTime() - Date.now()) / 1000 / 60)
  );
  const heuresRestantes = Math.floor(minutesRestantes / 60);
  const nomComplet = `${patient.prenom} ${patient.nom}`;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-blue-200" />
            <span className="text-sm text-blue-200 font-medium">
              SANTÉGAB — Dossier médical
            </span>
          </div>
          <h1 className="text-xl font-bold">{nomComplet}</h1>
          {hospital && (
            <p className="text-blue-200 text-sm mt-0.5">
              {hospital.nom} · {hospital.ville}
            </p>
          )}
          {/* Expiration */}
          <div className="flex items-center gap-1.5 mt-3 bg-blue-600 rounded-lg px-3 py-1.5 w-fit">
            <Clock className="h-3.5 w-3.5 text-blue-200" />
            <span className="text-xs text-blue-100">
              Accès valide encore{" "}
              {heuresRestantes > 0
                ? `${heuresRestantes}h${minutesRestantes % 60}min`
                : `${minutesRestantes} min`}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Informations essentielles */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Informations médicales essentielles
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Date de naissance</p>
              <p className="text-sm font-semibold text-gray-800">
                {patient.date_naissance
                  ? formatDate(patient.date_naissance)
                  : "Non renseignée"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Sexe</p>
              <p className="text-sm font-semibold text-gray-800">
                {patient.sexe === "MASCULIN"
                  ? "Masculin"
                  : patient.sexe === "FEMININ"
                  ? "Féminin"
                  : "—"}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <p className="text-xs text-red-500 mb-1 font-semibold">
                Groupe sanguin
              </p>
              <p className="text-lg font-bold text-red-700">
                {patient.groupe_sanguin ?? "—"}
              </p>
            </div>
            <div className={cn(
              "rounded-lg p-3 border",
              patient.allergies
                ? "bg-orange-50 border-orange-100"
                : "bg-gray-50 border-gray-100"
            )}>
              <p className={cn(
                "text-xs mb-1 font-semibold",
                patient.allergies ? "text-orange-600" : "text-gray-400"
              )}>
                Allergies connues
              </p>
              <p className={cn(
                "text-sm font-medium",
                patient.allergies ? "text-orange-800" : "text-gray-400"
              )}>
                {patient.allergies ?? "Aucune allergie connue"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Antécédents */}
        {patient.antecedents && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Antécédents médicaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">
                {patient.antecedents}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dernières consultations */}
        {patient.consultations.length > 0 && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                Dernières consultations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {patient.consultations.map((c) => (
                  <div key={c.id} className="px-5 py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-500">
                        {formatDate(c.date_consultation)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Dr. {c.medecin.prenom} {c.medecin.nom}
                      </p>
                    </div>
                    {c.motif && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Motif : </span>
                        {c.motif}
                      </p>
                    )}
                    {c.diagnostic && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Diagnostic : </span>
                        {c.diagnostic}
                      </p>
                    )}
                    {/* Prescriptions */}
                    {c.prescriptions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {c.prescriptions.map((p, i) => (
                          <Badge
                            key={i}
                            className="text-[10px] bg-blue-50 text-blue-700 border-0 flex items-center gap-1"
                          >
                            <Pill className="h-2.5 w-2.5" />
                            {p.medicament}
                            {p.dosage && ` ${p.dosage}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Derniers examens labo */}
        {patient.examens_labo.length > 0 && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-cyan-600" />
                Examens biologiques récents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {patient.examens_labo.map((e) => (
                  <div key={e.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="text-[10px] bg-cyan-50 text-cyan-700 border-0">
                        {TYPE_EXAMEN_LABELS[e.type_examen] ?? e.type_examen}
                      </Badge>
                      <p className="text-xs text-gray-400">
                        {formatDate(e.created_at)}
                      </p>
                    </div>
                    {e.resultats && (
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono mt-2 bg-gray-50 p-2 rounded-lg">
                        {e.resultats}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer légal */}
        <div className="p-4 bg-gray-100 rounded-xl text-center space-y-1">
          <p className="text-xs text-gray-500 font-semibold">
            Document médical confidentiel
          </p>
          <p className="text-xs text-gray-400">
            Accès temporaire généré le{" "}
            {new Date().toLocaleDateString("fr-FR")} · Expire le{" "}
            {formatDate(expireAt)}
          </p>
          <p className="text-xs text-gray-400">
            Cet accès est tracé conformément à la réglementation
            sur la protection des données médicales.
          </p>
        </div>
      </div>
    </div>
  );
}