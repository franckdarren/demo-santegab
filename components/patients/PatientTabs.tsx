// ============================================================
// PATIENT TABS — Dossier médical en onglets
// ============================================================

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Stethoscope,
  Pill,
  Receipt,
  FileText,
} from "lucide-react";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import {
  StatutConsultation,
  StatutFacture,
} from "@/app/generated/prisma/client";

const STATUT_CONSULTATION: Record<StatutConsultation, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente", color: "bg-orange-100 text-orange-700" },
  EN_COURS:   { label: "En cours",   color: "bg-blue-100 text-blue-700" },
  TERMINEE:   { label: "Terminée",   color: "bg-green-100 text-green-700" },
  ANNULEE:    { label: "Annulée",    color: "bg-red-100 text-red-700" },
};

const STATUT_FACTURE: Record<StatutFacture, { label: string; color: string }> = {
  EN_ATTENTE:          { label: "En attente",       color: "bg-orange-100 text-orange-700" },
  PARTIELLEMENT_PAYEE: { label: "Partiel",           color: "bg-yellow-100 text-yellow-700" },
  PAYEE:               { label: "Payée",             color: "bg-green-100 text-green-700" },
  ANNULEE:             { label: "Annulée",           color: "bg-red-100 text-red-700" },
};

interface PatientTabsProps {
  patient: {
    antecedents: string | null;
    allergies: string | null;
    consultations: Array<{
      id: string;
      date_consultation: Date;
      statut: StatutConsultation;
      motif: string | null;
      diagnostic: string | null;
      tension: string | null;
      poids_kg: number | null;
      temperature: number | null;
      medecin: { nom: string; prenom: string };
      prescriptions: Array<{
        id: string;
        medicament: string;
        dosage: string | null;
        frequence: string | null;
        duree: string | null;
      }>;
    }>;
    factures: Array<{
      id: string;
      numero_facture: string;
      statut: StatutFacture;
      montant_total: number;
      montant_assurance: number;
      montant_patient: number;
      created_at: Date;
      lignes: Array<{
        id: string;
        description: string;
        quantite: number;
        prix_unitaire: number;
        montant_total: number;
      }>;
    }>;
  };
}

