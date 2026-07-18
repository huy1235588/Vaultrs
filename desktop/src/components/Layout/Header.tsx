/**
 * Header — Top bar showing current context, search, and action buttons.
 */
import { useEffect, useRef, useState } from "react";
import { Plus, Search, Settings, ChevronRight } from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { useItem } from "@/core/context/ItemContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AttributeManager } from "@/components/Attribute/AttributeManager";

interface HeaderProps {
    /** Called when user clicks the "Add Item" button. */
    onAddItem?: () => void;
    /** Called with the query string as the user types in search. */
    onSearch?: (query: string) => void;
}

const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");

function Header({ onAddItem, onSearch }: HeaderProps) {
    const { selectedCollection } = useCollections();
    const { selectedItem, clearItem } = useItem();
    const [attrManagerOpen, setAttrManagerOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    // ⌘K / Ctrl+K jumps to search, matching the shortcut most desktop apps use.
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchRef.current?.focus();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const showManageFields = Boolean(selectedCollection && !selectedItem);
    const showAddItem = Boolean(selectedCollection && onAddItem);
    const hasActions = showManageFields || showAddItem;

    return (
        <header
            data-tauri-drag-region
            className="flex h-14 shrink-0 select-none items-center justify-between border-b border-border bg-card px-6"
        >
            {/* Left — Breadcrumb / Title */}
            <div className="flex min-w-0 items-center gap-2">
                {selectedCollection ? (
                    <div className="flex min-w-0 items-center gap-1.5 text-[15px] font-semibold tracking-tight">
                        <button
                            type="button"
                            onClick={clearItem}
                            aria-label={selectedItem ? "Back to collection" : undefined}
                            className="flex shrink-0 items-center gap-1.5 text-foreground transition-colors hover:text-primary"
                        >
                            <span className="text-base leading-none">
                                {selectedCollection.icon || "📁"}
                            </span>
                            <span>{selectedCollection.name}</span>
                        </button>

                        {selectedItem && (
                            <>
                                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate font-medium text-muted-foreground">
                                    {selectedItem.title}
                                </span>
                            </>
                        )}
                    </div>
                ) : (
                    <h2 className="text-sm font-medium text-muted-foreground">
                        Welcome
                    </h2>
                )}
            </div>

            {/* Right — Actions */}
            <div className="flex shrink-0 items-center gap-3">
                {/* Search */}
                <div className="relative hidden sm:block">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={searchRef}
                        type="text"
                        placeholder="Search..."
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        onChange={(e) => onSearch?.(e.target.value)}
                        className="h-8 w-48 bg-background pl-8 pr-12 text-sm transition-all focus-visible:w-64"
                    />
                    {!searchFocused && (
                        <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 select-none rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {isMac ? "⌘K" : "Ctrl+K"}
                        </kbd>
                    )}
                </div>

                {hasActions && <Separator orientation="vertical" className="h-5" />}

                {/* Manage Fields Button (Settings) */}
                {showManageFields && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setAttrManagerOpen(true)}
                        title="Manage Custom Fields"
                    >
                        <Settings className="size-4" />
                        Manage Fields
                    </Button>
                )}

                {/* Add Item */}
                {showAddItem && (
                    <Button size="sm" className="gap-1.5" onClick={onAddItem}>
                        <Plus className="size-4" />
                        Add Item
                    </Button>
                )}
            </div>

            {/* Attribute Manager Modal */}
            {selectedCollection && (
                <AttributeManager
                    open={attrManagerOpen}
                    onOpenChange={setAttrManagerOpen}
                />
            )}
        </header>
    );
}

export default Header;
