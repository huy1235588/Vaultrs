/**
 * useCollectionSettings — Hook for loading and caching collection settings.
 *
 * Auto-loads settings when collectionId changes.
 * Provides update function that optimistically merges changes.
 */
import { useCallback, useEffect, useState } from "react";
import * as settingsService from "@/core/api/collectionSettingsService";
import type { CollectionSettings } from "@/core/types/common";

interface UseCollectionSettingsResult {
    settings: CollectionSettings | null;
    isLoading: boolean;
    error: string | null;
    updateSettings: (dto: settingsService.UpdateSettingsDto) => Promise<void>;
    reload: () => void;
}

export function useCollectionSettings(
    collectionId: number | undefined,
): UseCollectionSettingsResult {
    const [settings, setSettings] = useState<CollectionSettings | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!collectionId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await settingsService.getSettings(collectionId);
            setSettings(data);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to load collection settings";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [collectionId]);

    useEffect(() => {
        setSettings(null);
        load();
    }, [load]);

    const updateSettings = useCallback(
        async (dto: settingsService.UpdateSettingsDto) => {
            if (!collectionId) return;
            try {
                const updated = await settingsService.updateSettings(
                    collectionId,
                    dto,
                );
                setSettings(updated);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to update settings";
                setError(message);
                throw err;
            }
        },
        [collectionId],
    );

    return {
        settings,
        isLoading,
        error,
        updateSettings,
        reload: load,
    };
}
