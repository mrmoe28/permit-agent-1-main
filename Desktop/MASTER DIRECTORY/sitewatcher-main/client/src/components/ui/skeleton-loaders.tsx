import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Chart area */}
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-end justify-around p-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 dark:bg-gray-700 rounded-t"
                style={{
                  height: `${Math.random() * 80 + 20}%`,
                  width: "12%"
                }}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="flex justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <div className="flex items-center space-x-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className="h-5 w-full"
                  style={{ width: `${Math.random() * 40 + 60}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Large Chart */}
      <ChartSkeleton />
    </div>
  );
}

export function KeywordsTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Keywords Table */}
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}

export function ProgressiveSkeleton({ 
  stage, 
  className = "" 
}: { 
  stage: "metrics" | "charts" | "tables" | "complete";
  className?: string;
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Always show metrics first */}
      {stage === "metrics" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        // Show actual metrics if past this stage
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="opacity-100">
              {/* This would be replaced with actual metric cards */}
              <MetricCardSkeleton />
            </div>
          ))}
        </div>
      )}

      {/* Show charts if at charts stage or beyond */}
      {(stage === "charts" || stage === "tables" || stage === "complete") && (
        <div className="space-y-6">
          {stage === "charts" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Actual charts would go here */}
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          )}
        </div>
      )}

      {/* Show tables if at tables stage or beyond */}
      {(stage === "tables" || stage === "complete") && (
        <div className="space-y-6">
          {stage === "tables" ? (
            <TableSkeleton rows={6} columns={5} />
          ) : (
            <div>
              {/* Actual table would go here */}
              <TableSkeleton rows={6} columns={5} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}