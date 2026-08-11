/**
 * Asset URL resolution — converts vault-relative paths to displayable URLs.
 *
 * Uses Tauri's convertFileSrc() to convert absolute file paths into
 * URLs that the webview can render (asset:// protocol).
 */
import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";

let cachedVaultRoot: string | null = null;

/**
 * Get the absolute path to the vault-storage root directory.
 * Cached after first call.
 */
async function getVaultRoot(): Promise<string> {
    if (cachedVaultRoot) return cachedVaultRoot;
    const appData = await appDataDir();
    cachedVaultRoot = `${appData}vault-storage`;
    return cachedVaultRoot;
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
    // Normalize path separators
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
        console.warn(
            "Asset resolver not initialized. Call initAssetResolver() first.",
        );
        return "";
    }
    const normalized = relativePath.replace(/\\/g, "/");
    const absolutePath = `${cachedVaultRoot}/${normalized}`;
    return convertFileSrc(absolutePath);
}

/**
 * Initialize the asset resolver by caching the vault root path.
 * Call this once during app startup.
 */
export async function initAssetResolver(): Promise<void> {
    await getVaultRoot();
}
