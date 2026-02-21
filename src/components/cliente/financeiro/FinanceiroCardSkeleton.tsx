import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function FinanceiroStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-28" />
              </div>
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FinanceiroTituloSkeleton() {
  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 p-4">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-5 w-24 ml-auto" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceiroTitulosListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <FinanceiroTituloSkeleton key={i} />
      ))}
    </div>
  );
}

export function FinanceiroTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          {/* Header */}
          <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-muted/30 border-b">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 px-4 py-3 border-b last:border-b-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceiroDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <FinanceiroStatsSkeleton />
      
      {/* Chart skeleton */}
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
      
      {/* Quick links skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}
