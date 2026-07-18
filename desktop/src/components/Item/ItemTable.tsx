/**
 * ItemTable — Table displaying items in a collection with pagination.
 */
import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FileText,
    Trash2,
} from "lucide-react";
import * as itemService from "@/core/api/itemService";
import type { Item, PaginatedResponse } from "@/core/types/common";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useItem } from "@/core/context/ItemContext";
import { DeleteItemDialog } from "./DeleteItemDialog";

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
    const { selectItem } = useItem();
    const [data, setData] = useState<PaginatedResponse<Item> | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);


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
            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="border-b border-border bg-muted/50 px-4 py-3">
                    <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                </div>
                <div className="divide-y divide-border">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                            <div className="h-3.5 flex-1 rounded bg-muted animate-pulse" />
                            <div className="hidden h-3.5 w-20 rounded bg-muted animate-pulse sm:block" />
                            <div className="hidden h-3.5 w-20 rounded bg-muted animate-pulse sm:block" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- Error state ---
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertCircle className="size-5" />
                </div>
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchItems}>
                    Try again
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
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="text-muted-foreground">Title</TableHead>
                                <TableHead className="hidden w-36 text-muted-foreground sm:table-cell">
                                    Created
                                </TableHead>
                                <TableHead className="hidden w-36 text-muted-foreground sm:table-cell">
                                    Updated
                                </TableHead>
                                <TableHead className="w-20" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.data.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="group cursor-pointer transition-colors hover:bg-accent/40"
                                    onClick={() => selectItem(item.id)}
                                >
                                    <TableCell className="font-semibold text-foreground">
                                        <span className="line-clamp-1">{item.title}</span>
                                    </TableCell>
                                    <TableCell className="hidden text-xs text-muted-foreground tabular-nums sm:table-cell">
                                        {formatDate(item.created_at)}
                                    </TableCell>
                                    <TableCell className="hidden text-xs text-muted-foreground tabular-nums sm:table-cell">
                                        {formatDate(item.updated_at)}
                                    </TableCell>
                                    <TableCell
                                        className="text-right"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        className="text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                                                        onClick={() => setDeleteTarget(item)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="left">Delete item</TooltipContent>
                                            </Tooltip>
                                            <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
                                onClick={() => setPage(1)}
                                title="First page"
                            >
                                <ChevronsLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                                title="Previous page"
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted-foreground">
                                {page} / {data.total_pages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                disabled={page >= data.total_pages}
                                onClick={() => setPage((p) => p + 1)}
                                title="Next page"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                disabled={page >= data.total_pages}
                                onClick={() => setPage(data.total_pages)}
                                title="Last page"
                            >
                                <ChevronsRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Dialog */}
                {deleteTarget && (
                    <DeleteItemDialog
                        itemId={deleteTarget.id}
                        itemTitle={deleteTarget.title}
                        open={!!deleteTarget}
                        onOpenChange={(open) => !open && setDeleteTarget(null)}
                        onDeleted={() => {
                            setDeleteTarget(null);
                            fetchItems();
                        }}
                    />
                )}
            </div>
    );
}

export default ItemTable;
