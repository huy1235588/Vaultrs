/**
 * ItemCard — Card component for Grid view displaying an item.
 *
 * Uses a deterministic gradient background derived from the item title hash
 * and overlays the collection icon as a placeholder until the Assets system
 * is implemented (Phase 4B).
 */
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ItemCardProps {
    id: number;
    title: string;
    createdAt: number;
    updatedAt: number;
    collectionIcon?: string;
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

function ItemCard({
    id,
    title,
    createdAt,
    updatedAt,
    collectionIcon,
    onClick,
    onDelete,
}: ItemCardProps) {
    return (
        <div
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
            onClick={onClick}
        >
            {/* Cover area — gradient + icon placeholder */}
            <div
                className="relative flex h-36 items-center justify-center overflow-hidden"
                style={{ background: titleToGradient(title) }}
            >
                {/* Collection icon overlay */}
                <span className="text-4xl opacity-30 transition-opacity group-hover:opacity-50">
                    {collectionIcon || "📄"}
                </span>

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
