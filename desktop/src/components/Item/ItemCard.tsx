/**
 * ItemCard — Card component for Grid view displaying an item.
 *
 * Shows the cover image when available, falling back to a deterministic
 * gradient background derived from the item title hash.
 */
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Asset } from "@/core/types/common";

interface ItemCardProps {
    id: number;
    title: string;
    createdAt: number;
    updatedAt: number;
    collectionIcon?: string;
    /** Cover asset for the item (null = no cover, undefined = not yet loaded). */
    cover?: Asset | null;
    /** Resolve a relative vault path to a displayable URL. */
    resolveAssetUrl?: (relativePath: string) => string;
    onClick: () => void;
    onDelete: () => void;
}

/**
 * Generate a deterministic hue from a string.
 * Uses a simple hash function to map any string to a 0-360 hue value.
 */
function stringToHue(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash) % 360;
}

/**
 * Generate gradient CSS from a title string.
 * Returns a consistent, visually pleasing gradient for the card cover area.
 */
function titleToGradient(title: string): string {
    const hue1 = stringToHue(title);
    const hue2 = (hue1 + 40) % 360; // Analogous color
    return `linear-gradient(135deg, oklch(0.35 0.12 ${hue1}) 0%, oklch(0.25 0.08 ${hue2}) 100%)`;
}

/** Format a unix timestamp (seconds) to a short date string. */
function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/**
 * Resolve the best displayable URL for a cover asset.
 * Prefers thumbnail > original > source_url.
 */
function getCoverUrl(
    cover: Asset,
    resolveUrl?: (path: string) => string,
): string | null {
    if (cover.source_type === "REMOTE" && cover.source_url) {
        return cover.source_url;
    }
    if (!resolveUrl) return null;
    if (cover.thumbnail_path) return resolveUrl(cover.thumbnail_path);
    if (cover.relative_path) return resolveUrl(cover.relative_path);
    return null;
}

function ItemCard({
    id,
    title,
    createdAt,
    updatedAt,
    collectionIcon,
    cover,
    resolveAssetUrl,
    onClick,
    onDelete,
}: ItemCardProps) {
    const hasCover = cover && cover.state === "READY";
    const coverUrl = hasCover ? getCoverUrl(cover, resolveAssetUrl) : null;

    return (
        <div
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
            onClick={onClick}
        >
            {/* Cover area — image or gradient fallback */}
            <div
                className="relative flex h-36 items-center justify-center overflow-hidden"
                style={coverUrl ? undefined : { background: titleToGradient(title) }}
            >
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        draggable={false}
                        loading="lazy"
                    />
                ) : (
                    /* Collection icon overlay (fallback) */
                    <span className="text-4xl opacity-30 transition-opacity group-hover:opacity-50">
                        {collectionIcon || "📄"}
                    </span>
                )}

                {/* Delete button — appears on hover */}
                <div
                    className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="bg-black/30 text-white/80 backdrop-blur-sm hover:bg-destructive hover:text-white"
                                onClick={onDelete}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete item</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Info area */}
            <div className="flex flex-1 flex-col gap-1 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                    {title}
                </h3>
                <p className="mt-auto text-[11px] tabular-nums text-muted-foreground">
                    {formatDate(updatedAt)}
                </p>
            </div>
        </div>
    );
}

export default ItemCard;
export { ItemCard };
