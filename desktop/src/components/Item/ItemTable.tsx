/**
 * ItemTable — Table displaying items in a collection with pagination.
 */
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import * as itemService from "@/core/api/itemService";
import type { Item, PaginatedResponse } from "@/core/types/common";
import { Button } from "@/components/ui/button";

interface ItemTableProps {
    collectionId: number;
    /** Incremented externally to trigger a refetch (e.g., after creating an item). */
    refreshKey?: number;
}

const PAGE_SIZE = 20;

/** Format a unix timestamp (seconds) to a locale date string. */
function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function ItemTable({ collectionId, refreshKey = 0 }: ItemTableProps) {
    const [data, setData] = useState<PaginatedResponse<Item> | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await itemService.getItems(collectionId, {
                page,
                page_size: PAGE_SIZE,
            });
            setData(result);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load items";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [collectionId, page]);

    // Refetch when collection, page, or refreshKey changes
    useEffect(() => {
        fetchItems();
    }, [fetchItems, refreshKey]);

    // Reset page when collection changes
    useEffect(() => {
        setPage(1);
    }, [collectionId]);

    // --- Loading state ---
    if (loading && !data) {
        return (
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="h-12 animate-pulse rounded-md bg-muted"
                    />
                ))}
            </div>
        );
    }

    // --- Error state ---
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchItems}>
                    Retry
                </Button>
            </div>
        );
    }

    // --- Empty state ---
    if (!data || data.data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-7 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">
                        No items yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Add your first item to this collection.
                    </p>
                </div>
            </div>
        );
    }

    // --- Table ---
    return (
        <div>
            <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                Title
                            </th>
                            <th className="hidden w-36 px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                                Created
                            </th>
                            <th className="hidden w-36 px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                                Updated
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.data.map((item) => (
                            <tr
                                key={item.id}
                                className="transition-colors hover:bg-accent/50 cursor-pointer"
                            >
                                <td className="px-4 py-3 font-medium text-foreground">
                                    {item.title}
                                </td>
                                <td className="hidden w-36 px-4 py-3 text-muted-foreground sm:table-cell">
                                    {formatDate(item.created_at)}
                                </td>
                                <td className="hidden w-36 px-4 py-3 text-muted-foreground sm:table-cell">
                                    {formatDate(item.updated_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Showing{" "}
                        {(data.page - 1) * data.page_size + 1}–
                        {Math.min(data.page * data.page_size, data.total)} of{" "}
                        {data.total} items
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
                            {page} / {data.total_pages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            disabled={page >= data.total_pages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ItemTable;
