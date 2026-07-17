/**
 * ItemContext — State for the currently viewed/edited item.
 *
 * Manages navigation between the collection item list and a single item's
 * detail view. Nested inside CollectionProvider.
 */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { Item } from "@/core/types/common";
import * as itemService from "@/core/api/itemService";
import { useCollections } from "./CollectionContext";

// --- Types ---

interface ItemState {
    /** The currently viewed item, or null if viewing the collection list. */
    selectedItem: Item | null;
    /** Loading state while fetching item details. */
    itemLoading: boolean;
    /** Error message from the last item operation. */
    itemError: string | null;
}

interface ItemActions {
    /** Navigate to an item's detail view by fetching it from the backend. */
    selectItem: (id: number) => Promise<void>;
    /** Return to the collection list view. */
    clearItem: () => void;
    /** Reload the currently selected item from the backend. */
    refreshItem: () => Promise<void>;
    /** Update the selected item in-memory (after a successful edit). */
    setSelectedItem: (item: Item | null) => void;
}

type ItemContextValue = ItemState & ItemActions;

// --- Context ---

const ItemContext = createContext<ItemContextValue | null>(null);

// --- Provider ---

export function ItemProvider({ children }: { children: React.ReactNode }) {
    const { selectedCollection } = useCollections();

    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [itemLoading, setItemLoading] = useState(false);
    const [itemError, setItemError] = useState<string | null>(null);

    // Clear item when collection changes
    useEffect(() => {
        setSelectedItem(null);
        setItemError(null);
    }, [selectedCollection?.id]);

    // Select an item by fetching it from the backend
    const selectItem = useCallback(async (id: number) => {
        setItemLoading(true);
        setItemError(null);
        try {
            const item = await itemService.getItem(id);
            setSelectedItem(item);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load item";
            setItemError(message);
            console.error("Failed to load item:", err);
        } finally {
            setItemLoading(false);
        }
    }, []);

    // Return to collection list
    const clearItem = useCallback(() => {
        setSelectedItem(null);
        setItemError(null);
    }, []);

    // Reload the current item
    const refreshItem = useCallback(async () => {
        if (!selectedItem) return;
        await selectItem(selectedItem.id);
    }, [selectedItem, selectItem]);

    const value = useMemo<ItemContextValue>(
        () => ({
            selectedItem,
            itemLoading,
            itemError,
            selectItem,
            clearItem,
            refreshItem,
            setSelectedItem,
        }),
        [
            selectedItem,
            itemLoading,
            itemError,
            selectItem,
            clearItem,
            refreshItem,
        ],
    );

    return (
        <ItemContext.Provider value={value}>{children}</ItemContext.Provider>
    );
}

// --- Hook ---

/**
 * Access the item context. Must be used within an ItemProvider.
 */
export function useItem(): ItemContextValue {
    const ctx = useContext(ItemContext);
    if (!ctx) {
        throw new Error("useItem must be used within an ItemProvider");
    }
    return ctx;
}
