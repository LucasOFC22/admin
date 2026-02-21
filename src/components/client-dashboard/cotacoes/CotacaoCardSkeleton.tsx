import { Skeleton } from "@/components/ui/skeleton";

export const CotacaoCardSkeleton = () => {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>

      {/* Route Section */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-2 w-10" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
          <Skeleton className="w-4 h-4" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-2 w-10" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cargo Details */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="min-w-0 space-y-1">
                <Skeleton className="h-2 w-8" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Value & Action */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

interface CotacaoCardSkeletonGridProps {
  count?: number;
}

export const CotacaoCardSkeletonGrid = ({ count = 6 }: CotacaoCardSkeletonGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CotacaoCardSkeleton key={i} />
      ))}
    </div>
  );
};
