# Design: Entry Cover Image System

## Context

Vaultrs manages large-scale collections (10M+ entries) and needs to add visual representation for entries. The primary use case is enhancing browsability by displaying thumbnails in the entry list. The system must handle:

1. Large image files without impacting performance
2. Two image sources: local file upload and URLs from the internet
3. Efficient thumbnail generation and display
4. File system storage in app data folder
5. Clean-up of orphaned images

### Constraints
- Desktop-only application (Tauri/Rust backend)
- Embedded SQLite database
- Must work offline (except URL downloads)
- Virtual scrolling for 10M+ entries requires efficient thumbnail loading
- Single cover image per entry (multiple attachments reserved for future)

### Stakeholders
- Users managing media collections (movies, books, photos)
- Users wanting visual identification of entries
- Future: users wanting multiple attachments (out of scope)

## Goals / Non-Goals

### Goals
- ✅ Store single cover image per entry
- ✅ Support local file upload and URL download
- ✅ Generate optimized thumbnails for list view
- ✅ Store images in file system (not database blobs)
- ✅ Lazy load thumbnails for performance
- ✅ Clean up images on entry deletion
- ✅ Maintain offline capability (except URL downloads)

### Non-Goals
- ❌ Multiple images per entry (future consideration)
- ❌ Video/file attachments (future consideration)
- ❌ Image editing capabilities (crop, rotate, filters)
- ❌ Image layout options (portrait/square/landscape) - future
- ❌ Cloud storage integration
- ❌ Image compression/optimization (beyond thumbnail generation)

## Decisions

### Decision 1: File System Storage vs Database Blobs

**Chosen:** Store images as files in app data directory

**Rationale:**
- Better performance for large images (no memory overhead from loading blobs)
- Easier to manage, backup, and inspect
- Thumbnails can be cached separately
- Standard for desktop applications
- Database stays focused on structured data

**Alternatives Considered:**
- **SQLite BLOB storage:** Rejected due to database size bloat, slower queries, and difficulty managing large binary data in SQLite
- **External service (cloud):** Rejected to maintain offline-first architecture

**Trade-offs:**
- ✅ Pros: Better performance, easier management, standard approach
- ⚠️ Cons: Need to manage file cleanup, potential orphaned files if delete fails

### Decision 2: Image Organization Structure

**Chosen:** `<app_data>/images/<vault_id>/<entry_id>.<ext>`

**Rationale:**
- Vault-based organization allows easy vault deletion cleanup
- Entry ID as filename prevents collisions
- Extension preserved for format identification
- Simple, flat structure (no deep nesting)

**Example:**
```
C:\Users\User\AppData\Roaming\vaultrs\images\
  ├── 1\                    # vault_id = 1
  │   ├── 42.jpg            # entry_id = 42
  │   ├── 43.png
  │   └── 44.webp
  └── 2\                    # vault_id = 2
      └── 100.jpg
```

**Alternatives Considered:**
- **Hash-based names:** Rejected - harder to debug, no collision prevention needed with entry IDs
- **Thumbnails in separate folder:** Rejected - complicates management, can generate on-the-fly

### Decision 3: Thumbnail Generation Strategy

**Chosen:** Generate thumbnails on-demand, cache in memory (future: disk cache)

**Rationale:**
- Simple initial implementation
- On-demand generation avoids upfront cost
- Memory cache covers common use case (browsing current view)
- Can add disk cache later if needed

**Specifications:**
- Max thumbnail size: 300x300 pixels (maintains aspect ratio)
- Format: JPEG for universal compatibility and smaller size
- Quality: 85% (balance between size and quality)

**Alternatives Considered:**
- **Pre-generate thumbnails on upload:** Adds complexity, wastes space if thumbnails never viewed
- **No caching:** Too slow, regenerating on every scroll is expensive

### Decision 4: Image Processing Library

**Chosen:** `image` crate (Rust)

**Rationale:**
- Pure Rust, no C dependencies
- Supports JPEG, PNG, WebP, GIF
- Efficient thumbnail generation with filtering
- Well-maintained, widely used (10M+ downloads)

**Alternatives Considered:**
- **imagemagick bindings:** Overkill, requires external dependency
- **libvips:** Powerful but heavy, not needed for simple thumbnails

### Decision 5: URL Download Strategy

**Chosen:** Download to temp file, validate, then move to final location

**Rationale:**
- Validate image format before committing
- Prevent partial downloads from corrupting storage
- Can retry on failure without cleanup complexity

**Flow:**
```rust
async fn download_and_save_image(entry_id, url) -> Result<PathBuf> {
    let temp_path = download_to_temp(url).await?;
    validate_image_format(&temp_path)?;
    let final_path = get_image_path(entry_id);
    std::fs::rename(temp_path, &final_path)?;
    Ok(final_path)
}
```

**Alternatives Considered:**
- **Stream directly to final location:** Risky if download fails or invalid format
- **Keep in memory:** Bad for large images

### Decision 6: Database Schema

**Chosen:** Add nullable `cover_image_path` column (TEXT) to entries table

