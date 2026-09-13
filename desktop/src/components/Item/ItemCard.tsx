/**
 * ItemCard — Card component for Grid view displaying an item.
 *
 * Supports custom cover height/aspect ratio, and rich information display:
 * Title, custom attribute values/badges (rating, tags, genre, year, etc.), and timestamps.
 */
import { useMemo, useState } from "react";
import { Calendar, Star, Tag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Asset, Attribute } from "@/core/types/common";

interface ItemCardProps {
    id: number;
    title: string;
    createdAt: number;
    updatedAt: number;
    properties?: string | Record<string, any>;
    attributes?: Attribute[];
    collectionIcon?: string;
    /** Cover asset for the item (null = no cover, undefined = not yet loaded). */
    cover?: Asset | null;
    /** Resolve a relative vault path to a displayable URL. */
    resolveAssetUrl?: (relativePath: string) => string;
    /** Whether to show the title section below the cover (default: true). */
    showTitle?: boolean;
    /** Whether to show custom attribute metadata below title (default: true). */
    showProperties?: boolean;
    /** Whether to show the date timestamp (default: true). */
    showDate?: boolean;
    /** Custom card cover height in pixels (if not set, falls back to cardSize preset). */
    cardHeight?: number;
    /** Card size preset (default: "MEDIUM"). */
    cardSize?: "SMALL" | "MEDIUM" | "LARGE";
    onClick: () => void;
    onDelete: () => void;
}

/**
 * Generate a deterministic hue from a string.
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
 */
function titleToGradient(title: string): string {
    const hue1 = stringToHue(title);
    const hue2 = (hue1 + 40) % 360;
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

interface FormattedAttr {
    key: string;
    name: string;
    value: string;
    isRating?: boolean;
    isTag?: boolean;
}

export function ItemCard({
    id,
    title,
    createdAt,
    updatedAt,
    properties,
    attributes = [],
    collectionIcon,
    cover,
    resolveAssetUrl,
    showTitle = true,
    showProperties = true,
    showDate = true,
    cardHeight,
    cardSize = "MEDIUM",
    onClick,
    onDelete,
}: ItemCardProps) {
    const hasCover = cover && cover.state === "READY";
    const coverUrl = hasCover ? getCoverUrl(cover, resolveAssetUrl) : null;
    const [imageLoaded, setImageLoaded] = useState(false);

    // Parse item custom properties
    const parsedProps = useMemo<Record<string, any>>(() => {
        if (!properties) return {};
        if (typeof properties === "object") return properties;
        try {
            return JSON.parse(properties);
        } catch {
            return {};
        }
    }, [properties]);

    // Extract formatted attributes to display on the card
    const displayAttrs = useMemo<FormattedAttr[]>(() => {
        if (!showProperties || !attributes.length) return [];
        const result: FormattedAttr[] = [];

        for (const attr of attributes) {
            const raw = parsedProps[attr.key];
            if (raw === undefined || raw === null || raw === "") continue;

            const keyLower = attr.key.toLowerCase();
            const nameLower = attr.name.toLowerCase();
            const isRating =
                keyLower.includes("rating") ||
                nameLower.includes("rating") ||
                keyLower.includes("score") ||
                nameLower.includes("điểm");

            const isTag =
                attr.field_type === "select" ||
                attr.field_type === "multiselect" ||
                keyLower.includes("genre") ||
                keyLower.includes("tag") ||
                keyLower.includes("status");

            let strVal = "";
            if (Array.isArray(raw)) {
                strVal = raw.join(", ");
            } else if (typeof raw === "boolean") {
                strVal = raw ? attr.name : "";
            } else {
                strVal = String(raw);
            }

            if (!strVal.trim()) continue;

            result.push({
                key: attr.key,
                name: attr.name,
                value: strVal,
                isRating,
                isTag,
            });

            if (result.length >= 3) break; // Limit to max 3 attributes on card
        }

        return result;
    }, [parsedProps, attributes, showProperties]);

    // Check if there's a prominent rating to display over the cover
    const ratingAttr = useMemo(() => {
        return displayAttrs.find((a) => a.isRating);
    }, [displayAttrs]);

    // Non-rating attributes to show in info block
    const nonRatingAttrs = useMemo(() => {
        return displayAttrs.filter((a) => !a.isRating);
    }, [displayAttrs]);

    return (
        <div
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 h-full select-none"
            onClick={onClick}
        >
            {/* ═══ Cover Area ═══ */}
            <div
                className={cn(
                    "relative flex w-full shrink-0 items-center justify-center overflow-hidden bg-muted/40",
                    !cardHeight && cardSize === "SMALL" && "aspect-[16/10]",
                    !cardHeight && cardSize === "LARGE" && "aspect-[4/3]",
                    !cardHeight && cardSize === "MEDIUM" && "aspect-[16/10]",
                )}
                style={{
                    height: cardHeight ? `${cardHeight}px` : undefined,
                    background: coverUrl ? undefined : titleToGradient(title),
                }}
            >
                {/* Noise texture for gradient fallback */}
                {!coverUrl && <div className="noise-overlay absolute inset-0 pointer-events-none" />}

                {coverUrl ? (
                    <>
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
                    <span
                        className={cn(
                            "opacity-25 transition-all duration-300 group-hover:opacity-40 group-hover:scale-110",
                            cardSize === "SMALL" ? "text-3xl" : "text-4xl",
                        )}
                    >
                        {collectionIcon || "📄"}
                    </span>
                )}

                {/* Rating badge on cover (if present) */}
                {ratingAttr && (
                    <div className="absolute top-2 left-2 z-10">
                        <span className="flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-[11px] font-semibold text-amber-300 shadow-sm border border-white/10">
                            <Star className="size-3 fill-amber-300 text-amber-300" />
                            {ratingAttr.value}
                        </span>
                    </div>
                )}

                {/* Overlay title when showTitle is false */}
                {!showTitle && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-8">
                        <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-white drop-shadow-sm">
                            {title}
                        </h3>
                        {showDate && (
                            <p className="mt-0.5 text-[10px] tabular-nums text-white/75">
                                {formatDate(updatedAt)}
                            </p>
                        )}
                    </div>
                )}

                {/* Delete button — appears on hover */}
                <div
                    className="absolute top-2 right-2 z-10 opacity-0 transition-all duration-200 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="bg-black/40 text-white/90 backdrop-blur-md border border-white/10 hover:bg-destructive hover:text-white hover:border-transparent transition-all duration-200"
                                onClick={onDelete}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete item</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* ═══ Info Section ═══ */}
            {showTitle && (
                <div className="flex flex-1 flex-col justify-between p-3 gap-2">
                    <div className="space-y-1.5 min-w-0">
                        {/* Title */}
                        <h3 className="line-clamp-2 font-semibold text-xs leading-snug text-foreground group-hover:text-primary transition-colors duration-200">
                            {title}
                        </h3>

                        {/* Metadata attributes badges */}
                        {showProperties && nonRatingAttrs.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                {nonRatingAttrs.map((attr) => (
                                    <Badge
                                        key={attr.key}
                                        variant="secondary"
                                        className="text-[10px] font-normal px-1.5 py-0 bg-muted/60 text-muted-foreground border-border/40 truncate max-w-[130px]"
                                        title={`${attr.name}: ${attr.value}`}
                                    >
                                        {attr.value}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Date timestamp */}
                    {showDate && (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground/65 tabular-nums pt-1 border-t border-border/40 mt-auto">
                            <span>{formatDate(updatedAt)}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ItemCard;
