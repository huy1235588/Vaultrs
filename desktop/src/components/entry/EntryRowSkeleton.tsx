// Entry row skeleton for loading state

export function EntryRowSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border animate-pulse">
            {/* Icon skeleton */}
            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-muted" />

            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
            </div>

            {/* Date skeleton */}
            <div className="flex-shrink-0 w-16 h-3 bg-muted rounded hidden sm:block" />
        </div>
    );
}
