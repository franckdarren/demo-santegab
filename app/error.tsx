// ============================================================
// PAGE ERREUR GLOBALE — Capturée par Next.js Error Boundary
// Affichée quand une erreur non gérée survient côté client
// ============================================================

"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log l'erreur en production pour le débogage
    console.error("Erreur application :", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">

        {/* Icône */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        {/* Texte */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Une erreur est survenue
          </h1>
          <p className="text-gray-500 text-sm">
            Une erreur inattendue s'est produite. Nos équipes en ont été notifiées.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 font-mono">
              Référence : {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            className="border-gray-200"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Réessayer
          </Button>
          <Button asChild className="bg-blue-700 hover:bg-blue-800 text-white">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour au dashboard
            </Link>
          </Button>
        </div>

        <p className="text-xs text-gray-400">
          SANTÉGAB · Système d'Information Hospitalier
        </p>
      </div>
    </div>
  );
}