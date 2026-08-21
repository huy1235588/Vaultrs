/**
 * BackReferences — Panel showing items from other collections that reference the current item.
 *
 * Displayed in the ItemDetailPage sidebar to reveal reverse relationships
 * (e.g., which Films reference a given Actor).
 */
import { useEffect, useState } from "react";
import { ArrowUpRight, GitBranch, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import * as relationService from "@/core/api/relationService";
import type { BackReference } from "@/core/types/common";
import { cn } from "@/lib/utils";

interface BackReferencesProps {
    /** Item ID to look up back-references for. */
    itemId: number;
    className?: string;
}

export function BackReferences({ itemId, className }: BackReferencesProps) {
    const [backRefs, setBackRefs] = useState<BackReference[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        relationService
            .getBackReferences(itemId)
            .then((refs) => {
                setBackRefs(refs);
            })
            .catch((err) => {
                console.error("Failed to load back-references:", err);
                setError("Failed to load references");
            })
            .finally(() => setLoading(false));
    }, [itemId]);

    // Group back-references by source collection
    const grouped = backRefs.reduce<
        Record<string, { name: string; icon: string | null; items: BackReference[] }>
    >((acc, ref_) => {
        const key = `${ref_.collection_id}`;
        if (!acc[key]) {
            acc[key] = {
                name: ref_.collection_name,
                icon: ref_.collection_icon,
                items: [],
            };
        }
        acc[key].items.push(ref_);
        return acc;
    }, {});

    const hasBackRefs = backRefs.length > 0;

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center gap-2">
                <GitBranch className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Referenced By</h3>
                {hasBackRefs && (
                    <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
                        {backRefs.length}
                    </span>
                )}
            </div>

            <Separator />

            {loading ? (
                <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Loading references...
                </div>
            ) : error ? (
                <p className="py-2 text-xs text-destructive">{error}</p>
            ) : !hasBackRefs ? (
                <p className="py-2 text-xs italic text-muted-foreground">
                    No items reference this entry yet.
                </p>
            ) : (
                <div className="space-y-3">
                    {Object.entries(grouped).map(([collId, group]) => (
                        <div key={collId} className="space-y-1">
                            {/* Collection header */}
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <span className="text-sm leading-none">
                                    {group.icon || "📁"}
                                </span>
                                {group.name}
                            </div>

                            {/* Items in this collection */}
                            <div className="space-y-0.5 pl-1">
                                {group.items.map((ref_) => (
                                    <button
                                        key={`${ref_.item_id}-${ref_.attribute_name}`}
                                        type="button"
                                        className="group flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition-colors hover:bg-accent"
                                        title={`via "${ref_.attribute_name}" field`}
                                    >
                                        <span className="flex-1 truncate font-medium text-foreground">
                                            {ref_.item_title}
                                        </span>
                                        <ArrowUpRight className="size-3 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
