/**
 * App Settings Service — IPC calls for global machine settings and vault lifecycle.
 */
import { invoke } from "@tauri-apps/api/core";

export interface RecentVaultDto {
    path: string;
    display_name: string;
    last_opened: number;
    is_reachable: boolean;
}

export type VaultDirectoryStatus =
    | "ValidVault"
    | "EmptyDirectory"
    | "NonEmptyDirectory"
    | "DirectoryNotFound"
    | "PathIsAFile";

export interface AppSettingsDto {
    vault_root_path: string | null;
    is_vault_loaded: boolean;
    db_path: string | null;
    storage_dir: string | null;
    recent_vaults: RecentVaultDto[];
    unreachable_vault_path: string | null;
}

/**
 * Fetch current application settings and vault status.
 */
export async function getAppSettings(): Promise<AppSettingsDto> {
    return await invoke<AppSettingsDto>("get_app_settings");
}

/**
 * Set and switch the active vault directory.
 */
export async function setVaultDirectory(path: string): Promise<AppSettingsDto> {
    return await invoke<AppSettingsDto>("set_vault_directory", { path });
}

/**
 * Validate a candidate folder path before attempting to open or create a vault.
 */
export async function validateVaultDirectory(path: string): Promise<VaultDirectoryStatus> {
    return await invoke<VaultDirectoryStatus>("validate_vault_directory", { path });
}

/**
 * Remove an entry from the recent vaults list.
 */
export async function removeRecentVault(path: string): Promise<AppSettingsDto> {
    return await invoke<AppSettingsDto>("remove_recent_vault", { path });
}

/**
 * Get the absolute path to the active vault storage directory.
 */
export async function getVaultStorageDir(): Promise<string> {
    return await invoke<string>("get_vault_storage_dir");
}

/**
 * Reveal the active vault directory in the OS file manager.
 */
export async function revealVaultInExplorer(): Promise<void> {
    return await invoke<void>("reveal_vault_in_explorer");
}

