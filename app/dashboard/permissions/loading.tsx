import { SkeletonKPI } from "@/components/ui/skeleton-card";

export default function PermissionsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-4 w-96 bg-gray-200 animate-pulse rounded-md" />
      </div>
      <div className="h-12 w-full bg-gray-200 animate-pulse rounded-xl" />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-16 w-full bg-gray-200 animate-pulse rounded-xl" />
      ))}
    </div>
  );
}