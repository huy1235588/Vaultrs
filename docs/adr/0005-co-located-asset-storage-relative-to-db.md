# Co-located Asset Storage Relative to Database File

Vaultrs manages media assets (images, covers, gallery files, thumbnails) associated with items. We decided that all imported and generated assets must reside in a storage directory co-located with the SQLite database file, never defaulting to OS system directories (such as `AppData` on Windows `C:\` or `~/.local/share`), and that all asset paths persisted in the database must be strictly relative.

## Considered Options

- **OS AppData Directory (`C:\Users\...\AppData\Roaming\Vaultrs\assets`)**: Standard desktop application convention, but scatters large media files across the system drive and breaks portability when a user wants their data on a secondary drive or external disk.
- **Absolute Path Storage**: Persisting absolute system paths (`D:\Data\assets\...`) in the database. Fragile because moving or renaming the vault directory invalidates all asset references.
- **Co-located Relative Storage**: Chosen because storing assets side-by-side with the `.sqlite` file and persisting relative paths makes the entire folder 100% portable, easily backable, and relocatable without broken links.

## Consequences

- The backend filesystem service must dynamically resolve relative asset paths using the active database file's parent directory as its anchor.
- Database backups and migrations can be achieved simply by copying the enclosing folder.
