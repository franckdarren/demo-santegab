import { SkeletonList } from "@/components/ui/skeleton-card";

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-56 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-4 w-64 bg-gray-200 animate-pulse rounded-md" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="h-5 w-24 bg-gray-200 animate-pulse rounded-md" />
          <div className="h-5 w-24 bg-gray-200 animate-pulse rounded-md" />
        </div>
        <div className="h-9 w-40 bg-gray-200 animate-pulse rounded-md" />
      </div>
      <SkeletonList rows={6} />
    </div>
  );
}