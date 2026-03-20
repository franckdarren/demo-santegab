import { SkeletonKPI, SkeletonList } from "@/components/ui/skeleton-card";

export default function BillingLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-36 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-4 w-52 bg-gray-200 animate-pulse rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>
      <SkeletonList rows={6} />
    </div>
  );
}