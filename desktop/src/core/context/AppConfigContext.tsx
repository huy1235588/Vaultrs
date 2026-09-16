/**
 * AppConfigContext — Global machine configuration and Vault lifecycle state.
 */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { open } from "@tauri-apps/plugin-dialog";
import * as appSettingsService from "@/core/api/appSettingsService";
import type { AppSettingsDto } from "@/core/api/appSettingsService";

interface AppConfigContextValue {
    /** Current configured root vault path (null if not yet set). */
    vaultRootPath: string | null;
    /** Whether an active vault database is currently loaded and queryable. */
    isVaultLoaded: boolean;
    /** Path to the SQLite database file inside the vault. */
    dbPath: string | null;
    /** Path to the assets storage directory inside the vault. */
    storageDir: string | null;
    /** Loading state while fetching or switching vault configuration. */
    loading: boolean;
    /** Error message, if any occurred during vault operations. */
    error: string | null;
    /** Global App Settings modal visibility. */
    settingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;
    /** Refresh settings from backend. */
    refreshSettings: () => Promise<void>;
    /** Initialize or switch to a specific vault directory path. */
    selectVault: (path: string) => Promise<void>;
    /** Open native OS directory picker dialog and return selected path. */
    chooseFolder: () => Promise<string | null>;
    /** Open the active vault root directory in the OS file manager. */
    revealInExplorer: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextValue | null>(null);

export function AppConfigProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettingsDto>({
        vault_root_path: null,
        is_vault_loaded: false,
        db_path: null,
        storage_dir: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const refreshSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await appSettingsService.getAppSettings();
            setSettings(data);
        } catch (err) {
            console.error("Failed to load app settings:", err);
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    // Keyboard shortcut ⌘, or Ctrl+, to toggle App Settings
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === ",") {
                e.preventDefault();
                setSettingsOpen((prev) => !prev);
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const selectVault = useCallback(async (path: string) => {
        try {
            setLoading(true);
            setError(null);
            const updated = await appSettingsService.setVaultDirectory(path);
            setSettings(updated);
        } catch (err) {
            console.error("Failed to set vault directory:", err);
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const chooseFolder = useCallback(async (): Promise<string | null> => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select Vault Directory",
            });
            if (typeof selected === "string") {
                return selected;
            }
            return null;
        } catch (err) {
            console.error("Error picking directory:", err);
            return null;
        }
    }, []);

    const revealInExplorer = useCallback(async () => {
        try {
            await appSettingsService.revealVaultInExplorer();
        } catch (err) {
            console.error("Error revealing vault:", err);
        }
    }, []);

    const value: AppConfigContextValue = {
        vaultRootPath: settings.vault_root_path,
        isVaultLoaded: settings.is_vault_loaded,
        dbPath: settings.db_path,
        storageDir: settings.storage_dir,
        loading,
        error,
        settingsOpen,
        setSettingsOpen,
        refreshSettings,
        selectVault,
        chooseFolder,
        revealInExplorer,
    };

    return (
        <AppConfigContext.Provider value={value}>
            {children}
        </AppConfigContext.Provider>
    );
}

export function useAppConfig(): AppConfigContextValue {
    const context = useContext(AppConfigContext);
    if (!context) {
        throw new Error("useAppConfig must be used within an AppConfigProvider");
    }
    return context;
}
