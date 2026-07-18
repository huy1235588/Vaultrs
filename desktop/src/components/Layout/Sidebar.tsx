/**
 * Sidebar — Navigation sidebar showing the collection list and management controls.
 */
import { useState } from "react";
import {
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    Database,
    Settings,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CreateCollectionDialog } from "@/components/Collection/CreateCollectionDialog";
import { EditCollectionDialog } from "@/components/Collection/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/Collection/DeleteCollectionDialog";
import { AttributeManager } from "@/components/Attribute/AttributeManager";
import type { Collection } from "@/core/types/common";

function Sidebar() {
    const { collections, selectedCollection, selectCollection, loading } =
        useCollections();

    const [collapsed, setCollapsed] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Collection | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
    const [attrManagerOpen, setAttrManagerOpen] = useState(false);

    return (
        <TooltipProvider delayDuration={300}>
            <aside
                className={cn(
                    "flex flex-col overflow-hidden border-r border-border bg-card transition-[width] duration-200 ease-in-out",
                    collapsed ? "w-16" : "w-64",
                )}
            >
                {/* Logo / window drag region */}
                <div
                    data-tauri-drag-region
                    className="flex h-14 shrink-0 select-none items-center gap-2 border-b border-border px-4"
                >
                    <img
                        className="h-8 shrink-0"
                        src="/logo-1.png"
                        alt="Vaultrs"
                        loading="eager"
                    />
                </div>

                {/* Collection list */}
                <ScrollArea className="flex-1">
                    <nav className="flex flex-col gap-2 p-3">
                        <div
                            className={cn(
                                "flex items-center px-2",
                                collapsed ? "justify-center" : "justify-between",
                            )}
                        >
                            {!collapsed && (
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Collections
                                </p>
                            )}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        aria-label="New collection"
                                        onClick={() => setCreateOpen(true)}
                                    >
                                        <Plus className="size-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">New collection</TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="space-y-0.5">
                            {loading ? (
                                <div className="space-y-1.5 px-2">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-9 w-full rounded-md" />
                                    ))}
                                </div>
                            ) : collections.length === 0 ? (
                                collapsed ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => setCreateOpen(true)}
                                                aria-label="Create your first collection"
                                                className="mx-auto flex size-9 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                                            >
                                                <Database className="size-4 opacity-50" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            Create your first collection
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setCreateOpen(true)}
                                        className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                                    >
                                        <Database className="size-4 opacity-50" />
                                        <span>Create your first collection</span>
                                    </button>
                                )
                            ) : (
                                collections.map((collection) => {
                                    const isActive = selectedCollection?.id === collection.id;

                                    const row = (
                                        <div className="group relative">
                                            {/* Active accent bar */}
                                            <span
                                                className={cn(
                                                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-opacity",
                                                    isActive ? "opacity-100" : "opacity-0",
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => selectCollection(collection.id)}
                                                className={cn(
                                                    "flex w-full items-center gap-2.5 rounded-md py-2 text-sm font-medium transition-colors duration-150",
                                                    collapsed ? "justify-center px-0" : "px-3",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                                )}
                                            >
                                                <span className="shrink-0 text-base leading-none">
                                                    {collection.icon || "📁"}
                                                </span>
                                                {!collapsed && (
                                                    <span className="truncate">{collection.name}</span>
                                                )}
                                            </button>

                                            {!collapsed && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            aria-label={`More actions for ${collection.name}`}
                                                            className="absolute top-1/2 right-1.5 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="size-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem
                                                            onClick={() => setEditTarget(collection)}
                                                        >
                                                            <Pencil className="size-3.5" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                selectCollection(collection.id);
                                                                setAttrManagerOpen(true);
                                                            }}
                                                        >
                                                            <Settings className="size-3.5" />
                                                            Manage fields
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                            onClick={() => setDeleteTarget(collection)}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    );

                                    return collapsed ? (
                                        <Tooltip key={collection.id}>
                                            <TooltipTrigger asChild>{row}</TooltipTrigger>
                                            <TooltipContent side="right">
                                                {collection.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        <div key={collection.id}>{row}</div>
                                    );
                                })
                            )}
                        </div>
                    </nav>
                </ScrollArea>

                {/* Collapse toggle */}
                <div className="shrink-0 border-t border-border p-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                                className="w-full justify-center"
                                onClick={() => setCollapsed((c) => !c)}
                            >
                                {collapsed ? (
                                    <PanelLeftOpen className="size-4" />
                                ) : (
                                    <PanelLeftClose className="size-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Dialogs */}
                <CreateCollectionDialog open={createOpen} onOpenChange={setCreateOpen} />

                {editTarget && (
                    <EditCollectionDialog
                        collection={editTarget}
                        open={!!editTarget}
                        onOpenChange={(open) => !open && setEditTarget(null)}
                    />
                )}

                {deleteTarget && (
                    <DeleteCollectionDialog
                        collection={deleteTarget}
                        open={!!deleteTarget}
                        onOpenChange={(open) => !open && setDeleteTarget(null)}
                    />
                )}

                {/* Attribute Manager */}
                {selectedCollection && (
                    <AttributeManager
                        open={attrManagerOpen}
                        onOpenChange={setAttrManagerOpen}
                    />
                )}
            </aside>
        </TooltipProvider>
    );
}

export default Sidebar;
