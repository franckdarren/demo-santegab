// ============================================================
// AUDIT LIST — Journal des actions avec filtres
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, Loader2, Activity, Download,
  UserRound, Stethoscope, FlaskConical,
  Receipt, Package, Shield, LogIn,
  FilePlus, FileEdit, Trash2, Eye,
  QrCode, ScanLine, BookOpen, Users,
} from "lucide-react";
import { formatDate, formatTime, cn } from "@/lib/utils";
import {
  TypeAction,
  ModuleAction,
  Role,
} from "@/app/generated/prisma/client";
import { getAuditLogs } from "@/app/dashboard/audit/actions";

// ============================================================
// Configuration visuelle des types d'action
// ============================================================
const TYPE_ACTION_CONFIG: Record<TypeAction, {
  label: string;
  color: string;
  icon: React.ElementType;
}> = {
  CREATION:          { label: "Création",     color: "bg-green-100 text-green-700",  icon: FilePlus },
  MODIFICATION:      { label: "Modification", color: "bg-blue-100 text-blue-700",    icon: FileEdit },
  SUPPRESSION:       { label: "Suppression",  color: "bg-red-100 text-red-700",      icon: Trash2 },
  CONSULTATION:      { label: "Consultation", color: "bg-gray-100 text-gray-600",    icon: Eye },
  CONNEXION:         { label: "Connexion",    color: "bg-purple-100 text-purple-700", icon: LogIn },
  DECONNEXION:       { label: "Déconnexion",  color: "bg-gray-100 text-gray-500",    icon: LogIn },
  EXPORT:            { label: "Export",       color: "bg-cyan-100 text-cyan-700",    icon: Download },
  QR_CODE_GENERATION:{ label: "QR Généré",   color: "bg-orange-100 text-orange-700", icon: QrCode },
  QR_CODE_ACCES:     { label: "QR Accès",    color: "bg-yellow-100 text-yellow-700", icon: QrCode },
};

// ============================================================
// Configuration visuelle des modules
// ============================================================
const MODULE_CONFIG: Record<ModuleAction, {
  label: string;
  icon: React.ElementType;
  color: string;
}> = {
  PATIENT:          { label: "Patient",        icon: UserRound,    color: "text-blue-600" },
  CONSULTATION:     { label: "Consultation",   icon: Stethoscope,  color: "text-green-600" },
  LABORATOIRE:      { label: "Laboratoire",    icon: FlaskConical, color: "text-cyan-600" },
  IMAGERIE:         { label: "Imagerie",       icon: ScanLine,     color: "text-violet-600" },
  PHARMACIE:        { label: "Pharmacie",      icon: Package,      color: "text-pink-600" },
  STOCK:            { label: "Stock",          icon: Package,      color: "text-orange-600" },
  FACTURATION:      { label: "Facturation",    icon: Receipt,      color: "text-yellow-600" },
  COMPTABILITE:     { label: "Comptabilité",   icon: BookOpen,     color: "text-indigo-600" },
  UTILISATEUR:      { label: "Utilisateur",    icon: Users,        color: "text-purple-600" },
  CARNET_SANTE:     { label: "Carnet santé",   icon: Shield,       color: "text-red-600" },
  AUTHENTIFICATION: { label: "Auth",           icon: LogIn,        color: "text-gray-600" },
};

interface Log {
  id: string;
  utilisateur_id: string | null;
  utilisateur_nom: string | null;
  type_action: TypeAction;
  module: ModuleAction;
  description: string;
  entite_nom: string | null;
  ip_address: string | null;
  created_at: Date;
}

interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  role: Role;
}

