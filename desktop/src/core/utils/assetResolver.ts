/**
 * Asset URL resolution — converts vault-relative paths to displayable URLs.
 *
 * Uses Tauri's convertFileSrc() to convert absolute file paths into
 * URLs that the webview can render (asset:// protocol).
 */
import { convertFileSrc } from "@tauri-apps/api/core";
import { getVaultStorageDir } from "@/core/api/appSettingsService";

let cachedVaultRoot: string | null = null;

/**
 * Get the absolute path to the active vault storage root directory.
 * Cached after first call; refreshed whenever the vault directory changes.
 */
async function getVaultRoot(): Promise<string> {
    if (cachedVaultRoot) return cachedVaultRoot;
    try {
        const dir = await getVaultStorageDir();
        cachedVaultRoot = dir.replace(/\\/g, "/");
        return cachedVaultRoot;
    } catch (e) {
        console.warn("Could not retrieve vault storage dir:", e);
        return "";
    }
}

/**
 * Manually update or clear the cached vault storage root.
 */
export function setCachedVaultRoot(root: string | null): void {
    cachedVaultRoot = root ? root.replace(/\\/g, "/") : null;
}

/**
 * Resolve a vault-relative path to a displayable URL.
 *
 * @param relativePath - Path relative to vault-storage (e.g., "originals/abc.jpg")
 * @returns A URL the webview can use in <img src="...">
 */
export async function resolveAssetUrl(
    relativePath: string,
): Promise<string> {
    const root = await getVaultRoot();
    if (!root) return "";
    const normalized = relativePath.replace(/\\/g, "/");
    const absolutePath = `${root}/${normalized}`;
    return convertFileSrc(absolutePath);
}

/**
 * Synchronous version using pre-cached vault root.
 * Must call initAssetResolver() first during app startup.
 */
export function resolveAssetUrlSync(relativePath: string): string {
    if (!cachedVaultRoot) {
        return "";
    }
    const normalized = relativePath.replace(/\\/g, "/");
    const absolutePath = `${cachedVaultRoot}/${normalized}`;
    return convertFileSrc(absolutePath);
}

/**
 * Initialize the asset resolver by caching the active vault storage path.
 * Call this once during app startup or after switching vaults.
 */
export async function initAssetResolver(): Promise<void> {
    cachedVaultRoot = null;
    await getVaultRoot();
}
