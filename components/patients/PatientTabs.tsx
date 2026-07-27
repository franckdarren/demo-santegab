// ============================================================
// PATIENT TABS — Dossier médical en onglets
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Stethoscope,
  Pill,
  Receipt,
  FileText,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils";
import { MASQUAGE_KIMBA_ACTIF } from "@/lib/kimba-scope";
import {
  StatutConsultation,
  StatutFacture,
  TypeAntecedent,
  TypeActe,
} from "@/app/generated/prisma/client";
import {
  AntecedentDialog,
  TYPE_ANTECEDENT_LABELS,
} from "./AntecedentDialog";
import { supprimerAntecedent } from "@/app/dashboard/patients/actions";

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

// Nombre de colonnes de la barre d'onglets sur mobile.
// Tailwind ne lit que des classes littérales : on choisit entre deux
// chaînes complètes plutôt que de construire `grid-cols-${n}`.
const GRILLE_ONGLETS = MASQUAGE_KIMBA_ACTIF ? "grid-cols-3" : "grid-cols-4";

// Classes communes aux onglets.
// Mobile  : icône au-dessus du libellé, hauteur libre, texte pouvant
//           passer sur deux lignes (whitespace-normal annule le
//           whitespace-nowrap du composant Shadcn).
// sm et + : retour exact à la disposition en ligne d'origine.
// L'état actif passe en bleu : sur fond blanc, le `shadow-sm` par
// défaut de Shadcn ne se voit pas sur un écran de téléphone.
// Le préfixe doit être data-[state=active] — c'est ce que Radix rend.
const ONGLET_CLASSES = [
  "flex-col gap-1 h-auto py-2 px-1 text-[11px] leading-tight whitespace-normal",
  "data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700",
  "sm:flex-row sm:gap-1.5 sm:h-[calc(100%-1px)] sm:py-0.5 sm:px-1.5",
  "sm:text-sm sm:whitespace-nowrap",
].join(" ");

// Couleur par type d'antécédent
const TYPE_ANTECEDENT_COULEUR: Record<TypeAntecedent, string> = {
  PATHOLOGIE:           "bg-red-100 text-red-700",
  HOSPITALISATION:      "bg-blue-100 text-blue-700",
  CHIRURGIE:            "bg-purple-100 text-purple-700",
  ALLERGIE:             "bg-orange-100 text-orange-700",
  TRAITEMENT_CHRONIQUE: "bg-teal-100 text-teal-700",
};

interface AntecedentStructure {
  id: string;
  // Établissement qui a saisi l'antécédent — conditionne le droit
  // de le modifier, pas celui de le lire
  hospital_id: string;
  type: TypeAntecedent;
  libelle: string;
  date_debut: Date | null;
  date_fin: Date | null;
  est_actif: boolean;
  notes: string | null;
}

