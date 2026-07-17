/**
 * Header — Top bar showing current context, search, and action buttons.
 */
import { useState } from "react";
import { Plus, Search, Settings, ChevronRight } from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { useItem } from "@/core/context/ItemContext";
import { Button } from "@/components/ui/button";
import { AttributeManager } from "@/components/Attribute/AttributeManager";

interface HeaderProps {
    /** Called when user clicks the "Add Item" button. */
    onAddItem?: () => void;
}

function Header({ onAddItem }: HeaderProps) {
    const { selectedCollection } = useCollections();
    const { selectedItem, clearItem } = useItem();
    const [attrManagerOpen, setAttrManagerOpen] = useState(false);

    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
            {/* Left — Breadcrumb / Title */}
            <div className="flex items-center gap-2">
                {selectedCollection ? (
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <button
                            type="button"
                            onClick={clearItem}
                            className="flex items-center gap-1.5 hover:text-primary transition-colors text-foreground"
                        >
                            <span className="text-base leading-none">
                                {selectedCollection.icon || "📁"}
                            </span>
                            <span>{selectedCollection.name}</span>
                        </button>

                        {selectedItem && (
                            <>
                                <ChevronRight className="size-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground font-medium truncate max-w-[200px]">
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
            <div className="flex items-center gap-2">
                {/* Search (placeholder UI) */}
                <div className="relative hidden sm:block">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="h-8 w-48 rounded-md border border-input bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:w-64 focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                    />
                </div>

                {/* Manage Fields Button (Settings) */}
                {selectedCollection && !selectedItem && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setAttrManagerOpen(true)}
                        title="Manage Custom Fields"
                    >
                        <Settings className="size-4" />
                        Manage Fields
                    </Button>
                )}

                {/* Add Item */}
                {selectedCollection && onAddItem && (
                    <Button size="sm" onClick={onAddItem}>
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

