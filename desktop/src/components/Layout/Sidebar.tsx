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
import { DeleteCollectionDialog } from "@/components/Collection/DeleteCollectionDialog";
import type { Collection } from "@/core/types/common";

interface SidebarProps {
    /** Called when user clicks "Collection settings" in a collection's dropdown. */
    onOpenSettings?: () => void;
}

function Sidebar({ onOpenSettings }: SidebarProps) {
    const { collections, selectedCollection, selectCollection, setActiveSubView, loading } =
        useCollections();

    const [collapsed, setCollapsed] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);

    return (
        <TooltipProvider delayDuration={300}>
            <aside
                className={cn(
                    "relative flex flex-col overflow-hidden border-r border-border bg-gradient-to-b from-card via-card to-card/80 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    collapsed ? "w-16" : "w-64",
                )}
            >
                {/* Subtle noise overlay for premium feel */}
                <div className="noise-overlay pointer-events-none absolute inset-0" aria-hidden />

                {/* Logo / window drag region */}
                <div
                    data-tauri-drag-region
                    className="relative z-10 flex h-14 shrink-0 select-none items-center gap-2 border-b border-border/60 px-4"
                >
                    <img
                        className={cn(
                            "shrink-0 transition-all duration-300",
                            collapsed ? "h-7" : "h-8",
                        )}
                        src={`${collapsed ? `/logo-2.png` : `/logo-1.png`}`}
                        alt="Vaultrs"
                        loading="eager"
                    />
                </div>

                {/* Collection list */}
                <ScrollArea className="relative z-10 flex-1">
                    <nav className="flex flex-col gap-2 p-3">
                        <div
                            className={cn(
                                "flex items-center px-2",
                                collapsed ? "justify-center" : "justify-between",
                            )}
                        >
                            {!collapsed && (
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                                        className="text-muted-foreground hover:text-primary transition-colors"
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
                                        <div key={i} className="h-9 w-full rounded-md bg-muted/30 animate-shimmer" />
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
                                                className="mx-auto flex size-9 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:text-foreground hover:scale-105"
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
                                        className="group flex w-full items-center gap-2 rounded-lg border border-dashed border-border/60 px-3 py-4 text-sm text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                                    >
                                        <Database className="size-4 opacity-50 transition-transform duration-200 group-hover:scale-110" />
                                        <span>Create your first collection</span>
                                    </button>
                                )
                            ) : (
                                collections.map((collection) => {
                                    const isActive = selectedCollection?.id === collection.id;

                                    const row = (
                                        <div className="group relative">
                                            {/* Active accent bar — glowing */}
                                            <span
                                                className={cn(
                                                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-all duration-300",
                                                    isActive
                                                        ? "opacity-100 shadow-[0_0_8px_oklch(0.646_0.222_41.116/0.4)]"
                                                        : "opacity-0 scale-y-0",
                                                )}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => selectCollection(collection.id)}
                                                className={cn(
                                                    "flex w-full items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                                                    collapsed ? "justify-center px-0" : "px-3",
                                                    isActive
                                                        ? "bg-primary/10 text-primary shadow-sm"
                                                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                                                )}
                                            >
                                                <span className={cn(
                                                    "shrink-0 text-base leading-none transition-transform duration-200",
                                                    isActive && "scale-110",
                                                )}>
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
                                                            className="absolute top-1/2 right-1.5 -translate-y-1/2 opacity-0 transition-all duration-150 group-hover:opacity-100 data-[state=open]:opacity-100"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="size-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                selectCollection(collection.id, "settings");
                                                            }}
                                                        >
                                                            <Settings className="size-3.5" />
                                                            Collection settings
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                selectCollection(collection.id, "fields");
                                                            }}
                                                        >
                                                            <Pencil className="size-3.5" />
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

                {/* Collapse toggle — cleaner footer */}
                <div className="relative z-10 shrink-0 border-t border-border/60 p-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                                className="w-full justify-center text-muted-foreground hover:text-foreground transition-colors"
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

                {deleteTarget && (
                    <DeleteCollectionDialog
                        collection={deleteTarget}
                        open={!!deleteTarget}
                        onOpenChange={(open) => !open && setDeleteTarget(null)}
                    />
                )}
            </aside>
        </TooltipProvider>
    );
}

export default Sidebar;
