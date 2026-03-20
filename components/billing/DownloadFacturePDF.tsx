"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface FactureData {
  id: string;
  numero_facture: string;
  statut: string;
  montant_total: number;
  montant_assurance: number;
  montant_patient: number;
  mode_paiement: string | null;
  date_paiement: Date | null;
  notes: string | null;
  created_at: Date;
  patient: { nom: string; prenom: string };
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

interface HospitalData {
  nom: string;
  adresse?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
}

interface DownloadFacturePDFProps {
  facture: FactureData;
  hospital: HospitalData;
}

export function DownloadFacturePDF({
  facture,
  hospital,
}: DownloadFacturePDFProps) {
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(false);

  async function handleDownload() {
    setLoading(true);
    setErreur(false);

    try {
      // ============================================================
      // Import dynamique — @react-pdf/renderer utilise des APIs
      // navigateur (canvas, blob) incompatibles avec le SSR Next.js.
      // L'import dynamique garantit que ce code ne s'exécute
      // que côté client, après l'hydratation.
      // ============================================================
      const { pdf } = await import("@react-pdf/renderer");
      const { FacturePDF } = await import("./FacturePDF");
      const { default: React } = await import("react");

      // ============================================================
      // Le cast "as any" est nécessaire car @react-pdf/renderer
      // définit ses propres types React internes (DocumentProps)
      // incompatibles avec les types React DOM standard.
      // C'est la solution officielle recommandée par la librairie.
      // ============================================================
      const element = React.createElement(
        FacturePDF,
        { facture, hospital }
      ) as any;

      // Génère le blob PDF en mémoire
      const blob = await pdf(element).toBlob();

      // Crée un lien temporaire et déclenche le téléchargement
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${facture.numero_facture}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Libère la mémoire immédiatement après le téléchargement
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erreur génération PDF :", error);
      setErreur(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleDownload}
        disabled={loading}
        className="border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-300"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            Génération...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-1.5" />
            Télécharger PDF
          </>
        )}
      </Button>

      {/* Message d'erreur visible sous le bouton */}
      {erreur && (
        <p className="text-xs text-red-500">
          Erreur lors de la génération. Réessayez.
        </p>
      )}
    </div>
  );
}