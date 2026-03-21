import { SkeletonKPI } from "@/components/ui/skeleton-card";

export default function PharmacyLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-4 w-64 bg-gray-200 animate-pulse rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}