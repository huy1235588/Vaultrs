# Specification: ADR-0006 Configurable Co-located Vault Root & Global App Settings

- **Status**: Ready for Implementation
- **ADR Reference**: [`docs/adr/0006-global-app-settings-and-configurable-vault-root.md`](file:///d:/Project/Rust/Vaultrs/docs/adr/0006-global-app-settings-and-configurable-vault-root.md)
- **Wayfinder Map**: [Map: Implementation roadmap for ADR-0006 (Global App Settings & Configurable Vault Root)](https://github.com/huy1235588/Vaultrs/issues/1)

---

## 1. Overview & Architectural Goals

Vaultrs requires user metadata databases and binary assets to remain fully portable, self-contained, and free from forced placement on the OS system drive (`C:\`). 

This specification operationalizes **ADR-0006**, synthesizing validated decisions from research and prototype artifacts:
1. **Connection Pool Teardown & WAL Checkpoint**: Explicitly flush WAL journals via `PRAGMA wal_checkpoint(TRUNCATE)` and close connection pools to release OS file handles on Windows before switching vaults. (Source: [`docs/research/seaorm-sqlite-connection-teardown.md`](file:///d:/Project/Rust/Vaultrs/docs/research/seaorm-sqlite-connection-teardown.md)).
2. **Dynamic Asset Protocol Scope**: Dynamically register user-selected vault directories in Tauri v2 via `app.asset_protocol_scope().allow_directory(&vault_root, true)` to allow `convertFileSrc` to render images from any drive without 403 Forbidden errors. (Source: [`docs/research/tauri-v2-asset-protocol-scope.md`](file:///d:/Project/Rust/Vaultrs/docs/research/tauri-v2-asset-protocol-scope.md)).
3. **Recent Vaults (MRU) & Directory Validation**: Store recent vaults in machine-level `vaultrs-settings.json`, validate folders prior to initialization, and support non-destructive recovery if a drive is unplugged on launch. (Source: `prototype/mru-vault-logic`).
4. **Keyed React Provider Tree**: Key `<CollectionProvider key={vaultRootPath}>` and `<ItemProvider key={vaultRootPath}>` to guarantee clean state teardown during runtime switches while maintaining `<AppSettingsDialog>` outside the keyed tree for smooth feedback. (Source: `prototype/react-vault-lifecycle`).

---

## 2. Backend Architecture (Rust / Tauri v2)

### 2.1 Configuration Schema (`desktop/src-tauri/src/core/config.rs`)

Persisted in the OS app config directory (`get_settings_file_path()` &rarr; `%APPDATA%/com.huy1235588.vaultrs/vaultrs-settings.json` on Windows):

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RecentVaultEntry {
    /// Canonical absolute path to the vault root directory.
    pub path: String,
    /// User-friendly display label (defaults to folder basename).
    pub display_name: String,
    /// Unix timestamp in milliseconds when this vault was last opened.
    pub last_opened: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppSettings {
    /// Active vault root directory, if configured.
    pub vault_root_path: Option<String>,
    /// Most-recently-used vault history, capped at 5 items, sorted newest-first.
    #[serde(default)]
    pub recent_vaults: Vec<RecentVaultEntry>,
}
```

#### MRU Operations on `AppSettings`:
- **`record_vault_opened(&mut self, path: &Path)`**:
  1. Canonicalizes path to a normalized string.
  2. If the path already exists in `recent_vaults`, updates its `last_opened` timestamp to current time and moves it to index `0`.
  3. If not present, extracts the folder name as `display_name` and prepends a new `RecentVaultEntry`.
  4. Truncates `recent_vaults` to 5 entries.
  5. Sets `self.vault_root_path = Some(canonical_path)`.
- **`remove_recent_vault(&mut self, path: &str)`**: Removes any entry matching `path`.
- **`prune_missing_vaults(&mut self)`**: Removes any entries where `Path::new(&entry.path).exists()` is false.

---

### 2.2 Directory Validation Guardrails

Before initializing or opening a directory, the backend must inspect the target:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum VaultDirectoryStatus {
    /// Valid directory containing an existing, migratable vaultrs.db
    ValidExistingVault,
    /// Empty directory, ready for fresh vault initialization
    EmptyDirectory,
    /// Directory contains non-conflicting files but lacks vaultrs.db (requires confirmation)
    NonEmptyWithoutDb,
    /// OS write permission denied
    PermissionDenied(String),
    /// Path does not exist
    NotFound(String),
    /// SQLite file exists but failed connection check or header validation
    CorruptedDb(String),
}
```

#### Validation Algorithm:
1. If `!path.exists()`, return `NotFound`.
2. Probe write permissions by attempting to create and immediately remove a temporary `.vaultrs_probe` file. If failed, return `PermissionDenied`.
3. Check for `{path}/vaultrs.db`:
   - If present: verify database connectivity with SQLite header probe. If corrupted, return `CorruptedDb`; otherwise return `ValidExistingVault`.
   - If absent: read directory entries. If empty, return `EmptyDirectory`; if non-empty, return `NonEmptyWithoutDb`.

---

### 2.3 Connection Lifecycle & WAL Teardown (`desktop/src-tauri/src/core/state.rs`)

```rust
impl AppVaultState {
    /// Safely tears down the active vault, releasing all SQLite file handles on Windows.
    pub async fn close_vault(&self) -> Result<(), AppError> {
        let mut db_lock = self.db.write().await;
        if let Some(old_db) = db_lock.take() {
            // 1. Truncate WAL journal to flush all frames into vaultrs.db
            let _ = old_db.execute_unprepared("PRAGMA wal_checkpoint(TRUNCATE);").await;
            // 2. Explicitly drain and close the SeaORM / sqlx connection pool
            let _ = old_db.close().await;
        }
        *self.storage.write().await = None;
        *self.vault_root.write().await = None;
        log::info!("Vault closed and SQLite locks released");
        Ok(())
    }

    /// Initializes or switches to a new vault root directory.
    pub async fn init_vault(&self, app: &tauri::AppHandle, vault_root: &Path) -> Result<(), AppError> {
        // 1. Cleanly close any existing active connection
        self.close_vault().await?;

        // 2. Ensure target directories exist
        std::fs::create_dir_all(vault_root)?;

        // 3. Register dynamic asset protocol scope
        app.asset_protocol_scope().allow_directory(vault_root, true)
            .map_err(|e| AppError::Internal(format!("Failed to register asset protocol scope: {e}")))?;

        // 4. Initialize SQLite database and run migrations
        let db_path = config::get_db_path(vault_root);
        let new_db = db::connection::init_database(&db_path).await?;

        // 5. Initialize VaultStorage
        let new_storage = VaultStorage::new(vault_root);
        new_storage.ensure_dirs()?;

        // 6. Atomically update managed state
        *self.db.write().await = Some(new_db);
        *self.storage.write().await = Some(new_storage);
        *self.vault_root.write().await = Some(vault_root.to_path_buf());

        log::info!("Vault initialized successfully at: {}", vault_root.display());
        Ok(())
    }
}
```

---

### 2.4 DTOs and Tauri Commands (`desktop/src-tauri/src/core/commands.rs`)

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct RecentVaultDto {
    pub path: String,
    pub display_name: String,
    pub last_opened: u64,
    pub is_reachable: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettingsDto {
    pub vault_root_path: Option<String>,
    pub is_vault_loaded: bool,
    pub db_path: Option<String>,
    pub storage_dir: Option<String>,
    pub recent_vaults: Vec<RecentVaultDto>,
    pub unreachable_vault_path: Option<String>,
}
```

#### Commands to Expose:
- **`get_app_settings(app, vault)`**: Returns `AppSettingsDto` with reachability populated for all recent vaults.
- **`set_vault_directory(app, vault, path)`**: Validates path, calls `vault.init_vault(&app, &path)`, records MRU in settings, persists config, and returns updated `AppSettingsDto`.
- **`validate_vault_directory(path)`**: Returns `VaultDirectoryStatus` before user commits switch.
- **`remove_recent_vault(app, path)`**: Removes path from MRU in settings and persists config.
- **`reveal_vault_in_explorer(vault)`**: Opens active vault root in Windows Explorer / Finder.

---

## 3. Frontend Architecture (React / TypeScript)

### 3.1 Provider Hierarchy & Keying (`desktop/src/App.tsx`)

```tsx
function AppRoot() {
    const { isVaultLoaded, loading, vaultRootPath } = useAppConfig();

    if (loading) {
        return <AppLoadingSpinner />;
    }

    return (
        <>
            {/* Global Settings modal lives OUTSIDE keyed providers so it stays mounted during switch */}
            <AppSettingsDialog />

            {isVaultLoaded && vaultRootPath ? (
                /* Keyed context trees tear down and remount cleanly on vault switch */
                <CollectionProvider key={vaultRootPath}>
                    <ItemProvider key={vaultRootPath}>
                        <TooltipProvider delayDuration={300}>
                            <AppContent />
                        </TooltipProvider>
                    </ItemProvider>
                </CollectionProvider>
            ) : (
                <FirstRunVaultPicker />
            )}
        </>
    );
}
```

### 3.2 Asset Cache Synchronization (`desktop/src/core/utils/assetResolver.ts`)

When switching vaults in `AppConfigContext`:
```typescript
const selectVault = useCallback(async (path: string) => {
    try {
        setLoading(true);
        setError(null);
        const updated = await appSettingsService.setVaultDirectory(path);
        setSettings(updated);
        // Force asset cache invalidation to point at new storage dir
        await initAssetResolver();
    } finally {
        setLoading(false);
    }
}, []);
```

### 3.3 UI Surfaces

1. **`FirstRunVaultPicker.tsx`**:
   - Detects `unreachable_vault_path`: If user launched app without external drive, displays alert banner: *"Vault at `D:\ExternalVault` is not reachable. Reconnect drive or select another folder."*
   - Displays "Recent Vaults" section below folder browse input, allowing 1-click reopen.
2. **`AppSettingsDialog.tsx`**:
   - Displays current active vault directory and co-located storage paths.
   - Contains "Recent Vaults" list with 1-click "Switch" buttons and "Remove from History" options.
   - Triggers native directory picker on "Change Directory...".

---

## 4. Test & Verification Plan

### Automated Rust Tests
- `tests/config_mru_tests.rs`:
  - Test MRU deduplication, newest-first ordering, and cap at 5 items.
  - Test `prune_missing_vaults` correctly drops deleted directories.
- `tests/vault_lifecycle_tests.rs`:
  - Test `close_vault` executes `PRAGMA wal_checkpoint(TRUNCATE)` and terminates connection.
  - Verify that the SQLite file on Windows can be renamed immediately after `close_vault()` returns (verifying 0 dangling file locks).
- `tests/directory_validation_tests.rs`:
  - Validate `EmptyDirectory`, `ValidExistingVault`, and `PermissionDenied` detection.

### Manual End-to-End Verification
1. **Multi-Vault Switching**:
   - Create Vault A in `D:\TestVaultA` and add Collection "Books".
   - Switch to Vault B in `D:\TestVaultB` and add Collection "Movies".
   - Switch back and forth via `AppSettingsDialog` recent vaults list; verify collections swap cleanly with zero leftover UI state.
2. **Asset Resolution Verification**:
   - Upload cover image in Vault A.
   - Switch to Vault B; verify image is not visible.
   - Switch back to Vault A; verify image renders correctly via Tauri asset protocol.
3. **Unplugged External Drive Simulation**:
   - Configure vault on removable media or rename folder while app is closed.
   - Launch app; verify non-destructive `FirstRunVaultPicker` recovery banner appears and settings file is not wiped.
