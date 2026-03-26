import { SkeletonKPI } from "@/components/ui/skeleton-card";

export default function ChambresLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-52 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-4 w-80 bg-gray-200 animate-pulse rounded-md" />
      </div>

      {/* Header + bouton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-10 w-44 bg-gray-200 animate-pulse rounded-lg" />
      </div>

      {/* Grille chambres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}