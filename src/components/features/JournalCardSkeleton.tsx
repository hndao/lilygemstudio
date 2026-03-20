/**
 * JournalCardSkeleton — pulse placeholder matching JournalCard layout.
 * Used as the Suspense fallback while post data streams from the server.
 */
export function JournalCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-(--color-surface) shadow-(--shadow-soft) animate-pulse">
      {/* 16:9 image placeholder */}
      <div className="aspect-video w-full bg-(--color-sand)" />

      {/* Card content */}
      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        {/* Category badge placeholder */}
        <div className="h-3 w-20 rounded-full bg-(--color-sand)" />

        {/* Title — 2 lines */}
        <div className="flex flex-col gap-2">
          <div className="h-4 w-full rounded bg-(--color-sand)" />
          <div className="h-4 w-4/5 rounded bg-(--color-sand)" />
        </div>

        {/* Date */}
        <div className="mt-auto h-3 w-28 rounded bg-(--color-sand-light)" />
      </div>
    </div>
  );
}

/** Grid of N skeleton cards matching the journal listing layout */
export function JournalGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <JournalCardSkeleton key={i} />
      ))}
    </div>
  );
}

