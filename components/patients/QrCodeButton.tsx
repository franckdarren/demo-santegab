// ============================================================
// QR CODE BUTTON — Génère et affiche le QR Code du patient
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Loader2, Clock, ExternalLink } from "lucide-react";
import { genererQrCodePatient } from "@/app/dashboard/patients/qr-actions";
import { QRCodeSVG } from "qrcode.react";

interface QrCodeButtonProps {
  patientId: string;
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string; // ← ajouté pour l'audit
  nomPatient: string;
}

export function QrCodeButton({
  patientId,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  nomPatient,
}: QrCodeButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  function handleGenerer() {
    startTransition(async () => {
      try {
        const token = await genererQrCodePatient(
          patientId,
          hospitalId,
          utilisateurId,
          utilisateurNom  // ← transmis pour l'audit
        );
        const url = `${window.location.origin}/carnet/${token}`;
        setQrUrl(url);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function handleOuvrir() {
    setOpen(true);
    handleGenerer();
  }

  function handleFermer() {
    setOpen(false);
    setQrUrl(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOuvrir}
        className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
      >
        <QrCode className="h-3.5 w-3.5 mr-1.5" />
        QR Code
      </Button>

      <Dialog open={open} onOpenChange={handleFermer}>
        <DialogContent className="max-w-sm! w-full p-0 overflow-hidden gap-0 [&>button:first-of-type]:hidden">
          <DialogTitle className="sr-only">QR Code carnet de santé</DialogTitle>

          <div className="flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                Dossier médical
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {nomPatient}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {isPending ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <p className="text-sm text-gray-500">
                    Génération du QR Code...
                  </p>
                </div>
              ) : qrUrl ? (
                <>
                  {/* QR Code */}
                  <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-200">
                    <QRCodeSVG
                      value={qrUrl}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  {/* Info expiration */}
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <Clock className="h-4 w-4 text-orange-600 shrink-0" />
                    <p className="text-xs text-orange-700">
                      Ce QR Code expire dans <strong>24 heures</strong>.
                      Chaque scan est tracé pour la sécurité du patient.
                    </p>
                  </div>

                  {/* Lien direct */}
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg border border-blue-200 text-blue-700 text-sm hover:bg-blue-50 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ouvrir le carnet
                  </a>

                  {/* Regénérer */}
                  <button
                    type="button"
                    onClick={handleGenerer}
                    disabled={isPending}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
                  >
                    Regénérer un nouveau QR Code
                  </button>
                </>
              ) : null}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50">
              <Button
                type="button"
                variant="ghost"
                onClick={handleFermer}
                className="w-full text-gray-500"
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}