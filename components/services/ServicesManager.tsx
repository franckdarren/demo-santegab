// ============================================================
// SERVICES MANAGER — CRUD des services médicaux (Admin)
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Loader2, Check, AlertCircle,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  creerService,
  modifierService,
  supprimerService,
} from "@/app/dashboard/services/actions";

// Couleurs prédéfinies pour les services
const COULEURS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
  "#14b8a6", "#6366f1",
];

interface Service {
  id: string;
  nom: string;
  description: string | null;
  couleur: string;
  est_actif: boolean;
  _count: { consultations: number };
}

interface ServicesManagerProps {
  services: Service[];
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
}

// ============================================================
// Formulaire service (création + modification)
// ============================================================
interface ServiceFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hospitalId: string;
  utilisateurId: string;
  utilisateurNom: string;
  serviceAModifier?: Service | null;
}

function ServiceForm({
  open,
  onOpenChange,
  hospitalId,
  utilisateurId,
  utilisateurNom,
  serviceAModifier,
}: ServiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");
  const [nom, setNom] = useState(serviceAModifier?.nom ?? "");
  const [description, setDescription] = useState(serviceAModifier?.description ?? "");
  const [couleur, setCouleur] = useState(serviceAModifier?.couleur ?? "#3b82f6");
  const estModification = !!serviceAModifier;

  function fermer() {
    setSucces(false);
    setErreur("");
    setNom(serviceAModifier?.nom ?? "");
    setDescription(serviceAModifier?.description ?? "");
    setCouleur(serviceAModifier?.couleur ?? "#3b82f6");
    onOpenChange(false);
  }

  function handleSubmit() {
    if (!nom.trim()) {
      setErreur("Le nom du service est obligatoire.");
      return;
    }

    startTransition(async () => {
      try {
        if (estModification && serviceAModifier) {
          await modifierService(serviceAModifier.id, hospitalId, utilisateurId, utilisateurNom, {
            nom, description: description || undefined, couleur,
            est_actif: serviceAModifier.est_actif,
          });
        } else {
          await creerService(hospitalId, utilisateurId, utilisateurNom, {
            nom, description: description || undefined, couleur,
          });
        }
        setSucces(true);
        router.refresh();
        setTimeout(() => fermer(), 1200);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur inattendue";
        setErreur(msg.includes("Unique") ? "Un service avec ce nom existe déjà." : msg);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={fermer}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">
          {estModification ? "Modifier le service" : "Nouveau service"}
        </DialogTitle>

        {succes ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-base font-semibold text-gray-900">
              {estModification ? "Service modifié !" : "Service créé !"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">
                {estModification ? "Modifier le service" : "Nouveau service"}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {erreur && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{erreur}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Nom du service <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="ex : Médecine générale, Pédiatrie..."
                  value={nom}
                  onChange={(e) => { setNom(e.target.value); setErreur(""); }}
                  className={cn(erreur && !nom.trim() && "border-red-400")}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  placeholder="Description optionnelle..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {COULEURS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCouleur(c)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-transform",
                        couleur === c ? "border-gray-800 scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-5 h-5 rounded-full border border-gray-200"
                    style={{ backgroundColor: couleur }}
                  />
                  <span className="text-xs text-gray-500">{couleur}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
              <Button type="button" variant="ghost" onClick={fermer} className="text-gray-500">
                Annuler
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleSubmit}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</>
                ) : (
                  <><Check className="h-4 w-4 mr-1.5" /> {estModification ? "Enregistrer" : "Créer"}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Composant principal
// ============================================================
export function ServicesManager({
  services,
  hospitalId,
  utilisateurId,
  utilisateurNom,
}: ServicesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [serviceEdite, setServiceEdite] = useState<Service | null>(null);
  const [serviceASupprimer, setServiceASupprimer] = useState<Service | null>(null);
  const [erreurSuppression, setErreurSuppression] = useState("");

  function handleSupprimer() {
    if (!serviceASupprimer) return;
    startTransition(async () => {
      try {
        await supprimerService(
          serviceASupprimer.id, hospitalId, utilisateurId, utilisateurNom
        );
        router.refresh();
        setServiceASupprimer(null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur inattendue";
        setErreurSuppression(msg);
      }
    });
  }

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {services.length} service{services.length > 1 ? "s" : ""} configuré
            {services.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => { setServiceEdite(null); setDialogOuvert(true); }}
          className="bg-blue-700 hover:bg-blue-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau service
        </Button>
      </div>

      {/* Liste */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Stethoscope className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">Aucun service configuré</p>
            <p className="text-gray-400 text-sm mt-1">
              Créez les services de votre structure (Médecine générale, Pédiatrie...)
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">

                  {/* Indicateur couleur + nom */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: service.couleur }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{service.nom}</p>
                      {service.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0"
                        >
                          {service._count.consultations} consultation
                          {service._count.consultations > 1 ? "s" : ""}
                        </Badge>
                        {!service.est_actif && (
                          <Badge variant="outline" className="text-xs text-gray-400">
                            Inactif
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => { setServiceEdite(service); setDialogOuvert(true); }}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setErreurSuppression(""); setServiceASupprimer(service); }}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog création / modification */}
      <ServiceForm
        open={dialogOuvert}
        onOpenChange={(v) => { setDialogOuvert(v); if (!v) setServiceEdite(null); }}
        hospitalId={hospitalId}
        utilisateurId={utilisateurId}
        utilisateurNom={utilisateurNom}
        serviceAModifier={serviceEdite}
      />

      {/* Confirmation suppression */}
      <Dialog
        open={!!serviceASupprimer}
        onOpenChange={(v: boolean) => { if (!v) setServiceASupprimer(null); }}
      >
        <DialogContent className="max-w-sm w-full gap-0 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Supprimer le service</DialogTitle>
          <div className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Supprimer le service</h3>
            <p className="text-sm text-gray-500">
              Êtes-vous sûr de vouloir supprimer le service{" "}
              <strong className="text-gray-800">{serviceASupprimer?.nom}</strong> ?
              Cette action est irréversible.
            </p>
            {erreurSuppression && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{erreurSuppression}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setServiceASupprimer(null)}
              className="text-gray-500"
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={handleSupprimer}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
