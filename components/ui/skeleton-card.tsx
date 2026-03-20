// ============================================================
// SKELETON CARD — Placeholder de chargement réutilisable
// Affiché pendant que les données se chargent côté serveur
// ============================================================

import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  );
}

// Skeleton pour une ligne de tableau (patients, consultations...)
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-20 hidden sm:block" />
      <Skeleton className="h-6 w-16" />
    </div>
  );
}

// Skeleton pour une carte KPI
export function SkeletonKPI() {
  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

// Skeleton pour un graphique
export function SkeletonChart() {
  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-55 w-full rounded-lg" />
    </div>
  );
}

// Skeleton pour la page entière d'une liste
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-40 rounded-md" />
      </div>
      {/* Tableau */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}