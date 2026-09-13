/**
 * CollectionContext — Global state for collection management.
 *
 * Provides the list of collections, the currently selected collection,
 * attributes for the selected collection, and CRUD actions that
 * synchronize with the Tauri backend.
 */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { Attribute, Collection } from "@/core/types/common";
import * as collectionService from "@/core/api/collectionService";
import * as attributeService from "@/core/api/attributeService";
import type {
    CreateCollectionDto,
    UpdateCollectionDto,
} from "@/core/api/collectionService";
import type {
    CreateAttributeDto,
    UpdateAttributeDto,
} from "@/core/api/attributeService";

export type CollectionSubView = "items" | "fields" | "settings";

// --- Types ---

interface CollectionState {
    /** All collections from the database. */
    collections: Collection[];
    /** The currently selected collection (null = home). */
    selectedCollection: Collection | null;
    /** Active subview for the selected collection. */
    activeSubView: CollectionSubView;
    /** Whether collections are being loaded. */
    loading: boolean;
    /** Last error message, if any. */
    error: string | null;
    /** Attributes (custom fields) for the selected collection. */
    attributes: Attribute[];
    /** Whether attributes are being loaded. */
    attributesLoading: boolean;
}

interface CollectionActions {
    /** Reload the collection list from the backend. */
    loadCollections: () => Promise<void>;
    /** Select a collection by ID (null to deselect). Optionally specify subView. */
    selectCollection: (id: number | null, subView?: CollectionSubView) => void;
    /** Set active subview for the current collection. */
    setActiveSubView: (view: CollectionSubView) => void;
    /** Create a new collection and refresh the list. */
    addCollection: (dto: CreateCollectionDto) => Promise<Collection>;
    /** Update an existing collection and refresh the list. */
    editCollection: (
        id: number,
        dto: UpdateCollectionDto,
    ) => Promise<Collection>;
    /** Delete a collection and refresh the list. */
    removeCollection: (id: number) => Promise<void>;
    /** Reload attributes for the selected collection. */
    loadAttributes: () => Promise<void>;
    /** Create a new attribute for the selected collection. */
    addAttribute: (dto: CreateAttributeDto) => Promise<Attribute>;
    /** Update an existing attribute. */
    editAttribute: (id: number, dto: UpdateAttributeDto) => Promise<Attribute>;
    /** Delete an attribute. */
    removeAttribute: (id: number) => Promise<void>;
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
    const [activeSubView, setActiveSubView] = useState<CollectionSubView>("items");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [attributesLoading, setAttributesLoading] = useState(false);

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
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load on mount
    useEffect(() => {
        loadCollections();
    }, [loadCollections]);

    // Select a collection by ID
    const selectCollection = useCallback(
        (id: number | null, subView: CollectionSubView = "items") => {
            if (id === null) {
                setSelectedCollection(null);
                setActiveSubView("items");
                return;
            }
            const found = collections.find((c) => c.id === id) ?? null;
            setSelectedCollection(found);
            setActiveSubView(subView);
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

    // --- Attribute Actions ---

    // Load attributes for the selected collection
    const loadAttributes = useCallback(async () => {
        if (!selectedCollection) {
            setAttributes([]);
            return;
        }
        setAttributesLoading(true);
        try {
            const data = await attributeService.getAttributes(
                selectedCollection.id,
            );
            setAttributes(data);
        } catch (err) {
            console.error("Failed to load attributes:", err);
            setAttributes([]);
        } finally {
            setAttributesLoading(false);
        }
    }, [selectedCollection]);

    // Create a new attribute
    const addAttribute = useCallback(
        async (dto: CreateAttributeDto): Promise<Attribute> => {
            const created = await attributeService.createAttribute(dto);
            await loadAttributes();
            return created;
        },
        [loadAttributes],
    );

    // Update an existing attribute
    const editAttribute = useCallback(
        async (id: number, dto: UpdateAttributeDto): Promise<Attribute> => {
            const updated = await attributeService.updateAttribute(id, dto);
            await loadAttributes();
            return updated;
        },
        [loadAttributes],
    );

    // Delete an attribute
    const removeAttribute = useCallback(
        async (id: number): Promise<void> => {
            await attributeService.deleteAttribute(id);
            await loadAttributes();
        },
        [loadAttributes],
    );

    // Initial load
    useEffect(() => {
        loadCollections();
    }, [loadCollections]);

    // Fetch attributes when selected collection changes
    useEffect(() => {
        loadAttributes();
    }, [loadAttributes]);

    const value = useMemo<CollectionContextValue>(
        () => ({
            collections,
            selectedCollection,
            activeSubView,
            loading,
            error,
            attributes,
            attributesLoading,
            loadCollections,
            selectCollection,
            setActiveSubView,
            addCollection,
            editCollection,
            removeCollection,
            loadAttributes,
            addAttribute,
            editAttribute,
            removeAttribute,
        }),
        [
            collections,
            selectedCollection,
            activeSubView,
            loading,
            error,
            attributes,
            attributesLoading,
            loadCollections,
            selectCollection,
            setActiveSubView,
            addCollection,
            editCollection,
            removeCollection,
            loadAttributes,
            addAttribute,
            editAttribute,
            removeAttribute,
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
