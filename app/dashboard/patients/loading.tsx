import { SkeletonList } from "@/components/ui/skeleton-card";

export default function PatientsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-8 w-32 bg-gray-200 animate-pulse rounded-md" />
        <div className="h-4 w-48 bg-gray-200 animate-pulse rounded-md" />
      </div>
      <SkeletonList rows={8} />
    </div>
  );
}