/**
 * CollectionPage — Displays the items within the selected collection
 * with toggleable List/Grid view modes, sort/filter controls,
 * and per-collection settings integration.
 */
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Settings2, Trash2 } from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { useCollectionSettings } from "@/core/hooks/useCollectionSettings";
import { useLocalStorage } from "@/core/hooks/useLocalStorage";
import { useDebounce } from "@/core/hooks/useDebounce";
import ItemTable from "@/components/Item/ItemTable";
import { ItemGrid } from "@/components/Item/ItemGrid";
import { ViewModeToggle } from "@/components/Item/ViewModeToggle";
import type { ViewMode } from "@/components/Item/ViewModeToggle";
import { SortFilterBar } from "@/components/Item/SortFilterBar";
import { CreateItemDialog } from "@/components/Item/CreateItemDialog";
import { EditCollectionDialog } from "@/components/Collection/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/Collection/DeleteCollectionDialog";
import { CollectionSettingsDialog } from "@/components/Collection/CollectionSettingsDialog";
import { Button } from "@/components/ui/button";
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
    /** Ref to open settings dialog from external triggers (e.g., Sidebar). */
    onOpenSettingsRef?: React.MutableRefObject<(() => void) | null>;
}

function CollectionPage({ onAddItemRef, onOpenSettingsRef }: CollectionPageProps) {
    const { selectedCollection } = useCollections();
    const [createItemOpen, setCreateItemOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
        "vaultrs-view-mode",
        "list",
    );

    // --- Sort & Filter State ---
    const [sortField, setSortField] = useLocalStorage<SortField>(
        "vaultrs-sort-field",
        "created_at",
    );
    const [sortOrder, setSortOrder] = useLocalStorage<SortOrder>(
        "vaultrs-sort-order",
        "DESC",
    );
    const [filterInput, setFilterInput] = useState("");
    // Debounce filter input to avoid excessive API calls
    const debouncedFilter = useDebounce(filterInput, 300);

    // Track filtered total from child component
    const [filteredTotal, setFilteredTotal] = useState<number | undefined>(
        undefined,
    );

    // --- Collection Settings ---
    const { settings } = useCollectionSettings(selectedCollection?.id);

    // Track the last collection ID to detect switches
    const prevCollectionIdRef = useRef<number | undefined>(undefined);

    // Apply per-collection settings when switching collections
    useEffect(() => {
        if (!selectedCollection) return;
        if (prevCollectionIdRef.current === selectedCollection.id) return;

        prevCollectionIdRef.current = selectedCollection.id;
        setFilterInput("");

        if (settings) {
            // Apply per-collection view mode override
            const settingsViewMode =
                settings.appearance.default_view_mode === "GRID"
                    ? "grid"
                    : "list";
            setViewMode(settingsViewMode);

            // Apply per-collection sort defaults
            const field = settings.behavior.default_sort_field as SortField;
            const order = settings.behavior.default_sort_order as SortOrder;
            if (["title", "created_at", "updated_at"].includes(field)) {
                setSortField(field);
            }
            if (order === "ASC" || order === "DESC") {
                setSortOrder(order);
            }
        }
    }, [selectedCollection?.id, settings]); // eslint-disable-line react-hooks/exhaustive-deps

    // Derive showTitleOnCard from settings
    const showTitleOnCard = settings?.appearance.show_title_on_card ?? true;

    // Expose the open-dialog function to the parent via ref
    useEffect(() => {
        if (onAddItemRef) {
            onAddItemRef.current = () => setCreateItemOpen(true);
            return () => {
                onAddItemRef.current = null;
            };
        }
    }, [onAddItemRef]);

    // Expose settings dialog opener to parent (Sidebar can trigger this)
    useEffect(() => {
        if (onOpenSettingsRef) {
            onOpenSettingsRef.current = () => setSettingsOpen(true);
            return () => {
                onOpenSettingsRef.current = null;
            };
        }
    }, [onOpenSettingsRef]);

    const handleSortChange = (field: SortField, order: SortOrder) => {
        setSortField(field);
        setSortOrder(order);
    };

    // Safety check — this page should only render when a collection is selected
    if (!selectedCollection) return null;

    return (
        <div className="flex h-full flex-col">
            {/* Collection info header */}
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-2xl leading-none">
                        {selectedCollection.icon || "📁"}
                    </span>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            {selectedCollection.name}
                        </h1>
                        {selectedCollection.description && (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {selectedCollection.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <ViewModeToggle value={viewMode} onChange={setViewMode} />

                    {/* Collection Settings */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Collection settings"
                                onClick={() => setSettingsOpen(true)}
                            >
                                <Settings2 className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Collection settings</TooltipContent>
                    </Tooltip>

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
                            <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                <Pencil className="size-4" />
                                Edit collection
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setSettingsOpen(true)}
                            >
                                <Settings2 className="size-4" />
                                Collection settings
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

            {/* Sort & Filter Bar */}
            <div className="mb-3">
                <SortFilterBar
                    sortField={sortField}
                    sortOrder={sortOrder}
                    filterTitle={filterInput}
                    filteredTotal={filteredTotal}
                    onSortChange={handleSortChange}
                    onFilterChange={setFilterInput}
                />
            </div>

            {/* Item view — List or Grid */}
            <div className="flex-1">
                {viewMode === "grid" ? (
                    <ItemGrid
                        collectionId={selectedCollection.id}
                        refreshKey={refreshKey}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        filterTitle={debouncedFilter}
                        showTitleOnCard={showTitleOnCard}
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

            {/* Create item dialog */}
            <CreateItemDialog
                collectionId={selectedCollection.id}
                collectionName={selectedCollection.name}
                open={createItemOpen}
                onOpenChange={setCreateItemOpen}
                onCreated={() => setRefreshKey((k) => k + 1)}
            />

            {/* Edit / delete collection dialogs */}
            <EditCollectionDialog
                collection={selectedCollection}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
            <DeleteCollectionDialog
                collection={selectedCollection}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />

            {/* Collection Settings dialog */}
            <CollectionSettingsDialog
                collectionId={selectedCollection.id}
                collectionName={selectedCollection.name}
                collectionIcon={selectedCollection.icon}
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
        </div>
    );
}

export { CollectionPage };
export default CollectionPage;