```sql
ALTER TABLE entries ADD COLUMN cover_image_path TEXT NULL;
```

**Rationale:**
- Simple, follows existing schema patterns
- Nullable: existing entries continue working
- Relative path stored (relative to app data images directory)
- Full path constructed at runtime for OS portability

**Example values:**
- `"1/42.jpg"` (vault_id=1, entry_id=42)
- `NULL` (no cover image)

**Alternatives Considered:**
- **Separate images table:** Overkill for single image per entry, violates YAGNI
- **Store full path:** Non-portable across OS, harder to migrate app data location

### Decision 7: Frontend Thumbnail Loading

**Chosen:** Lazy loading with Intersection Observer + virtual scrolling

**Rationale:**
- Only load thumbnails visible in viewport
- Integrates with existing TanStack Virtual implementation
- Excellent performance for 10M+ entries

**Implementation:**
```typescript
// Load thumbnail when entry row enters viewport
useEffect(() => {
  if (isIntersecting && !thumbnail) {
    loadThumbnail(entry.id);
  }
}, [isIntersecting, entry.id]);
```

**Alternatives Considered:**
- **Eager loading:** Would load all thumbnails, kills performance with large lists
- **Pagination-based loading:** Already have virtual scrolling, intersection observer is better

### Decision 8: Image Validation & Limits

**Chosen:** Enforce limits at upload time

**Limits:**
- Max file size: 10MB
- Allowed formats: JPEG, PNG, WebP, GIF
- Dimensions: No limit (thumbnail generation handles scaling)

**Rationale:**
- 10MB covers 99% of use cases while preventing abuse
- Common formats cover all image types users need
- Dimension limits unnecessary since we generate thumbnails

**Validation:**
- File size: Check before processing
- Format: Use `image` crate to decode header
- Security: Sanitize filenames, no path traversal

## Risks / Trade-offs

### Risk 1: Orphaned Images

**Risk:** If entry deletion fails after image deletion (or vice versa), orphaned files remain

**Mitigation:**
- Delete image AFTER database transaction succeeds
- Provide cleanup utility command to scan for orphaned images
- Log failed deletions for manual intervention

### Risk 2: Storage Space Growth

**Risk:** Large collections with images consume significant disk space

**Mitigation:**
- Document storage requirements for users
- Provide image statistics (total size, count)
- Future: Add cleanup tool to remove images for deleted entries

### Risk 3: URL Download Failures

**Risk:** Network failures, invalid URLs, blocked domains

**Mitigation:**
- Show clear error messages to user
- Timeout after 30 seconds
- Allow retry
- Log failed URLs for debugging

### Risk 4: Performance with 10M+ Entries

**Risk:** Loading thumbnails could slow down virtual scrolling

**Mitigation:**
- Lazy loading with Intersection Observer
- Memory cache for recently viewed thumbnails
- Thumbnail size optimized (300x300, JPEG 85%)
- Future: Add disk cache if memory cache insufficient

## Migration Plan

### Phase 1: Database Migration (Zero Downtime)

1. Run migration to add `cover_image_path` column (nullable)
2. Existing entries default to NULL
3. No code changes required yet - backward compatible

### Phase 2: Backend Implementation

1. Implement image storage module
2. Update entry service to handle images
3. Add Tauri commands
4. Test with sample images

### Phase 3: Frontend Implementation

1. Update types and API layer
2. Implement image upload components
3. Add thumbnail display to entry list
4. Add cover display to entry detail

### Phase 4: Testing & Refinement

1. Test with large image collections
2. Verify virtual scrolling performance
3. Test edge cases (network failures, invalid formats)
4. Gather user feedback

### Rollback Plan

If critical issues found:
1. Remove frontend code (users see no cover images)
2. Backend code remains but unused (no harm)
3. Database column remains (nullable, no data loss)
4. Can revert database if needed: `ALTER TABLE entries DROP COLUMN cover_image_path;`

## Open Questions

1. **Q:** Should we support SVG images?
   - **A:** Not in v1 - security concerns with embedded scripts. Can add later if needed.

2. **Q:** Should thumbnails be cached to disk?
   - **A:** Not initially. Start with memory cache, add disk cache if performance issues arise.

3. **Q:** How to handle animated GIFs?
   - **A:** Display first frame as thumbnail. Future: could support animation in detail view.

4. **Q:** Should we validate URLs before download (HEAD request)?
   - **A:** Yes, add HEAD request to check content-type and size before downloading.

5. **Q:** What happens if user moves app data folder?
   - **A:** Paths are relative to app data root, so images move with it. Document this behavior.

## Future Enhancements (Out of Scope)

As noted in idea.md, these features may be added later:

1. **Multiple attachments:** Support multiple images/videos/files per entry
2. **Layout options:** Portrait, square, landscape display modes
3. **Image editing:** Basic crop, rotate, resize
4. **Bulk operations:** Upload covers for multiple entries at once
5. **Auto-fetch:** Automatically fetch cover images from metadata APIs (TMDB, Open Library, etc.)
