# Implementation Tasks

## 1. Database Schema & Migration
- [x] 1.1 Create migration to add `cover_image_path` column (TEXT, nullable) to entries table
- [x] 1.2 Add index on `cover_image_path` for queries filtering by image presence
- [x] 1.3 Update SeaORM entity model (`entities/entry.rs`) to include new field
- [x] 1.4 Test migration on sample database

## 2. Backend Image Storage Module
- [x] 2.1 Create `image/storage.rs` module for file system operations
  - [x] Create app data images directory structure
  - [x] Implement save_local_image(vault_id, entry_id, file_data) -> Result<PathBuf>
  - [x] Implement download_and_save_image(vault_id, entry_id, url) -> Result<PathBuf>
  - [x] Implement delete_image(path) -> Result<()>
  - [x] Handle file naming and organization (<app_data>/images/<vault_id>/<entry_id>.<ext>)
- [x] 2.2 Create `image/processor.rs` module for image processing
  - [x] Implement generate_thumbnail(source_path, max_size) -> Result<Vec<u8>>
  - [x] Support common formats: JPEG, PNG, WebP
  - [x] Optimize thumbnail size (e.g., 300x300 max) for list view performance
- [x] 2.3 Add validation for image files
  - [x] Validate file size limits (e.g., max 10MB)
  - [x] Validate image format/MIME type
  - [x] Sanitize filenames for security

## 3. Backend Service Layer
- [x] 3.1 Update `entry/model.rs` DTOs
  - [x] Add `cover_image_path` field to EntryDto
  - [x] Add `cover_image_url` field to CreateEntryDto (optional)
  - [x] Add `cover_image_url` and `cover_image_file` to UpdateEntryDto
- [x] 3.2 Update `entry/service.rs` EntryService methods
  - [x] Modify create_entry to handle image URL if provided
  - [x] Modify update_entry to handle image changes
  - [x] Modify delete_entry to also delete associated image file
  - [x] Add get_entry_thumbnail(entry_id) -> Result<Vec<u8>> method
- [x] 3.3 Implement image cleanup on entry deletion
  - [x] Delete image file when entry is deleted
  - [x] Handle orphaned images (cleanup utility)

## 4. Backend Tauri Commands
- [x] 4.1 Create `commands/image.rs` with Tauri commands
  - [x] `upload_entry_cover_image(entry_id, file_path)` - Upload from local file system
  - [x] `set_entry_cover_url(entry_id, url)` - Set cover from URL
  - [x] `get_entry_thumbnail(entry_id)` - Get thumbnail as base64/bytes
  - [x] `remove_entry_cover(entry_id)` - Remove cover image
- [x] 4.2 Register new commands in `lib.rs`
- [x] 4.3 Add proper error handling and logging

## 5. Frontend Types & API
- [x] 5.1 Update `types/entry.ts`
  - [x] Add `cover_image_path?: string | null` to Entry interface
  - [x] Add `cover_image_url?: string` to CreateEntryParams
  - [x] Add `cover_image_url?: string` to UpdateEntryParams
- [x] 5.2 Update `api/entry.ts`
  - [x] Add uploadEntryCoverImage(entryId, filePath) function
  - [x] Add setEntryCoverUrl(entryId, url) function
  - [x] Add getEntryThumbnail(entryId) function
  - [x] Add removeEntryCover(entryId) function

## 6. Frontend Components
- [x] 6.1 Create `components/entry/CoverImageUploader.tsx`
  - [x] File upload input with drag & drop support
  - [x] URL input field with validation
  - [x] Preview of selected image before upload
  - [x] Loading states during upload/download
  - [x] Error handling and user feedback
- [x] 6.2 Create `components/entry/CoverImageDisplay.tsx`
  - [x] Display thumbnail in entry list (lazy loading)
  - [x] Display full cover in entry detail view
  - [x] Fallback placeholder for entries without cover
  - [x] Remove cover button with confirmation
- [x] 6.3 Update `components/entry/EntryList.tsx`
  - [x] Add thumbnail column/area to entry rows
  - [x] Implement lazy loading for thumbnails (viewport-based)
  - [x] Handle missing thumbnails gracefully
- [x] 6.4 Update `components/entry/EntryDetail.tsx`
  - [x] Display cover image in detail view
  - [x] Add edit mode for changing cover image
  - [x] Integrate CoverImageUploader component

## 7. Testing
- [ ] 7.1 Backend unit tests
  - [ ] Test image storage functions (save, delete)
  - [ ] Test thumbnail generation
  - [ ] Test URL download functionality
  - [ ] Test validation (file size, format)
- [ ] 7.2 Backend integration tests
  - [ ] Test full flow: create entry with image
  - [ ] Test update entry cover image
  - [ ] Test delete entry removes image
- [ ] 7.3 Frontend component tests
  - [ ] Test file upload component
  - [ ] Test URL input validation
  - [ ] Test thumbnail display
- [ ] 7.4 Manual testing
  - [ ] Test with various image formats (JPEG, PNG, WebP)
  - [ ] Test with large images (performance)
  - [ ] Test URL from different sources
  - [ ] Test error scenarios (invalid URL, network failure)

## 8. Documentation
- [x] 8.1 Update idea.md with completed feature (remove from TODO if present)
- [x] 8.2 Add future consideration: multiple attachments and layout options
- [ ] 8.3 Document image storage structure in architecture docs
- [ ] 8.4 Document API endpoints and usage examples

## Dependencies
- Must complete database migration before service layer changes
- Image storage module must be complete before Tauri commands
- Backend API must be complete before frontend implementation
- Consider parallelizing: Backend work (tasks 1-4) can proceed independently of frontend scaffolding

## Validation Criteria
- ✓ Can upload cover image from local file system
- ✓ Can set cover image from URL
- ✓ Thumbnails display in entry list without performance degradation
- ✓ Full cover image displays in entry detail view
- ✓ Can remove/replace cover images
- ✓ Images are deleted when entry is deleted
- ✓ Works with 10,000+ entries (virtual scrolling + lazy loading)
- ✓ Invalid URLs and files handled gracefully with error messages
