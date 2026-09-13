/**
 * CollectionPage — Displays the items within the selected collection
 * with List/Grid view modes and sort controls managed via ViewOptionsDrawer.
 */
import { useEffect, useRef, useState } from "react";
import {
    Filter,
    MoreHorizontal,
    Pencil,
    Search,
    Settings2,
    SlidersHorizontal,
    Trash2,
    X,
} from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { useCollectionSettings } from "@/core/hooks/useCollectionSettings";
import { useCollectionViewPrefs } from "@/core/hooks/useCollectionViewPrefs";
import { useDebounce } from "@/core/hooks/useDebounce";
import ItemTable from "@/components/Item/ItemTable";
import { ItemGrid } from "@/components/Item/ItemGrid";
import { CreateItemDialog } from "@/components/Item/CreateItemDialog";
import { DeleteCollectionDialog } from "@/components/Collection/DeleteCollectionDialog";
import { ViewOptionsDrawer } from "@/components/Collection/ViewOptionsDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SortField, SortOrder } from "@/core/types/common";

interface CollectionPageProps {
    /**
     * Mutable ref that the parent (App) can use to trigger opening
     * the "Create Item" dialog from the header button.
     */
    onAddItemRef?: React.MutableRefObject<(() => void) | null>;
    /** Optional ref for backwards compatibility. */
    onOpenSettingsRef?: React.MutableRefObject<(() => void) | null>;
}

