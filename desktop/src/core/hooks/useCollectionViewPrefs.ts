/**
 * useCollectionViewPrefs — Stores per-collection view preferences
 * (viewMode, sortField, sortOrder) in localStorage.
 *
 * Each collection gets its own saved preferences. When the user changes
 * sort order, view mode, etc., those changes are remembered for that
 * specific collection. When switching back to a collection, the last
 * user-chosen settings are restored instead of resetting to defaults.
 *
 * Falls back to collection settings defaults (from the DB) when no
 * saved preference exists for a given collection.
 *
 * @example
 * ```tsx
 * const { viewMode, sortField, sortOrder, setViewMode, setSortField, setSortOrder }
 *     = useCollectionViewPrefs(collectionId, settings);
 * ```
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewMode } from "@/components/Item/ViewModeToggle";
import type {
    CollectionSettings,
    SortField,
    SortOrder,
} from "@/core/types/common";

const STORAGE_KEY = "vaultrs-collection-view-prefs";

interface CollectionViewPrefs {
    viewMode: ViewMode;
    sortField: SortField;
    sortOrder: SortOrder;
}

/** Read the entire prefs map from localStorage. */
function readAllPrefs(): Record<string, CollectionViewPrefs> {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Record<string, CollectionViewPrefs>) : {};
    } catch {
        return {};
    }
}

/** Write the entire prefs map to localStorage. */
function writeAllPrefs(prefs: Record<string, CollectionViewPrefs>) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
        console.warn("Error saving collection view prefs:", error);
    }
}

/** Read prefs for a single collection. Returns undefined if none saved. */
function readPrefs(collectionId: number): CollectionViewPrefs | undefined {
    return readAllPrefs()[String(collectionId)];
}

/** Persist prefs for a single collection. */
function savePrefs(collectionId: number, prefs: CollectionViewPrefs) {
    const all = readAllPrefs();
    all[String(collectionId)] = prefs;
    writeAllPrefs(all);
}

/**
 * Derive the initial/default prefs from CollectionSettings (DB defaults).
 * Used as fallback when no user preference has been saved yet.
 */
function defaultsFromSettings(settings: CollectionSettings | null): CollectionViewPrefs {
    const viewMode: ViewMode =
        settings?.appearance.default_view_mode === "GRID" ? "grid" : "list";

    let sortField: SortField = "created_at";
    const field = settings?.behavior.default_sort_field as SortField | undefined;
    if (field && ["title", "created_at", "updated_at"].includes(field)) {
        sortField = field;
    }

    let sortOrder: SortOrder = "DESC";
    const order = settings?.behavior.default_sort_order as SortOrder | undefined;
    if (order === "ASC" || order === "DESC") {
        sortOrder = order;
    }

    return { viewMode, sortField, sortOrder };
}

export interface UseCollectionViewPrefsResult {
    viewMode: ViewMode;
    sortField: SortField;
    sortOrder: SortOrder;
    setViewMode: (mode: ViewMode) => void;
    setSortField: (field: SortField) => void;
    setSortOrder: (order: SortOrder) => void;
}

export function useCollectionViewPrefs(
    collectionId: number | undefined,
    settings: CollectionSettings | null,
): UseCollectionViewPrefsResult {
    // Resolve initial state for the current collection
    const resolvePrefs = useCallback(
        (id: number | undefined): CollectionViewPrefs => {
            if (id === undefined) {
                return defaultsFromSettings(settings);
            }
            const saved = readPrefs(id);
            if (saved) return saved;
            return defaultsFromSettings(settings);
        },
        [settings],
    );

    const [prefs, setPrefsState] = useState<CollectionViewPrefs>(() =>
        resolvePrefs(collectionId),
    );

    // Track the previous collection ID so we only re-resolve on actual switches
    const prevIdRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (collectionId === undefined) return;
        if (prevIdRef.current === collectionId) return;

        prevIdRef.current = collectionId;

        // When switching to a (potentially different) collection,
        // load saved prefs or fall back to settings defaults.
        const resolved = resolvePrefs(collectionId);
        setPrefsState(resolved);
    }, [collectionId, resolvePrefs]);

    // --- Individual setters that also persist ---

    const persist = useCallback(
        (updated: CollectionViewPrefs) => {
            if (collectionId !== undefined) {
                savePrefs(collectionId, updated);
            }
        },
        [collectionId],
    );

    const setViewMode = useCallback(
        (mode: ViewMode) => {
            setPrefsState((prev) => {
                const next = { ...prev, viewMode: mode };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    const setSortField = useCallback(
        (field: SortField) => {
            setPrefsState((prev) => {
                const next = { ...prev, sortField: field };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    const setSortOrder = useCallback(
        (order: SortOrder) => {
            setPrefsState((prev) => {
                const next = { ...prev, sortOrder: order };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    return {
        viewMode: prefs.viewMode,
        sortField: prefs.sortField,
        sortOrder: prefs.sortOrder,
        setViewMode,
        setSortField,
        setSortOrder,
    };
}
