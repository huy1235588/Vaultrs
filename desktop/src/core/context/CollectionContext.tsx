/**
 * CollectionContext — Global state for collection management.
 *
 * Provides the list of collections, the currently selected collection,
 * and CRUD actions that synchronize with the Tauri backend.
 */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { Collection } from "@/core/types/common";
import * as collectionService from "@/core/api/collectionService";
import type {
    CreateCollectionDto,
    UpdateCollectionDto,
} from "@/core/api/collectionService";

// --- Types ---

interface CollectionState {
    /** All collections from the database. */
    collections: Collection[];
    /** The currently selected collection (null = home). */
    selectedCollection: Collection | null;
    /** Whether collections are being loaded. */
    loading: boolean;
    /** Last error message, if any. */
    error: string | null;
}

interface CollectionActions {
    /** Reload the collection list from the backend. */
    loadCollections: () => Promise<void>;
    /** Select a collection by ID (null to deselect). */
    selectCollection: (id: number | null) => void;
    /** Create a new collection and refresh the list. */
    addCollection: (dto: CreateCollectionDto) => Promise<Collection>;
    /** Update an existing collection and refresh the list. */
    editCollection: (
        id: number,
        dto: UpdateCollectionDto,
    ) => Promise<Collection>;
    /** Delete a collection and refresh the list. */
    removeCollection: (id: number) => Promise<void>;
}

type CollectionContextValue = CollectionState & CollectionActions;

// --- Context ---

const CollectionContext = createContext<CollectionContextValue | null>(null);

// --- Provider ---

export function CollectionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] =
        useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load collections from backend
    const loadCollections = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await collectionService.getCollections();
            setCollections(data);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to load collections";
            setError(message);
            console.error("Failed to load collections:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Select a collection by ID
    const selectCollection = useCallback(
        (id: number | null) => {
            if (id === null) {
                setSelectedCollection(null);
                return;
            }
            const found = collections.find((c) => c.id === id) ?? null;
            setSelectedCollection(found);
        },
        [collections],
    );

    // Create a new collection
    const addCollection = useCallback(
        async (dto: CreateCollectionDto): Promise<Collection> => {
            const created = await collectionService.createCollection(dto);
            await loadCollections();
            return created;
        },
        [loadCollections],
    );

    // Update an existing collection
    const editCollection = useCallback(
        async (id: number, dto: UpdateCollectionDto): Promise<Collection> => {
            const updated = await collectionService.updateCollection(id, dto);
            await loadCollections();
            // If the updated collection is currently selected, update the selection
            setSelectedCollection((prev) =>
                prev?.id === id ? updated : prev,
            );
            return updated;
        },
        [loadCollections],
    );

    // Delete a collection
    const removeCollection = useCallback(
        async (id: number): Promise<void> => {
            await collectionService.deleteCollection(id);
            // If the deleted collection was selected, deselect
            setSelectedCollection((prev) =>
                prev?.id === id ? null : prev,
            );
            await loadCollections();
        },
        [loadCollections],
    );

    // Initial load
    useEffect(() => {
        loadCollections();
    }, [loadCollections]);

    const value = useMemo<CollectionContextValue>(
        () => ({
            collections,
            selectedCollection,
            loading,
            error,
            loadCollections,
            selectCollection,
            addCollection,
            editCollection,
            removeCollection,
        }),
        [
            collections,
            selectedCollection,
            loading,
            error,
            loadCollections,
            selectCollection,
            addCollection,
            editCollection,
            removeCollection,
        ],
    );

    return (
        <CollectionContext.Provider value={value}>
            {children}
        </CollectionContext.Provider>
    );
}

// --- Hook ---

/**
 * Access the collection context. Must be used within a CollectionProvider.
 */
export function useCollections(): CollectionContextValue {
    const ctx = useContext(CollectionContext);
    if (!ctx) {
        throw new Error(
            "useCollections must be used within a CollectionProvider",
        );
    }
    return ctx;
}
