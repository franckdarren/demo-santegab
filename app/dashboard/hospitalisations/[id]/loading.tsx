import { SkeletonKPI } from "@/components/ui/skeleton-card";

export default function FicheHospitalisationLoading() {
  return (
    <div className="space-y-6">

      {/* Retour */}
      <div className="h-4 w-40 bg-gray-200 animate-pulse rounded-md" />

      {/* Header patient */}
      <div className="h-44 bg-gray-200 animate-pulse rounded-xl" />

      {/* Contenu 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Timeline */}
        <div className="lg:col-span-2 space-y-3">
          <div className="h-4 w-48 bg-gray-200 animate-pulse rounded-md" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>

        {/* Récapitulatif */}
        <div className="space-y-3">
          <div className="h-4 w-32 bg-gray-200 animate-pulse rounded-md" />
          <div className="h-64 bg-gray-200 animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );
}