interface AuditListProps {
  logs: Log[];
  utilisateurs: Utilisateur[];
  hospitalId: string;
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function AuditList({
  logs,
  utilisateurs,
  hospitalId,
}: AuditListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filtres locaux (pas de rechargement serveur)
  const [search, setSearch] = useState("");
  const [filtreType, setFiltreType] = useState<TypeAction | "">("");
  const [filtreModule, setFiltreModule] = useState<ModuleAction | "">("");
  const [filtreUser, setFiltreUser] = useState("");
  const [filtreDate, setFiltreDate] = useState("");

  // Filtrage côté client pour la réactivité
  const logsFiltres = logs.filter((log) => {
    if (filtreType && log.type_action !== filtreType) return false;
    if (filtreModule && log.module !== filtreModule) return false;
    if (filtreUser && log.utilisateur_id !== filtreUser) return false;
    if (filtreDate) {
      const dateLog = new Date(log.created_at).toISOString().split("T")[0];
      if (dateLog !== filtreDate) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        log.description.toLowerCase().includes(q) ||
        (log.utilisateur_nom ?? "").toLowerCase().includes(q) ||
        (log.entite_nom ?? "").toLowerCase().includes(q) ||
        (log.ip_address ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Export CSV
  function handleExportCSV() {
    const headers = [
      "Date", "Heure", "Utilisateur", "Action",
      "Module", "Description", "Entité", "IP"
    ].join(";");

    const rows = logsFiltres.map((log) => [
      formatDate(log.created_at),
      formatTime(log.created_at),
      log.utilisateur_nom ?? "Public",
      TYPE_ACTION_CONFIG[log.type_action].label,
      MODULE_CONFIG[log.module].label,
      `"${log.description}"`,
      log.entite_nom ?? "",
      log.ip_address ?? "",
    ].join(";"));

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reinitialiserFiltres() {
    setSearch("");
    setFiltreType("");
    setFiltreModule("");
    setFiltreUser("");
    setFiltreDate("");
  }

  const aFiltresActifs =
    search || filtreType || filtreModule || filtreUser || filtreDate;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Journal des actions
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {logsFiltres.length} entrée{logsFiltres.length > 1 ? "s" : ""}
            {aFiltresActifs ? " (filtrées)" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {aFiltresActifs && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reinitialiserFiltres}
              className="text-xs border-gray-200 text-gray-500"
            >
              Réinitialiser
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs border-gray-200 text-gray-600"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {/* Recherche */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200 text-sm"
          />
        </div>

        {/* Filtre type action */}
        <select
          value={filtreType}
          onChange={(e) => setFiltreType(e.target.value as TypeAction | "")}
          className={selectClass}
        >
          <option value="">Toutes les actions</option>
          {Object.entries(TYPE_ACTION_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>

        {/* Filtre module */}
        <select
          value={filtreModule}
          onChange={(e) => setFiltreModule(e.target.value as ModuleAction | "")}
          className={selectClass}
        >
          <option value="">Tous les modules</option>
          {Object.entries(MODULE_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>

        {/* Filtre utilisateur */}
        <select
          value={filtreUser}
          onChange={(e) => setFiltreUser(e.target.value)}
          className={selectClass}
        >
          <option value="">Tous les utilisateurs</option>
          {utilisateurs.map((u) => (
            <option key={u.id} value={u.id}>
              {u.prenom} {u.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Filtre date */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-500 shrink-0">
          Filtrer par date :
        </label>
        <Input
          type="date"
          value={filtreDate}
          onChange={(e) => setFiltreDate(e.target.value)}
          className="w-auto text-sm border-gray-200 bg-white"
        />
      </div>

      {/* Liste des logs */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {logsFiltres.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Aucune action trouvée</p>
              <p className="text-gray-400 text-sm mt-1">
                Modifiez vos filtres pour voir plus de résultats
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logsFiltres.map((log) => {
                const typeConfig = TYPE_ACTION_CONFIG[log.type_action];
                const moduleConfig = MODULE_CONFIG[log.module];
                const TypeIcon = typeConfig.icon;
                const ModuleIcon = moduleConfig.icon;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Icône action */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      typeConfig.color
                    )}>
                      <TypeIcon className="h-3.5 w-3.5" />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">
                        {log.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* Utilisateur */}
                        <span className="text-xs text-gray-500 font-medium">
                          {log.utilisateur_nom ?? "Accès public"}
                        </span>
                        <span className="text-gray-300">·</span>
                        {/* Module */}
                        <span className={cn(
                          "flex items-center gap-1 text-xs",
                          moduleConfig.color
                        )}>
                          <ModuleIcon className="h-3 w-3" />
                          {moduleConfig.label}
                        </span>
                        {/* IP */}
                        {log.ip_address && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400 font-mono">
                              {log.ip_address}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Droite — Badge + Date */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className={cn(
                        "text-[10px] border-0",
                        typeConfig.color
                      )}>
                        {typeConfig.label}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-600">
                          {formatDate(log.created_at)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}