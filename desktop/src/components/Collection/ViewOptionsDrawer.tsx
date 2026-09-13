/**
 * ViewOptionsDrawer — Drawer (Sheet) for per-collection view mode, custom card dimensions (width/height),
 * information display controls, and sorting options.
 */
import {
    ArrowDownAZ,
    Calendar,
    CalendarClock,
    Check,
    Film,
    Image,
    LayoutGrid,
    List,
    Maximize2,
    RotateCcw,
    SlidersHorizontal,
    Sparkles,
} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/components/Item/ViewModeToggle";
import type { SortField, SortOrder } from "@/core/types/common";
import type { CardAspectPreset } from "@/core/hooks/useCollectionViewPrefs";

interface ViewOptionsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    cardSize: "SMALL" | "MEDIUM" | "LARGE";
    onCardSizeChange: (size: "SMALL" | "MEDIUM" | "LARGE") => void;
    cardWidth: number;
    onCardWidthChange: (w: number) => void;
    cardHeight: number;
    onCardHeightChange: (h: number) => void;
    aspectPreset: CardAspectPreset;
    onAspectPresetChange: (preset: CardAspectPreset) => void;
    showTitleOnCard: boolean;
    onShowTitleOnCardChange: (show: boolean) => void;
    showPropertiesOnCard: boolean;
    onShowPropertiesOnCardChange: (show: boolean) => void;
    showDateOnCard: boolean;
    onShowDateOnCardChange: (show: boolean) => void;
    sortField: SortField;
    sortOrder: SortOrder;
    onSortChange: (field: SortField, order: SortOrder) => void;
    onResetDefaults?: () => void;
}

const ASPECT_PRESETS: { value: CardAspectPreset; label: string; ratio: string }[] = [
    { value: "poster", label: "Poster", ratio: "2:3" },
    { value: "book", label: "Book", ratio: "3:4" },
    { value: "square", label: "Square", ratio: "1:1" },
    { value: "landscape", label: "Landscape", ratio: "16:10" },
    { value: "video", label: "Video", ratio: "16:9" },
    { value: "custom", label: "Custom", ratio: "Free" },
];

const SORT_FIELD_OPTIONS: { field: SortField; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { field: "title", label: "Title", icon: ArrowDownAZ },
    { field: "created_at", label: "Date created", icon: Calendar },
    { field: "updated_at", label: "Last updated", icon: CalendarClock },
];

