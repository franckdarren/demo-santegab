"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { getRapportData } from "@/app/dashboard/accounting/actions";

interface BoutonRapportProps {
  hospitalId: string;
  dateDebut: string;
  dateFin: string;
}

export function BoutonRapport({ hospitalId, dateDebut, dateFin }: BoutonRapportProps) {
  const [generation, setGeneration] = useState(false);

  async function genererPDF() {
    if (!dateDebut || !dateFin) return;
    setGeneration(true);

    try {
      // Données depuis le serveur
      const data = await getRapportData(hospitalId, dateDebut, dateFin);

      // Import dynamique pour éviter les problèmes SSR avec @react-pdf/renderer
      const [{ pdf }, { RapportPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/accounting/RapportPDF"),
      ]);

      const blob = await pdf(<RapportPDF data={data} />).toBlob();
      const url = URL.createObjectURL(blob);

      // Déclenchement du téléchargement
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-comptable_${dateDebut}_${dateFin}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur génération PDF :", error);
    } finally {
      setGeneration(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={genererPDF}
      disabled={generation}
      className="border-gray-200 text-gray-700 hover:bg-gray-50"
    >
      {generation ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4 mr-2" />
          Rapport PDF
        </>
      )}
    </Button>
  );
}
