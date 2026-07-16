/**
 * Header — Top bar showing current context, search, and action buttons.
 */
import { Plus, Search } from "lucide-react";
import { useCollections } from "@/core/context/CollectionContext";
import { Button } from "@/components/ui/button";

interface HeaderProps {
    /** Called when user clicks the "Add Item" button. */
    onAddItem?: () => void;
}

function Header({ onAddItem }: HeaderProps) {
    const { selectedCollection } = useCollections();

    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
            {/* Left — Breadcrumb / Title */}
            <div className="flex items-center gap-2">
                {selectedCollection ? (
                    <>
                        <span className="text-base leading-none">
                            {selectedCollection.icon || "📁"}
                        </span>
                        <h2 className="text-sm font-semibold text-foreground">
                            {selectedCollection.name}
                        </h2>
                    </>
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

                {/* Add Item */}
                {selectedCollection && onAddItem && (
                    <Button size="sm" onClick={onAddItem}>
                        <Plus className="size-4" />
                        Add Item
                    </Button>
                )}
            </div>
        </header>
    );
}

export default Header;
