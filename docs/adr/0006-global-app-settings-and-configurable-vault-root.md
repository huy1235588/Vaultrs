# Global App Settings and Configurable Co-located Vault Root

Vaultrs requires that user metadata databases and binary assets remain fully portable, self-contained, and free from forced placement on the OS system drive (`C:\`). We decided to implement a Global App Settings architecture with an app-level bootstrap configuration file storing machine-level preferences (specifically `vault_root_path`). The desktop UI exposes an App Settings surface with a native directory picker allowing users to configure or switch their root Vault directory. Both `vaultrs.db` and the `vault-storage/` assets directory are strictly resolved as co-located siblings inside this user-selected `vault_root_path`.

## Considered Options

- **Hardcoded OS AppData (`%APPDATA%` / `~/.local/share`)**: Rejected because it scatters large media datasets onto the OS system drive and prevents storing vaults on external or secondary drives.
- **Fixed Executable-Relative Storage**: Fails when the application is installed in write-protected system directories (e.g., `C:\Program Files` or macOS `/Applications`).
- **Global Bootstrap Config with UI Directory Picker**: Chosen because a minimal machine config file (located in standard user config) decouples the app binary from data storage, giving the user total control over where their data lives while guaranteeing co-location.

## Consequences

- The app must provide an initial setup flow if `vault_root_path` is not yet configured.
- `desktop/src-tauri/src/core/config.rs` must be refactored to load `vault_root_path` from the bootstrap config instead of deriving database and storage paths directly from `app.path().app_data_dir()`.
- Switching the vault directory at runtime requires safely closing the active SQLite connection pool and re-initializing database and asset managers.
