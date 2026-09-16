# Research: Tauri v2 Asset Protocol Security Scope for Dynamic Vault Roots

**Ticket:** [Investigate Tauri v2 asset protocol security scope for dynamic vault directories](https://github.com/huy1235588/Vaultrs/issues/3)  
**Date:** 2026-09-16  
**Primary Sources:**
- Tauri crate source (`tauri::Manager::asset_protocol_scope`, v2.11.5)
- Tauri FS Scope API (`tauri::scope::fs::Scope::allow_directory`, v2.11.5)
- Project configuration (`desktop/src-tauri/tauri.conf.json`, `desktop/src-tauri/capabilities/default.json`)

---

## Findings

### 1. Build-Time vs Runtime Scopes in Tauri v2
In `tauri.conf.json`:
```json
"security": {
    "csp": "default-src 'self'; img-src 'self' asset: http://asset.localhost https:; style-src 'self' 'unsafe-inline'",
    "assetProtocol": {
        "enable": true,
        "scope": ["**"]
    }
}
```
- By default, `assetProtocol.scope: ["**"]` allows the custom protocol handler to serve any file requested via `convertFileSrc`.
- However, relying solely on wildcard build-time configuration is brittle if capabilities are narrowed for security hardening or sandboxed distribution (e.g., App Store or Microsoft Store guidelines).

### 2. Runtime Dynamic Scope Registration
Tauri v2 exposes runtime scope mutation directly on `Manager` (implemented by both `App` and `AppHandle`):
```rust
use tauri::Manager;

let scope = app.asset_protocol_scope();
scope.allow_directory(&vault_root, true)?;
```
- `Scope::allow_directory<P: AsRef<Path>>(&self, path: P, recursive: bool) -> tauri::Result<()>`:
  - Dynamically registers the path into `allowed_patterns`.
  - With `recursive: true`, all nested paths (such as `{vault_root}/vault-storage/originals/**` and `{vault_root}/vault-storage/thumbnails/**`) are permitted.
  - Takes effect immediately across all windows using the asset protocol.

### 3. File Dialog & IPC Permissions
- In `desktop/src-tauri/capabilities/default.json`, `dialog:allow-open` is already enabled, allowing `@tauri-apps/plugin-dialog` to pick directories.
- The dialog returns the directory string to JavaScript.
- When JavaScript passes the path to the Tauri command `set_vault_directory(app, vault, path)`, the Rust command has direct access to `AppHandle`.
- In `set_vault_directory`:
  ```rust
  app.asset_protocol_scope().allow_directory(&vault_root, true)
      .map_err(|e| AppError::Internal(format!("Failed to register asset protocol scope: {e}")))?;
  ```
- Similarly, on application bootstrap in `setup` / `load_app_settings`, if an active vault exists, its path must be passed to `app.asset_protocol_scope().allow_directory(&vault_root, true)`.

### 4. Frontend Asset Resolution Workflow
In `desktop/src/core/utils/assetResolver.ts`:
- `convertFileSrc(absolutePath)` converts `{vault_root}/vault-storage/...` to `http://asset.localhost/...` (or `asset://...`).
- When a vault is switched, frontend must:
  1. Call `setCachedVaultRoot(newVaultStorageDir)`.
  2. The updated asset protocol scope in Rust ensures the webview can immediately fetch images from the new drive or folder without permission denials (HTTP 403 Forbidden).
