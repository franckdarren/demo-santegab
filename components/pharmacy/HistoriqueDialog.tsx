"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { TypeMouvement } from "@/app/generated/prisma/client";

const TYPE_CONFIG: Record<TypeMouvement, { label: string; color: string; icon: React.ElementType }> = {
  ENTREE:      { label: "Entrée",      color: "bg-green-100 text-green-700",  icon: TrendingUp },
  SORTIE:      { label: "Sortie",      color: "bg-orange-100 text-orange-700", icon: TrendingDown },
  AJUSTEMENT:  { label: "Ajustement",  color: "bg-blue-100 text-blue-700",    icon: RefreshCw },
  PEREMPTION:  { label: "Péremption",  color: "bg-red-100 text-red-700",      icon: X },
};

interface Mouvement {
  id: string;
  type_mouvement: TypeMouvement;
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  motif: string | null;
  created_at: Date;
  article: { nom: string; unite: string };
}

interface HistoriqueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mouvements: Mouvement[];
}

export function HistoriqueDialog({
  open,
  onOpenChange,
  mouvements,
}: HistoriqueDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl! w-full p-0 overflow-hidden gap-0 [&>button:first-of-type]:hidden">
        <DialogTitle className="sr-only">Historique des mouvements</DialogTitle>

        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Historique des mouvements
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              50 derniers mouvements de stock
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Liste */}
        <div className="overflow-y-auto max-h-[65vh]">
          {mouvements.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400 text-sm">Aucun mouvement enregistré</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {mouvements.map((m) => {
                const config = TYPE_CONFIG[m.type_mouvement];
                const Icon = config.icon;

                return (
                  <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                    {/* Icône */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      config.color
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {m.article.nom}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {m.motif ?? "Aucun motif renseigné"}
                      </p>
                    </div>

                    {/* Quantité */}
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-sm font-bold",
                        m.type_mouvement === "ENTREE" ? "text-green-600" : "text-orange-600"
                      )}>
                        {m.type_mouvement === "ENTREE" ? "+" : "-"}
                        {m.quantite} {m.article.unite}s
                      </p>
                      <p className="text-xs text-gray-400">
                        {m.quantite_avant} → {m.quantite_apres}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="hidden sm:block text-right shrink-0">
                      <p className="text-xs font-medium text-gray-700">
                        {formatDate(m.created_at)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(m.created_at)}
                      </p>
                    </div>

                    {/* Badge */}
                    <Badge className={cn("text-xs border-0 shrink-0", config.color)}>
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-500"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}