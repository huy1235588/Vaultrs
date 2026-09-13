/**
 * useCollectionViewPrefs — Stores per-collection view preferences
 * (viewMode, sortField, sortOrder, cardWidth, cardHeight, showPropertiesOnCard, etc.)
 * in localStorage.
 *
 * Each collection gets its own saved preferences. When the user changes
 * dimensions, sort order, view mode, etc., those changes are remembered for that
 * specific collection.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewMode } from "@/components/Item/ViewModeToggle";
import type {
    CollectionSettings,
    SortField,
    SortOrder,
} from "@/core/types/common";

const STORAGE_KEY = "vaultrs-collection-view-prefs";

export type CardAspectPreset = "poster" | "book" | "square" | "landscape" | "video" | "custom";

export interface CollectionViewPrefs {
    viewMode: ViewMode;
    sortField: SortField;
    sortOrder: SortOrder;
    cardSize?: "SMALL" | "MEDIUM" | "LARGE";
    cardWidth?: number;
    cardHeight?: number;
    aspectPreset?: CardAspectPreset;
    showTitleOnCard?: boolean;
    showPropertiesOnCard?: boolean;
    showDateOnCard?: boolean;
}

/** Calculate height from width and aspect ratio preset. */
export function calculateHeightFromAspect(width: number, preset: CardAspectPreset, currentHeight: number): number {
    switch (preset) {
        case "poster": // 2:3
            return Math.round(width * 1.5);
        case "book": // 3:4
            return Math.round(width * 1.333);
        case "square": // 1:1
            return width;
        case "landscape": // 16:10
            return Math.round(width * 0.625);
        case "video": // 16:9
            return Math.round(width * 0.5625);
        case "custom":
        default:
            return currentHeight;
    }
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
 * Derive initial/default prefs from CollectionSettings (DB defaults).
 */
function defaultsFromSettings(settings: CollectionSettings | null): Required<CollectionViewPrefs> {
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

    const cardSize = (settings?.appearance.card_size as "SMALL" | "MEDIUM" | "LARGE") ?? "MEDIUM";
    const defaultWidth = cardSize === "SMALL" ? 160 : cardSize === "LARGE" ? 260 : 200;
    const defaultHeight = cardSize === "SMALL" ? 220 : cardSize === "LARGE" ? 360 : 280;
    const cardWidth = defaultWidth;
    const cardHeight = defaultHeight;
    const aspectPreset: CardAspectPreset = "poster";
    const showTitleOnCard = settings?.appearance.show_title_on_card ?? true;
    const showPropertiesOnCard = true;
    const showDateOnCard = true;

    return {
        viewMode,
        sortField,
        sortOrder,
        cardSize,
        cardWidth,
        cardHeight,
        aspectPreset,
        showTitleOnCard,
        showPropertiesOnCard,
        showDateOnCard,
    };
}

export interface UseCollectionViewPrefsResult {
    viewMode: ViewMode;
    sortField: SortField;
    sortOrder: SortOrder;
    cardSize: "SMALL" | "MEDIUM" | "LARGE";
    cardWidth: number;
    cardHeight: number;
    aspectPreset: CardAspectPreset;
    showTitleOnCard: boolean;
    showPropertiesOnCard: boolean;
    showDateOnCard: boolean;
    setViewMode: (mode: ViewMode) => void;
    setSortField: (field: SortField) => void;
    setSortOrder: (order: SortOrder) => void;
    setCardSize: (size: "SMALL" | "MEDIUM" | "LARGE") => void;
    setCardWidth: (width: number) => void;
    setCardHeight: (height: number) => void;
    setAspectPreset: (preset: CardAspectPreset) => void;
    setShowTitleOnCard: (show: boolean) => void;
    setShowPropertiesOnCard: (show: boolean) => void;
    setShowDateOnCard: (show: boolean) => void;
    resetDefaults: () => void;
}

export function useCollectionViewPrefs(
    collectionId: number | undefined,
    settings: CollectionSettings | null,
): UseCollectionViewPrefsResult {
    // Resolve initial state for the current collection
    const resolvePrefs = useCallback(
        (id: number | undefined): Required<CollectionViewPrefs> => {
            const defaults = defaultsFromSettings(settings);
            if (id === undefined) {
                return defaults;
            }
            const saved = readPrefs(id);
            if (saved) {
                const cardWidth = saved.cardWidth ?? defaults.cardWidth;
                const aspectPreset = saved.aspectPreset ?? defaults.aspectPreset;
                const cardHeight = saved.cardHeight ?? calculateHeightFromAspect(cardWidth, aspectPreset, defaults.cardHeight);

                return {
                    viewMode: saved.viewMode ?? defaults.viewMode,
                    sortField: saved.sortField ?? defaults.sortField,
                    sortOrder: saved.sortOrder ?? defaults.sortOrder,
                    cardSize: saved.cardSize ?? defaults.cardSize,
                    cardWidth,
                    cardHeight,
                    aspectPreset,
                    showTitleOnCard: saved.showTitleOnCard ?? defaults.showTitleOnCard,
                    showPropertiesOnCard: saved.showPropertiesOnCard ?? defaults.showPropertiesOnCard,
                    showDateOnCard: saved.showDateOnCard ?? defaults.showDateOnCard,
                };
            }
            return defaults;
        },
        [settings],
    );

    const [prefs, setPrefsState] = useState<Required<CollectionViewPrefs>>(() =>
        resolvePrefs(collectionId),
    );

    // Track the previous collection ID so we only re-resolve on actual switches
    const prevIdRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (collectionId === undefined) return;
        if (prevIdRef.current === collectionId) return;

        prevIdRef.current = collectionId;

        const resolved = resolvePrefs(collectionId);
        setPrefsState(resolved);
    }, [collectionId, resolvePrefs]);

    // --- Individual setters that also persist ---

    const persist = useCallback(
        (updated: Required<CollectionViewPrefs>) => {
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

    const setCardSize = useCallback(
        (size: "SMALL" | "MEDIUM" | "LARGE") => {
            setPrefsState((prev) => {
                const width = size === "SMALL" ? 160 : size === "LARGE" ? 260 : 200;
                const height = size === "SMALL" ? 220 : size === "LARGE" ? 360 : 280;
                const next: Required<CollectionViewPrefs> = {
                    ...prev,
                    cardSize: size,
                    cardWidth: width,
                    cardHeight: height,
                    aspectPreset: "poster",
                };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    const setCardWidth = useCallback(
        (width: number) => {
            setPrefsState((prev) => {
                const height = prev.aspectPreset !== "custom"
                    ? calculateHeightFromAspect(width, prev.aspectPreset, prev.cardHeight)
                    : prev.cardHeight;
                const next: Required<CollectionViewPrefs> = {
                    ...prev,
                    cardWidth: width,
                    cardHeight: height,
                };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    const setCardHeight = useCallback(
        (height: number) => {
            setPrefsState((prev) => {
                const next: Required<CollectionViewPrefs> = {
                    ...prev,
                    cardHeight: height,
                    aspectPreset: "custom", // Manually changing height makes it custom
                };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    const setAspectPreset = useCallback(
        (preset: CardAspectPreset) => {
            setPrefsState((prev) => {
                const height = calculateHeightFromAspect(prev.cardWidth, preset, prev.cardHeight);
                const next: Required<CollectionViewPrefs> = {
                    ...prev,
                    aspectPreset: preset,
                    cardHeight: height,
                };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    const setShowTitleOnCard = useCallback(
        (show: boolean) => {
            setPrefsState((prev) => {
                const next = { ...prev, showTitleOnCard: show };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    const setShowPropertiesOnCard = useCallback(
        (show: boolean) => {
            setPrefsState((prev) => {
                const next = { ...prev, showPropertiesOnCard: show };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    const setShowDateOnCard = useCallback(
        (show: boolean) => {
            setPrefsState((prev) => {
                const next = { ...prev, showDateOnCard: show };
                persist(next);
                return next;
            });
        },
        [persist],
    );

    const resetDefaults = useCallback(() => {
        const defaults = defaultsFromSettings(settings);
        setPrefsState(defaults);
        persist(defaults);
    }, [settings, persist]);

    return {
        viewMode: prefs.viewMode,
        sortField: prefs.sortField,
        sortOrder: prefs.sortOrder,
        cardSize: prefs.cardSize,
        cardWidth: prefs.cardWidth,
        cardHeight: prefs.cardHeight,
        aspectPreset: prefs.aspectPreset,
        showTitleOnCard: prefs.showTitleOnCard,
        showPropertiesOnCard: prefs.showPropertiesOnCard,
        showDateOnCard: prefs.showDateOnCard,
        setViewMode,
        setSortField,
        setSortOrder,
        setCardSize,
        setCardWidth,
        setCardHeight,
        setAspectPreset,
        setShowTitleOnCard,
        setShowPropertiesOnCard,
        setShowDateOnCard,
        resetDefaults,
    };
}
