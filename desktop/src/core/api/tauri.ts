/**
 * Tauri API wrapper — centralized invoke calls.
 */
import { invoke } from "@tauri-apps/api/core";

/**
 * Type-safe wrapper around Tauri's invoke function.
 *
 * @example
 * ```ts
 * const collections = await tauriInvoke<Collection[]>("get_collections");
 * ```
 */
export async function tauriInvoke<T>(
    command: string,
    args?: Record<string, unknown>,
): Promise<T> {
    return invoke<T>(command, args);
}