export function ViewOptionsDrawer({
    open,
    onOpenChange,
    viewMode,
    onViewModeChange,
    cardSize,
    onCardSizeChange,
    cardWidth,
    onCardWidthChange,
    cardHeight,
    onCardHeightChange,
    aspectPreset,
    onAspectPresetChange,
    showTitleOnCard,
    onShowTitleOnCardChange,
    showPropertiesOnCard,
    onShowPropertiesOnCardChange,
    showDateOnCard,
    onShowDateOnCardChange,
    sortField,
    sortOrder,
    onSortChange,
    onResetDefaults,
}: ViewOptionsDrawerProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-md overflow-hidden">
                <SheetHeader className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <SlidersHorizontal className="size-4" />
                        </div>
                        <div>
                            <SheetTitle className="text-base font-semibold">View & Display Options</SheetTitle>
                            <SheetDescription className="text-xs">
                                Customize layout mode, card dimensions, metadata display, and sorting.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* ═══ 1. VIEW MODE ═══ */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Layout mode
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => onViewModeChange("list")}
                                className={cn(
                                    "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all cursor-pointer",
                                    viewMode === "list"
                                        ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/30 text-muted-foreground",
                                )}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <div className={cn(
                                        "flex size-8 items-center justify-center rounded-lg",
                                        viewMode === "list" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        <List className="size-4" />
                                    </div>
                                    {viewMode === "list" && <Check className="size-4 text-primary" />}
                                </div>
                                <div>
                                    <div className={cn("text-xs font-semibold", viewMode === "list" ? "text-foreground" : "")}>
                                        List view
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                        Tabular view with full details
                                    </p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => onViewModeChange("grid")}
                                className={cn(
                                    "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all cursor-pointer",
                                    viewMode === "grid"
                                        ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/30 text-muted-foreground",
                                )}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <div className={cn(
                                        "flex size-8 items-center justify-center rounded-lg",
                                        viewMode === "grid" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                    )}>
                                        <LayoutGrid className="size-4" />
                                    </div>
                                    {viewMode === "grid" && <Check className="size-4 text-primary" />}
                                </div>
                                <div>
                                    <div className={cn("text-xs font-semibold", viewMode === "grid" ? "text-foreground" : "")}>
                                        Grid view
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                        Visual cards with cover art
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* ═══ 2. GRID CUSTOMIZATION (visible when grid mode) ═══ */}
                    {viewMode === "grid" && (
                        <div className="space-y-5 rounded-xl border border-border/80 bg-muted/20 p-4 animate-fade-in-up">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Card Dimensions & Ratio
                                </Label>
                                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 bg-background/50">
                                    {cardWidth} × {cardHeight} px
                                </Badge>
                            </div>

                            {/* Aspect ratio presets */}
                            <div className="space-y-1.5">
                                <span className="text-xs font-medium text-foreground">Aspect ratio</span>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {ASPECT_PRESETS.map((p) => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => onAspectPresetChange(p.value)}
                                            className={cn(
                                                "flex flex-col items-center justify-center rounded-lg border py-2 px-1.5 text-center transition-all cursor-pointer",
                                                aspectPreset === p.value
                                                    ? "border-primary bg-primary/10 text-primary font-medium shadow-xs"
                                                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                            )}
                                        >
                                            <span className="text-xs font-medium">{p.label}</span>
                                            <span className="text-[10px] text-muted-foreground opacity-80">{p.ratio}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Width Slider */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-foreground">Card width</span>
                                    <span className="font-mono text-muted-foreground">{cardWidth} px</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={130}
                                        max={400}
                                        step={5}
                                        value={cardWidth}
                                        onChange={(e) => onCardWidthChange(Number(e.target.value))}
                                        className="flex-1 accent-primary cursor-pointer h-1.5 bg-border rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        min={130}
                                        max={400}
                                        value={cardWidth}
                                        onChange={(e) => onCardWidthChange(Math.max(130, Math.min(400, Number(e.target.value))))}
                                        className="w-16 rounded-md border border-input bg-background px-2 py-1 text-center font-mono text-xs"
                                    />
                                </div>
                            </div>

                            {/* Custom Height Slider */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium text-foreground">Cover height</span>
                                    <span className="font-mono text-muted-foreground">{cardHeight} px</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={120}
                                        max={550}
                                        step={5}
                                        value={cardHeight}
                                        onChange={(e) => onCardHeightChange(Number(e.target.value))}
                                        className="flex-1 accent-primary cursor-pointer h-1.5 bg-border rounded-lg"
                                    />
                                    <input
                                        type="number"
                                        min={120}
                                        max={550}
                                        value={cardHeight}
                                        onChange={(e) => onCardHeightChange(Math.max(120, Math.min(550, Number(e.target.value))))}
                                        className="w-16 rounded-md border border-input bg-background px-2 py-1 text-center font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <Separator className="bg-border/60" />

                            {/* ═══ INFORMATION DISPLAY ON CARD ═══ */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Information on Card
                                </Label>

                                {/* Show Title */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 pr-2">
                                        <Label htmlFor="show-title-card" className="text-xs font-medium text-foreground cursor-pointer">
                                            Show Title
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            Display title section below cover
                                        </p>
                                    </div>
                                    <Switch
                                        id="show-title-card"
                                        checked={showTitleOnCard}
                                        onCheckedChange={onShowTitleOnCardChange}
                                    />
                                </div>

                                {/* Show Metadata Attributes */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 pr-2">
                                        <Label htmlFor="show-props-card" className="text-xs font-medium text-foreground cursor-pointer">
                                            Show Metadata & Tags
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            Show custom fields like rating, genre, tags on cards
                                        </p>
                                    </div>
                                    <Switch
                                        id="show-props-card"
                                        checked={showPropertiesOnCard}
                                        onCheckedChange={onShowPropertiesOnCardChange}
                                    />
                                </div>

                                {/* Show Date */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 pr-2">
                                        <Label htmlFor="show-date-card" className="text-xs font-medium text-foreground cursor-pointer">
                                            Show Date
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            Display last updated date timestamp
                                        </p>
                                    </div>
                                    <Switch
                                        id="show-date-card"
                                        checked={showDateOnCard}
                                        onCheckedChange={onShowDateOnCardChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* ═══ 3. SORTING ═══ */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Sort by
                        </Label>

                        <div className="space-y-1.5">
                            {SORT_FIELD_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isSelected = sortField === option.field;
                                return (
                                    <button
                                        key={option.field}
                                        type="button"
                                        onClick={() => onSortChange(option.field, sortOrder)}
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-xs transition-all cursor-pointer",
                                            isSelected
                                                ? "border-primary/50 bg-primary/5 font-medium text-foreground"
                                                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon className={cn("size-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                                            <span>{option.label}</span>
                                        </div>
                                        {isSelected && <Check className="size-4 text-primary" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Sort Direction */}
                        <div className="pt-2 space-y-2">
                            <span className="text-xs font-medium text-foreground">Sort order</span>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => onSortChange(sortField, "ASC")}
                                    className={cn(
                                        "flex items-center justify-center gap-2 rounded-lg border py-2 px-3 text-xs transition-all cursor-pointer",
                                        sortOrder === "ASC"
                                            ? "border-primary bg-primary/10 text-primary font-medium shadow-xs"
                                            : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    )}
                                >
                                    <Sparkles className="size-3.5" />
                                    <span>Ascending</span>
                                    <span className="text-[10px] text-muted-foreground">(A→Z, Oldest)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSortChange(sortField, "DESC")}
                                    className={cn(
                                        "flex items-center justify-center gap-2 rounded-lg border py-2 px-3 text-xs transition-all cursor-pointer",
                                        sortOrder === "DESC"
                                            ? "border-primary bg-primary/10 text-primary font-medium shadow-xs"
                                            : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    )}
                                >
                                    <Sparkles className="size-3.5" />
                                    <span>Descending</span>
                                    <span className="text-[10px] text-muted-foreground">(Z→A, Newest)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-4 bg-muted/20 border-t border-border/50">
                    <div className="flex w-full items-center justify-between">
                        {onResetDefaults ? (
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={onResetDefaults}
                                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="size-3" />
                                Reset to defaults
                            </Button>
                        ) : <div />}
                        <Button size="sm" onClick={() => onOpenChange(false)}>
                            Done
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default ViewOptionsDrawer;
