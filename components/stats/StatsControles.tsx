"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { exporterRapportCSV } from "@/app/dashboard/stats/actions";

interface StatsControlesProps {
  hospitalId: string;
}

const PRESETS = [
  { label: "Ce mois", id: "ce_mois" },
  { label: "Mois préc.", id: "mois_precedent" },
  { label: "3 mois", id: "3_mois" },
  { label: "6 mois", id: "6_mois" },
  { label: "Cette année", id: "cette_annee" },
];

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getPresetDates(id: string): { debut: string; fin: string } {
  const auj = new Date();
  if (id === "ce_mois") {
    return { debut: fmt(new Date(auj.getFullYear(), auj.getMonth(), 1)), fin: fmt(auj) };
  }
  if (id === "mois_precedent") {
    return {
      debut: fmt(new Date(auj.getFullYear(), auj.getMonth() - 1, 1)),
      fin: fmt(new Date(auj.getFullYear(), auj.getMonth(), 0)),
    };
  }
  if (id === "3_mois") {
    const d = new Date(auj);
    d.setMonth(d.getMonth() - 3);
    return { debut: fmt(d), fin: fmt(auj) };
  }
  if (id === "6_mois") {
    const d = new Date(auj);
    d.setMonth(d.getMonth() - 6);
    return { debut: fmt(d), fin: fmt(auj) };
  }
  if (id === "cette_annee") {
    return { debut: fmt(new Date(auj.getFullYear(), 0, 1)), fin: fmt(auj) };
  }
  return { debut: fmt(auj), fin: fmt(auj) };
}

export function StatsControles({ hospitalId }: StatsControlesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const debutParam = searchParams.get("debut") ?? "";
  const finParam = searchParams.get("fin") ?? "";

  // Vérifie si un preset correspond aux dates actuelles dans l'URL
  function presetActif(presetId: string): boolean {
    const { debut, fin } = getPresetDates(presetId);
    return debut === debutParam && fin === finParam;
  }

  function appliquerPreset(presetId: string) {
    const { debut, fin } = getPresetDates(presetId);
    startTransition(() => router.push(`?debut=${debut}&fin=${fin}`));
  }

  function appliquerDates(debut: string, fin: string) {
    if (!debut || !fin || debut > fin) return;
    startTransition(() => router.push(`?debut=${debut}&fin=${fin}`));
  }

  async function telechargerCSV() {
    const auj = fmt(new Date());
    const debut =
      debutParam || fmt(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const fin = finParam || auj;

    setIsExporting(true);
    try {
      const csv = await exporterRapportCSV(hospitalId, debut, fin);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-santegab-${debut}-${fin}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
      {/* Boutons presets */}
      <div className="flex items-center gap-1 flex-wrap">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => appliquerPreset(preset.id)}
            disabled={isPending}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors disabled:opacity-50 ${
              presetActif(preset.id)
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Dates personnalisées
          key= force le remontage quand l'URL change (preset → inputs mis à jour) */}
      <div className="flex items-center gap-1.5">
        <input
          key={`debut-${debutParam}`}
          type="date"
          defaultValue={debutParam}
          onBlur={(e) => appliquerDates(e.target.value, finParam)}
          className="px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <span className="text-xs text-gray-400">→</span>
        <input
          key={`fin-${finParam}`}
          type="date"
          defaultValue={finParam}
          onBlur={(e) => appliquerDates(debutParam, e.target.value)}
          className="px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* Bouton export CSV */}
      <Button
        size="sm"
        variant="outline"
        onClick={telechargerCSV}
        disabled={isExporting || isPending}
        className="shrink-0"
      >
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        ) : (
          <Download className="h-3.5 w-3.5 mr-1.5" />
        )}
        Exporter CSV
      </Button>
    </div>
  );
}
