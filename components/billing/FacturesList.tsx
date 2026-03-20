// ============================================================
// FACTURES LIST — Tableau avec filtres et actions
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Loader2, Receipt } from "lucide-react";
import { formatDate, formatCurrency, getInitials, cn } from "@/lib/utils";
import { StatutFacture } from "@/app/generated/prisma/client";
import { NouvelleFactureDialog } from "./NouvelleFactureDialog";
import { FactureDetailDialog } from "./FactureDetailDialog";

const STATUT_CONFIG: Record<StatutFacture, { label: string; color: string }> = {
  EN_ATTENTE:          { label: "En attente",  color: "bg-orange-100 text-orange-700" },
  PARTIELLEMENT_PAYEE: { label: "Partiel",      color: "bg-yellow-100 text-yellow-700" },
  PAYEE:               { label: "Payée",        color: "bg-green-100 text-green-700" },
  ANNULEE:             { label: "Annulée",      color: "bg-red-100 text-red-700" },
};

const FILTRES = [
  { label: "Toutes",     value: "" },
  { label: "En attente", value: "EN_ATTENTE" },
  { label: "Payées",     value: "PAYEE" },
  { label: "Annulées",   value: "ANNULEE" },
];

interface Facture {
  id: string;
  numero_facture: string;
  statut: StatutFacture;
  montant_total: number;
  montant_assurance: number;
  montant_patient: number;
  mode_paiement: string | null;
  date_paiement: Date | null;
  notes: string | null;
  created_at: Date;
  patient: { id: string; nom: string; prenom: string };
  lignes: Array<{
    id: string;
    description: string;
    quantite: number;
    prix_unitaire: number;
    montant_total: number;
  }>;
  consultation: {
    medecin: { nom: string; prenom: string };
  } | null;
}

interface PatientHospital {
  patient: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
  };
  assurance_nom: string | null;
  taux_couverture: number | null;
}

interface Hospital {
  nom: string;
  adresse?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
}

interface FacturesListProps {
  factures: Facture[];
  patients: PatientHospital[];
  hospitalId: string;
  hospital: Hospital;
  searchQuery: string;
}

export function FacturesList({
  factures,
  patients,
  hospitalId,
  hospital,
  searchQuery,
}: FacturesListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchQuery);
  const [isPending, startTransition] = useTransition();
  const [filtreStatut, setFiltreStatut] = useState("");
  const [dialogCreer, setDialogCreer] = useState(false);
  const [factureSelectionnee, setFactureSelectionnee] =
    useState<Facture | null>(null);

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const facturesFiltrees = factures.filter((f) =>
    filtreStatut ? f.statut === filtreStatut : true
  );

  return (
    <div className="space-y-4">

      {/* Barre de recherche + bouton nouvelle facture */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par patient ou numéro de facture..."
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
          <span className="hidden sm:inline">Nouvelle facture</span>
        </Button>
      </div>

      {/* Filtres rapides */}
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
                ({factures.filter((fac) => fac.statut === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste des factures */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {facturesFiltrees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Receipt className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucune facture trouvée</p>
              <p className="text-gray-400 text-sm mt-1">
                {search
                  ? `Aucun résultat pour "${search}"`
                  : "Aucune facture enregistrée"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {facturesFiltrees.map((facture) => {
                const statut = STATUT_CONFIG[facture.statut];
                const nomPatient = `${facture.patient.prenom} ${facture.patient.nom}`;

                return (
                  <button
                    key={facture.id}
                    type="button"
                    onClick={() => setFactureSelectionnee(facture)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left group"
                  >
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm">
                        {getInitials(nomPatient)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {nomPatient}
                        </p>
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          {facture.numero_facture}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {facture.lignes.length} acte
                        {facture.lignes.length > 1 ? "s" : ""}
                        {facture.consultation &&
                          ` · Dr. ${facture.consultation.medecin.nom}`}
                      </p>
                    </div>

                    {/* Montants */}
                    <div className="hidden sm:block text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(facture.montant_patient)}
                      </p>
                      {facture.montant_assurance > 0 && (
                        <p className="text-xs text-green-600">
                          -{formatCurrency(facture.montant_assurance)} assurance
                        </p>
                      )}
                    </div>

                    {/* Date */}
                    <div className="hidden md:block text-right shrink-0">
                      <p className="text-xs text-gray-500">
                        {formatDate(facture.created_at)}
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

      {/* Dialog nouvelle facture */}
      <NouvelleFactureDialog
        open={dialogCreer}
        onOpenChange={setDialogCreer}
        hospitalId={hospitalId}
        patients={patients}
      />

      {/* Dialog détail facture */}
      {factureSelectionnee && (
        <FactureDetailDialog
          facture={factureSelectionnee}
          hospitalId={hospitalId}
          hospital={hospital}
          open={!!factureSelectionnee}
          onOpenChange={(open) => {
            if (!open) setFactureSelectionnee(null);
          }}
        />
      )}
    </div>
  );
}