export function PatientTabs({ patient }: PatientTabsProps) {
  return (
    <Tabs defaultValue="consultations">
      <TabsList className="bg-white border border-gray-200 h-10">
        <TabsTrigger value="consultations" className="text-xs sm:text-sm">
          <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
          Consultations ({patient.consultations.length})
        </TabsTrigger>
        <TabsTrigger value="prescriptions" className="text-xs sm:text-sm">
          <Pill className="h-3.5 w-3.5 mr-1.5" />
          Prescriptions
        </TabsTrigger>
        <TabsTrigger value="factures" className="text-xs sm:text-sm">
          <Receipt className="h-3.5 w-3.5 mr-1.5" />
          Factures ({patient.factures.length})
        </TabsTrigger>
        <TabsTrigger value="antecedents" className="text-xs sm:text-sm">
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          Antécédents
        </TabsTrigger>
      </TabsList>

      {/* -------------------------------------------------- */}
      {/* ONGLET CONSULTATIONS                               */}
      {/* -------------------------------------------------- */}
      <TabsContent value="consultations" className="mt-4 space-y-3">
        {patient.consultations.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-gray-400 text-sm">Aucune consultation enregistrée</p>
            </CardContent>
          </Card>
        ) : (
          patient.consultations.map((c) => {
            const statut = STATUT_CONSULTATION[c.statut];
            return (
              <Card key={c.id} className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3 pt-4 px-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {c.motif ?? "Consultation générale"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Dr. {c.medecin.nom} · {formatDate(c.date_consultation)} à {formatTime(c.date_consultation)}
                      </p>
                    </div>
                    <Badge className={`text-xs border-0 ${statut.color}`}>
                      {statut.label}
                    </Badge>
                  </div>
                </CardHeader>
                {(c.diagnostic || c.tension || c.poids_kg) && (
                  <CardContent className="px-5 pb-4 space-y-3">
                    {/* Constantes vitales */}
                    {(c.tension || c.poids_kg || c.temperature) && (
                      <div className="flex gap-4 flex-wrap">
                        {c.tension && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Tension</p>
                            <p className="text-sm font-semibold text-gray-800">{c.tension}</p>
                          </div>
                        )}
                        {c.poids_kg && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Poids</p>
                            <p className="text-sm font-semibold text-gray-800">{c.poids_kg} kg</p>
                          </div>
                        )}
                        {c.temperature && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-400">Température</p>
                            <p className="text-sm font-semibold text-gray-800">{c.temperature}°C</p>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Diagnostic */}
                    {c.diagnostic && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Diagnostic
                        </p>
                        <p className="text-sm text-gray-700">{c.diagnostic}</p>
                      </div>
                    )}
                    {/* Prescriptions de cette consultation */}
                    {c.prescriptions.length > 0 && (
                      <div>
                        <Separator className="my-2" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Prescriptions ({c.prescriptions.length})
                        </p>
                        <div className="space-y-1.5">
                          {c.prescriptions.map((p) => (
                            <div key={p.id} className="flex items-start gap-2">
                              <Pill className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-gray-800">
                                  {p.medicament}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {[p.dosage, p.frequence, p.duree]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </TabsContent>

      {/* -------------------------------------------------- */}
      {/* ONGLET PRESCRIPTIONS (toutes consultations)        */}
      {/* -------------------------------------------------- */}
      <TabsContent value="prescriptions" className="mt-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-0">
            {patient.consultations.every((c) => c.prescriptions.length === 0) ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-400 text-sm">Aucune prescription</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {patient.consultations
                  .filter((c) => c.prescriptions.length > 0)
                  .map((c) =>
                    c.prescriptions.map((p) => (
                      <div key={p.id} className="flex items-start gap-4 px-5 py-3.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Pill className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {p.medicament}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {[p.dosage, p.frequence, p.duree]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 shrink-0">
                          {formatDate(c.date_consultation)}
                        </p>
                      </div>
                    ))
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* -------------------------------------------------- */}
      {/* ONGLET FACTURES                                    */}
      {/* -------------------------------------------------- */}
      <TabsContent value="factures" className="mt-4 space-y-3">
        {patient.factures.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-gray-400 text-sm">Aucune facture</p>
            </CardContent>
          </Card>
        ) : (
          patient.factures.map((f) => {
            const statut = STATUT_FACTURE[f.statut];
            return (
              <Card key={f.id} className="border border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {f.numero_facture}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(f.created_at)}
                      </p>
                    </div>
                    <Badge className={`text-xs border-0 ${statut.color}`}>
                      {statut.label}
                    </Badge>
                  </div>
                  {/* Lignes de facture */}
                  <div className="space-y-1.5 mb-3">
                    {f.lignes.map((l) => (
                      <div key={l.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{l.description}</span>
                        <span className="font-medium text-gray-800">
                          {formatCurrency(l.montant_total)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  {/* Totaux */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Part assurance</span>
                      <span className="text-green-600">
                        - {formatCurrency(f.montant_assurance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-900">
                      <span>Reste à payer</span>
                      <span>{formatCurrency(f.montant_patient)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </TabsContent>

      {/* -------------------------------------------------- */}
      {/* ONGLET ANTÉCÉDENTS                                 */}
      {/* -------------------------------------------------- */}
      <TabsContent value="antecedents" className="mt-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">
              Antécédents médicaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient.allergies && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                  ⚠️ Allergies
                </p>
                <p className="text-sm text-orange-700">{patient.allergies}</p>
              </div>
            )}
            {patient.antecedents ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Antécédents
                </p>
                <p className="text-sm text-gray-700">{patient.antecedents}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                Aucun antécédent renseigné
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

    </Tabs>
  );
}