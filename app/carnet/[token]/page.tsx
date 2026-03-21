// ============================================================
// PAGE PUBLIQUE — Carnet de santé via QR Code
//
// Cette page est accessible SANS connexion.
// Elle affiche les informations médicales essentielles
// d'un patient via un token temporaire sécurisé.
// ============================================================

import { getCarnetParToken } from "@/app/dashboard/patients/qr-actions";
import { CarnetPublic } from "@/components/carnet/CarnetPublic";
import { AlertTriangle } from "lucide-react";

interface CarnetPageProps {
  params: Promise<{ token: string }>;
}

export default async function CarnetPage({ params }: CarnetPageProps) {
  const { token } = await params;
  const result = await getCarnetParToken(token);

  if ("erreur" in result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Accès non autorisé
          </h1>
          <p className="text-gray-500 text-sm">{result.erreur}</p>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400">
              Pour obtenir un accès valide, demandez à votre médecin
              de générer un nouveau QR Code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CarnetPublic
      patient={result.patient}
      hospital={result.hospital}
      expireAt={result.expireAt}
    />
  );
}