# Change: Add Cover Image Support for Entries

## Why

Entries currently lack visual representation, making large collections difficult to navigate and identify quickly. Adding cover image support enhances user experience by providing visual context for each entry, particularly useful for media collections (movies, books, photos, etc.) where thumbnails significantly improve browsability.

## What Changes

- Add cover image storage capability for entries (single image per entry)
- Support two image sources: local file upload and URL from internet
- Store images in app data folder (file system) for optimal performance with large images
- Display thumbnails in entry list view for quick visual identification
- Extend database schema to track cover image metadata
- Implement image processing for thumbnail generation
- Add UI components for image upload, URL input, and thumbnail display

**Future considerations (not in this change):**
- Multiple image/video/file attachments per entry
- Image layout options (portrait/square/landscape)

## Impact

### Affected Specs
- **entry-management**: Core CRUD operations modified to handle cover images
- **New capability**: entry-cover-image (image storage, retrieval, and display)

### Affected Code

#### Backend (Rust/Tauri)
- `desktop/src-tauri/src/entities/entry.rs` - Add cover_image_path column
- `desktop/src-tauri/src/entry/model.rs` - Update DTOs with image fields
- `desktop/src-tauri/src/entry/service.rs` - Add image management logic
- `desktop/src-tauri/src/image/` - New module for image processing
- `desktop/src-tauri/src/commands/` - New image-related Tauri commands
- Database migration for schema change

#### Frontend (React/TypeScript)
- `desktop/src/types/entry.ts` - Update Entry interface
- `desktop/src/api/entry.ts` - Add image upload/URL endpoints
- `desktop/src/components/entry/` - Add image upload components
- `desktop/src/components/entry/EntryList.tsx` - Display thumbnails
- `desktop/src/components/entry/EntryDetail.tsx` - Display full cover image

### Breaking Changes
None - this is additive functionality. Existing entries without cover images continue working as before.

### Migration Notes
- Database migration adds nullable `cover_image_path` column to entries table
- Existing entries default to NULL (no cover image)
- App data folder structure: `<app_data>/images/<vault_id>/<entry_id>.<ext>`
