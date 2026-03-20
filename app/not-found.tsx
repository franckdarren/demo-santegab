// ============================================================
// PAGE 404 — Page introuvable
// Affichée automatiquement par Next.js sur les routes inconnues
// ============================================================

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">

        {/* Icône */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center">
            <FileQuestion className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        {/* Texte */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">404</h1>
          <p className="text-lg font-semibold text-gray-700">
            Page introuvable
          </p>
          <p className="text-gray-500 text-sm">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button asChild className="bg-blue-700 hover:bg-blue-800 text-white">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour au dashboard
            </Link>
          </Button>
        </div>

        {/* Branding */}
        <p className="text-xs text-gray-400">SANTÉGAB · Système d'Information Hospitalier</p>
      </div>
    </div>
  );
}