/**
 * ItemCard — Card component for Grid view displaying an item.
 *
 * Shows the cover image when available, falling back to a deterministic
 * gradient background derived from the item title hash.
 */
import { useState } from "react";
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
    /** Whether to show the title/date info section below the cover (default: true). */
    showTitle?: boolean;
    /** Card size preset (default: "MEDIUM"). */
    cardSize?: "SMALL" | "MEDIUM" | "LARGE";
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
    showTitle = true,
    cardSize = "MEDIUM",
    onClick,
    onDelete,
}: ItemCardProps) {
    const hasCover = cover && cover.state === "READY";
    const coverUrl = hasCover ? getCoverUrl(cover, resolveAssetUrl) : null;
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
            onClick={onClick}
        >
            {/* Cover area — image or gradient fallback */}
            <div
                className={cn(
                    "relative flex w-full shrink-0 items-center justify-center overflow-hidden",
                    cardSize === "SMALL" && "aspect-[16/10]",
                    cardSize === "LARGE" && "aspect-[4/3]",
                    cardSize === "MEDIUM" && "aspect-[16/10]",
                )}
                style={coverUrl ? undefined : { background: titleToGradient(title) }}
            >
                {/* Noise overlay for gradient fallback */}
                {!coverUrl && <div className="noise-overlay absolute inset-0" />}

                {coverUrl ? (
                    <>
                        {/* Shimmer skeleton while image loads */}
                        {!imageLoaded && (
                            <div className="absolute inset-0 bg-muted/30 animate-shimmer" />
                        )}
                        <img
                            src={coverUrl}
                            alt={title}
                            className={cn(
                                "h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105",
                                imageLoaded ? "opacity-100" : "opacity-0",
                            )}
                            draggable={false}
                            loading="lazy"
                            onLoad={() => setImageLoaded(true)}
                        />
                    </>
                ) : (
                    /* Collection icon overlay (fallback) */
                    <span
                        className={cn(
                            "opacity-20 transition-all duration-300 group-hover:opacity-35 group-hover:scale-110",
                            cardSize === "SMALL" ? "text-3xl" : "text-4xl",
                        )}
                    >
                        {collectionIcon || "📄"}
                    </span>
                )}

                {/* Bottom gradient and title overlay when showTitle is false */}
                {!showTitle && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 pt-8">
                        <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-white drop-shadow-sm">
                            {title}
                        </h3>
                        <p className="mt-0.5 text-[10px] tabular-nums text-white/70">
                            {formatDate(updatedAt)}
                        </p>
                    </div>
                )}

                {/* Delete button — appears on hover */}
                <div
                    className="absolute top-2 right-2 opacity-0 transition-all duration-200 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="bg-black/30 text-white/80 backdrop-blur-md border border-white/10 hover:bg-destructive hover:text-white hover:border-transparent transition-all duration-200"
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
            {showTitle && (
                <div
                    className={cn(
                        "flex flex-1 flex-col gap-1.5",
                        cardSize === "SMALL" ? "p-2.5" : "p-3",
                    )}
                >
                    <h3
                        className={cn(
                            "line-clamp-2 font-semibold leading-snug text-foreground group-hover:text-primary/90 transition-colors duration-200",
                            cardSize === "SMALL" ? "text-xs" : "text-sm",
                        )}
                    >
                        {title}
                    </h3>
                    <p className="mt-auto text-[11px] tabular-nums text-muted-foreground/60">
                        {formatDate(updatedAt)}
                    </p>
                </div>
            )}
        </div>
    );
}

export default ItemCard;
export { ItemCard };