function CollectionPage({ onAddItemRef, onOpenSettingsRef }: CollectionPageProps) {
    const { selectedCollection, setActiveSubView } = useCollections();
    const [createItemOpen, setCreateItemOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [viewOptionsOpen, setViewOptionsOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // --- Collection Settings ---
    const { settings } = useCollectionSettings(selectedCollection?.id);

    // --- Per-collection view preferences (viewMode, sortField, sortOrder, cardWidth, cardHeight, info display) ---
    const {
        viewMode, setViewMode,
        sortField, setSortField,
        sortOrder, setSortOrder,
        cardSize, setCardSize,
        cardWidth, setCardWidth,
        cardHeight, setCardHeight,
        aspectPreset, setAspectPreset,
        showTitleOnCard, setShowTitleOnCard,
        showPropertiesOnCard, setShowPropertiesOnCard,
        showDateOnCard, setShowDateOnCard,
        resetDefaults,
    } = useCollectionViewPrefs(selectedCollection?.id, settings);

    // --- Filter State ---
    const [filterInput, setFilterInput] = useState("");
    const debouncedFilter = useDebounce(filterInput, 300);

    // Track filtered total from child component
    const [filteredTotal, setFilteredTotal] = useState<number | undefined>(
        undefined,
    );

    // Clear filter input when switching collections
    const prevCollectionIdRef = useRef<number | undefined>(undefined);
    useEffect(() => {
        if (!selectedCollection) return;
        if (prevCollectionIdRef.current === selectedCollection.id) return;
        prevCollectionIdRef.current = selectedCollection.id;
        setFilterInput("");
    }, [selectedCollection]);

    // Expose the open-dialog function to the parent via ref
    useEffect(() => {
        if (onAddItemRef) {
            onAddItemRef.current = () => setCreateItemOpen(true);
            return () => {
                onAddItemRef.current = null;
            };
        }
    }, [onAddItemRef]);

    // Backwards compatibility for settings opener
    useEffect(() => {
        if (onOpenSettingsRef) {
            onOpenSettingsRef.current = () => setActiveSubView("settings");
            return () => {
                onOpenSettingsRef.current = null;
            };
        }
    }, [onOpenSettingsRef, setActiveSubView]);

    const handleSortChange = (field: SortField, order: SortOrder) => {
        setSortField(field);
        setSortOrder(order);
    };

    // Safety check — this page should only render when a collection is selected
    if (!selectedCollection) return null;

    const hasFilter = filterInput.trim().length > 0;

    return (
        <div className="flex h-full flex-col animate-fade-in-up">
            {/* ═══ Collection info header ═══ */}
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-border/50 pb-5">
                <div className="flex items-center gap-3.5">
                    <div className="relative">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-br from-muted/60 to-muted/20 text-2xl leading-none shadow-sm">
                            {selectedCollection.icon || "📁"}
                        </span>
                        {/* Gradient accent dot */}
                        <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/60 to-orange-400/60" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            {selectedCollection.name}
                        </h1>
                        {selectedCollection.description && (
                            <p className="mt-0.5 text-sm text-muted-foreground/80">
                                {selectedCollection.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Options Drawer trigger button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs font-medium cursor-pointer"
                        onClick={() => setViewOptionsOpen(true)}
                        title="Display & Sorting Options"
                    >
                        <SlidersHorizontal className="size-3.5 text-primary" />
                        <span className="hidden sm:inline">Display</span>
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase font-mono font-medium">
                            {viewMode}
                        </Badge>
                    </Button>

                    {/* Dropdown Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Collection options"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setActiveSubView("settings")}>
                                <Settings2 className="size-4" />
                                Collection settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActiveSubView("fields")}>
                                <Pencil className="size-4" />
                                Manage fields
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash2 className="size-4" />
                                Delete collection
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* ═══ Filter & Quick Search Bar ═══ */}
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Filter items by title..."
                            value={filterInput}
                            onChange={(e) => setFilterInput(e.target.value)}
                            className="h-8 pl-8 pr-8 text-xs transition-all duration-200 bg-muted/20 focus-visible:bg-background"
                        />
                        {hasFilter && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2"
                                        onClick={() => setFilterInput("")}
                                    >
                                        <X className="size-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Clear filter</TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    {hasFilter && filteredTotal !== undefined && (
                        <Badge
                            variant="secondary"
                            className="animate-scale-in gap-1 text-[10px] font-medium shrink-0"
                        >
                            <Filter className="size-3" />
                            {filteredTotal.toLocaleString()} results
                        </Badge>
                    )}
                </div>

                <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2">
                    <span className="capitalize">
                        Sorted by <strong className="text-foreground font-medium">{sortField.replace("_", " ")}</strong> ({sortOrder === "ASC" ? "Ascending" : "Descending"})
                    </span>
                </div>
            </div>

            {/* ═══ Item View — List or Grid ═══ */}
            <div className="flex-1">
                {viewMode === "grid" ? (
                    <ItemGrid
                        collectionId={selectedCollection.id}
                        refreshKey={refreshKey}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        filterTitle={debouncedFilter}
                        showTitleOnCard={showTitleOnCard}
                        showPropertiesOnCard={showPropertiesOnCard}
                        showDateOnCard={showDateOnCard}
                        cardWidth={cardWidth}
                        cardHeight={cardHeight}
                        cardSize={cardSize}
                        onTotalChange={setFilteredTotal}
                    />
                ) : (
                    <ItemTable
                        collectionId={selectedCollection.id}
                        refreshKey={refreshKey}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        filterTitle={debouncedFilter}
                        onSortChange={handleSortChange}
                        onTotalChange={setFilteredTotal}
                    />
                )}
            </div>

            {/* ═══ Create item dialog ═══ */}
            <CreateItemDialog
                collectionId={selectedCollection.id}
                collectionName={selectedCollection.name}
                open={createItemOpen}
                onOpenChange={setCreateItemOpen}
                onCreated={() => setRefreshKey((k) => k + 1)}
            />

            {/* ═══ Delete collection dialog ═══ */}
            <DeleteCollectionDialog
                collection={selectedCollection}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />

            {/* ═══ View & Sort Options Drawer ═══ */}
            <ViewOptionsDrawer
                open={viewOptionsOpen}
                onOpenChange={setViewOptionsOpen}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                cardSize={cardSize}
                onCardSizeChange={setCardSize}
                cardWidth={cardWidth}
                onCardWidthChange={setCardWidth}
                cardHeight={cardHeight}
                onCardHeightChange={setCardHeight}
                aspectPreset={aspectPreset}
                onAspectPresetChange={setAspectPreset}
                showTitleOnCard={showTitleOnCard}
                onShowTitleOnCardChange={setShowTitleOnCard}
                showPropertiesOnCard={showPropertiesOnCard}
                onShowPropertiesOnCardChange={setShowPropertiesOnCard}
                showDateOnCard={showDateOnCard}
                onShowDateOnCardChange={setShowDateOnCard}
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                onResetDefaults={resetDefaults}
            />
        </div>
    );
}

export { CollectionPage };
export default CollectionPage;