interface PatientTabsProps {
  // Contexte nécessaire à la saisie des antécédents (CDC §5.6)
  hospitalId: string;
  patientId: string;
  utilisateurId: string;
  utilisateurNom: string;
  peutModifier: boolean;
  peutSupprimer: boolean;
  patient: {
    antecedents: string | null;
    allergies: string | null;
    antecedents_structures: AntecedentStructure[];
    consultations: Array<{
      id: string;
      date_consultation: Date;
      statut: StatutConsultation;
      type_acte: TypeActe;
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

// ============================================================
// SOUS-COMPOSANT — Carte d'un antécédent
//
// Déclaré EN DEHORS du composant parent (règle du projet) :
// sinon React le recréerait à chaque render.
// ============================================================
interface CarteAntecedentProps {
  antecedent: AntecedentStructure;
  // false = antécédent saisi par un autre établissement : lecture seule
  estProprietaire: boolean;
  peutModifier: boolean;
  peutSupprimer: boolean;
  enCours: boolean;
  onModifier: (a: AntecedentStructure) => void;
  onSupprimer: (id: string) => void;
}

function CarteAntecedent({
  antecedent,
  estProprietaire,
  peutModifier,
  peutSupprimer,
  enCours,
  onModifier,
  onSupprimer,
}: CarteAntecedentProps) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge
                className={`text-xs border-0 ${TYPE_ANTECEDENT_COULEUR[antecedent.type]}`}
              >
                {TYPE_ANTECEDENT_LABELS[antecedent.type]}
              </Badge>
              {antecedent.est_actif ? (
                <Badge className="text-xs border-0 bg-green-100 text-green-700">
                  Actif
                </Badge>
              ) : (
                <Badge className="text-xs border-0 bg-gray-100 text-gray-500">
                  Terminé
                </Badge>
              )}
            </div>

            <p className="text-sm font-semibold text-gray-900 wrap-break-word">
              {antecedent.libelle}
            </p>

            {(antecedent.date_debut || antecedent.date_fin) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {antecedent.date_debut ? formatDate(antecedent.date_debut) : "?"}
                {" → "}
                {antecedent.date_fin ? formatDate(antecedent.date_fin) : "en cours"}
              </p>
            )}

            {antecedent.notes && (
              <p className="text-sm text-gray-600 mt-2 wrap-break-word">
                {antecedent.notes}
              </p>
            )}
          </div>

          {/* Un antécédent saisi ailleurs reste visible mais non modifiable */}
          {estProprietaire ? (
            <div className="flex gap-1 shrink-0">
              {peutModifier && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={enCours}
                  onClick={() => onModifier(antecedent)}
                  aria-label="Modifier l'antécédent"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {peutSupprimer && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={enCours}
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onSupprimer(antecedent.id)}
                  aria-label="Supprimer l'antécédent"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 shrink-0 text-right max-w-24">
              Saisi par un autre établissement
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PatientTabs({
  hospitalId,
  patientId,
  utilisateurId,
  utilisateurNom,
  peutModifier,
  peutSupprimer,
  patient,
}: PatientTabsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // null = dialog fermé ; "nouveau" = création ; sinon = antécédent modifié
  const [antecedentEdite, setAntecedentEdite] =
    useState<AntecedentStructure | "nouveau" | null>(null);

  // Traitements chroniques actifs = « traitements en cours » (CDC §5.1)
  const traitementsEnCours = patient.antecedents_structures.filter(
    (a) => a.type === "TRAITEMENT_CHRONIQUE" && a.est_actif
  );

  function handleSupprimer(id: string) {
    if (!window.confirm("Supprimer définitivement cet antécédent ?")) return;

    startTransition(async () => {
      try {
        await supprimerAntecedent(id, hospitalId, utilisateurId, utilisateurNom);
        router.refresh();
      } catch (error) {
        console.error(error);
      }
    });
  }

  return (
    <Tabs defaultValue="consultations">
      {/* Barre d'onglets : grille pleine largeur sur mobile (libellé   */}
      {/* sous l'icône), disposition en ligne à partir de sm.           */}
      {/* Le défilement horizontal a été écarté : sur un vrai téléphone */}
      {/* on ne devinait pas les onglets hors écran.                    */}
      {/* La hauteur DOIT reprendre le préfixe complet du composant, sinon */}
      {/* le group-data-[orientation=horizontal]/tabs:h-8 de Shadcn gagne  */}
      {/* en spécificité (son [data-orientation] compte comme un sélecteur */}
      {/* d'attribut). Avec le même préfixe, tailwind-merge le supprime.   */}
      <TabsList
        className={`bg-white border border-gray-200 w-full grid ${GRILLE_ONGLETS} gap-1 p-1
                    group-data-[orientation=horizontal]/tabs:h-auto
                    sm:flex sm:w-fit sm:gap-0
                    sm:group-data-[orientation=horizontal]/tabs:h-10`}
      >
        <TabsTrigger value="consultations" className={ONGLET_CLASSES}>
          <Stethoscope />
          <span>Consultations ({patient.consultations.length})</span>
        </TabsTrigger>
        <TabsTrigger value="prescriptions" className={ONGLET_CLASSES}>
          <Pill />
          <span>Prescriptions</span>
        </TabsTrigger>
        {/* Onglet Factures — hors périmètre du cahier des charges KIMBA */}
        {!MASQUAGE_KIMBA_ACTIF && (
          <TabsTrigger value="factures" className={ONGLET_CLASSES}>
            <Receipt />
            <span>Factures ({patient.factures.length})</span>
          </TabsTrigger>
        )}
        <TabsTrigger value="antecedents" className={ONGLET_CLASSES}>
          <FileText />
          <span>Antécédents</span>
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
                <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 wrap-break-word">
                        {c.motif ?? "Consultation générale"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Dr. {c.medecin.nom} · {formatDate(c.date_consultation)} à {formatTime(c.date_consultation)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Nature de l'acte — affichée seulement pour les soins, */}
                      {/* la consultation étant le cas courant (CDC §5.5)       */}
                      {c.type_acte === "SOIN" && (
                        <Badge className="text-xs border-0 bg-teal-100 text-teal-700">
                          Soin
                        </Badge>
                      )}
                      <Badge className={`text-xs border-0 ${statut.color}`}>
                        {statut.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {(c.diagnostic || c.tension || c.poids_kg) && (
                  <CardContent className="px-4 sm:px-5 pb-4 space-y-3">
                    {/* Constantes vitales */}
                    {(c.tension || c.poids_kg || c.temperature) && (
                      <div className="flex gap-2 sm:gap-4 flex-wrap">
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
                              <div className="min-w-0 wrap-break-word">
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
                      <div key={p.id} className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Pill className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 wrap-break-word">
                            {p.medicament}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 wrap-break-word">
                            {[p.dosage, p.frequence, p.duree]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {/* Sur mobile la date passe sous le libellé : */}
                          {/* à droite, elle écrasait le nom du médicament */}
                          <p className="text-xs text-gray-400 mt-1 sm:hidden">
                            {formatDate(c.date_consultation)}
                          </p>
                        </div>
                        <p className="hidden sm:block text-xs text-gray-400 shrink-0">
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
      {/* ONGLET FACTURES — masqué (hors périmètre KIMBA)     */}
      {/* -------------------------------------------------- */}
      {!MASQUAGE_KIMBA_ACTIF && (
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
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 wrap-break-word">
                        {f.numero_facture}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(f.created_at)}
                      </p>
                    </div>
                    <Badge className={`text-xs border-0 shrink-0 ${statut.color}`}>
                      {statut.label}
                    </Badge>
                  </div>
                  {/* Lignes de facture */}
                  <div className="space-y-1.5 mb-3">
                    {f.lignes.map((l) => (
                      <div key={l.id} className="flex justify-between gap-3 text-sm">
                        <span className="text-gray-600 min-w-0 wrap-break-word">
                          {l.description}
                        </span>
                        <span className="font-medium text-gray-800 shrink-0 whitespace-nowrap">
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
      )}

      {/* -------------------------------------------------- */}
      {/* ONGLET ANTÉCÉDENTS — structurés (CDC §5.6)         */}
      {/* -------------------------------------------------- */}
      <TabsContent value="antecedents" className="mt-4 space-y-4">

        {/* Allergies déclarées sur la fiche patient */}
        {patient.allergies && (
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
              ⚠️ Allergies
            </p>
            <p className="text-sm text-orange-700">{patient.allergies}</p>
          </div>
        )}

        {/* Traitements en cours mis en avant (CDC §5.1) */}
        {traitementsEnCours.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
              💊 Traitements en cours
            </p>
            <ul className="space-y-1">
              {traitementsEnCours.map((a) => (
                <li key={a.id} className="text-sm text-blue-800">
                  {a.libelle}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* En-tête + bouton d'ajout */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-800 min-w-0">
            Antécédents médicaux ({patient.antecedents_structures.length})
          </p>
          {peutModifier && (
            <Button size="sm" className="shrink-0" onClick={() => setAntecedentEdite("nouveau")}>
              <Plus className="h-4 w-4 mr-1.5" />
              Ajouter
            </Button>
          )}
        </div>

        {/* Liste structurée */}
        {patient.antecedents_structures.length === 0 ? (
          <Card className="border border-gray-200">
            <CardContent className="flex items-center justify-center py-10">
              <p className="text-gray-400 text-sm">
                Aucun antécédent structuré enregistré
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {patient.antecedents_structures.map((a) => (
              <CarteAntecedent
                key={a.id}
                antecedent={a}
                estProprietaire={a.hospital_id === hospitalId}
                peutModifier={peutModifier}
                peutSupprimer={peutSupprimer}
                enCours={isPending}
                onModifier={setAntecedentEdite}
                onSupprimer={handleSupprimer}
              />
            ))}
          </div>
        )}

        {/* Repli — ancien champ texte libre, conservé tant qu'il */}
        {/* n'a pas été repris dans la table structurée           */}
        {patient.antecedents && (
          <Card className="border border-gray-200 border-dashed">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-600">
                Saisie libre (à reprendre)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{patient.antecedents}</p>
              <p className="text-xs text-gray-400 mt-2">
                Ancien format. Ressaisissez ces informations ci-dessus pour
                les structurer.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Dialog de saisie / modification */}
      {/* La clé force le remontage : le formulaire se pré-remplit */}
      {/* sans useEffect de synchronisation.                       */}
      {peutModifier && antecedentEdite && (
        <AntecedentDialog
          key={antecedentEdite === "nouveau" ? "nouveau" : antecedentEdite.id}
          open={true}
          onOpenChange={(ouvert) => {
            if (!ouvert) setAntecedentEdite(null);
          }}
          hospitalId={hospitalId}
          patientId={patientId}
          utilisateurId={utilisateurId}
          utilisateurNom={utilisateurNom}
          antecedent={
            antecedentEdite === "nouveau" ? undefined : antecedentEdite
          }
        />
      )}

    </Tabs>
  );
}