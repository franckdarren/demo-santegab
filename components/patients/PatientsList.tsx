"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, ChevronRight, Loader2 } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import { Sexe } from "@/app/generated/prisma/client";
import { NouveauPatientDialog } from "./NouveauPatientDialog";

interface Patient {
  patient: {
    id: string;
    nom: string;
    prenom: string;
    numero_dossier: string;
    date_naissance: Date | null;
    sexe: Sexe | null;
    telephone: string | null;
    groupe_sanguin: string | null;
  };
  assurance_nom: string | null;
  taux_couverture: number | null;
}

interface PatientsListProps {
  patients: Patient[];
  searchQuery: string;
  hospitalId: string;
  utilisateurId: string;  // ← ajouté
  utilisateurNom: string; // ← ajouté
}

export function PatientsList({
  patients,
  searchQuery,
  hospitalId,
  utilisateurId,  // ← ajouté
  utilisateurNom, // ← ajouté
}: PatientsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchQuery);
  const [isPending, startTransition] = useTransition();
  const [dialogOuvert, setDialogOuvert] = useState(false);

  function handleSearch(value: string) {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">

      {/* Barre de recherche + bouton */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, prénom, téléphone..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200"
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>
        <Button
          onClick={() => setDialogOuvert(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white shrink-0"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nouveau patient</span>
        </Button>
      </div>

      {/* Liste patients */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucun patient trouvé</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchQuery
                  ? `Aucun résultat pour "${searchQuery}"`
                  : "Aucun patient enregistré"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {patients.map(({ patient, assurance_nom, taux_couverture }) => {
                const nomComplet = `${patient.prenom} ${patient.nom}`;
                return (
                  <Link
                    key={patient.id}
                    href={`/dashboard/patients/${patient.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                        {getInitials(nomComplet)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {nomComplet}
                        </p>
                        {patient.groupe_sanguin && (
                          <Badge className="text-[10px] bg-red-50 text-red-600 border-0 py-0 px-1.5">
                            {patient.groupe_sanguin}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {patient.numero_dossier}
                        </span>
                        {patient.telephone && (
                          <span className="text-xs text-gray-400 hidden sm:inline">
                            {patient.telephone}
                          </span>
                        )}
                        {patient.date_naissance && (
                          <span className="text-xs text-gray-400 hidden md:inline">
                            Né(e) le {formatDate(patient.date_naissance)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:block text-right shrink-0">
                      {assurance_nom ? (
                        <div>
                          <Badge className="text-xs bg-blue-50 text-blue-700 border-0">
                            {assurance_nom}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {taux_couverture}% couvert
                          </p>
                        </div>
                      ) : (
                        <Badge className="text-xs bg-gray-100 text-gray-500 border-0">
                          Sans assurance
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog création patient */}
      <NouveauPatientDialog
        hospitalId={hospitalId}
        utilisateurId={utilisateurId}
        utilisateurNom={utilisateurNom}
        open={dialogOuvert}
        onOpenChange={setDialogOuvert}
      />
    </div>
  );
}