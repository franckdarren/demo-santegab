// ============================================================
// LOADING DASHBOARD — Affiché par Next.js pendant le chargement
// du Server Component de la page dashboard
// ============================================================

import { SkeletonKPI, SkeletonChart } from "@/components/ui/skeleton-card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-4 w-64 bg-gray-200 animate-pulse rounded-md" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonChart />
        </div>
        <div className="lg:col-span-1">
          <SkeletonChart />
        </div>
      </div>
    </div>
  );
}