import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-32 bg-white/[0.05]" />
        <Skeleton className="h-10 w-24 rounded-xl bg-white/[0.05]" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl bg-white/[0.05]" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-white/[0.05]" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl bg-white/[0.05]" />
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-32 bg-white/[0.05]" />
        <Skeleton className="h-10 w-24 rounded-xl bg-white/[0.05]" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-10 w-20 rounded-full bg-white/[0.05]" />
        ))}
      </div>
      <Skeleton className="h-20 rounded-2xl bg-white/[0.05]" />
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-16 rounded-xl bg-white/[0.05]" />
      ))}
    </div>
  );
}
