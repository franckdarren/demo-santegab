import { SkeletonKPI } from "@/components/ui/skeleton-card";

export default function HospitalisationsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-56 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-4 w-72 bg-gray-200 animate-pulse rounded-md" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>

      {/* Bouton admission */}
      <div className="flex justify-end">
        <div className="h-10 w-44 bg-gray-200 animate-pulse rounded-lg" />
      </div>

      {/* Kanban 3 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, col) => (
          <div key={col} className="space-y-3">
            <div className="h-5 w-32 bg-gray-200 animate-pulse rounded-md" />
            {Array.from({ length: col === 0 ? 3 : 2 }).map((_, i) => (
              <div key={i} className="h-36 bg-gray-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}