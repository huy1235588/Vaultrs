# entry-cover-image Specification

## Purpose

Enable visual representation of entries through cover images, supporting upload from local file system and URLs, with optimized thumbnail generation for list display.

## ADDED Requirements

### Requirement: Upload Cover Image from Local File

The system SHALL allow users to upload a cover image for an entry from their local file system.

#### Scenario: Successful local file upload

- **GIVEN** an entry exists in the active vault
- **WHEN** the user uploads a local image file (JPEG, PNG, WebP, or GIF under 10MB)
- **THEN** the image is saved to `<app_data>/images/<vault_id>/<entry_id>.<ext>`
- **AND** the entry's `cover_image_path` is updated in the database
- **AND** the thumbnail is generated and displayed in the entry list

#### Scenario: Upload file exceeds size limit

- **GIVEN** an entry exists
- **WHEN** the user attempts to upload an image larger than 10MB
- **THEN** the system displays an error "Image size exceeds 10MB limit"
- **AND** the upload is rejected
- **AND** the entry's cover image remains unchanged

#### Scenario: Upload invalid file format

- **GIVEN** an entry exists
- **WHEN** the user attempts to upload a non-image file or unsupported format
- **THEN** the system displays an error "Invalid image format. Supported: JPEG, PNG, WebP, GIF"
- **AND** the upload is rejected

---

### Requirement: Set Cover Image from URL

The system SHALL allow users to set a cover image for an entry by providing a URL from the internet.

#### Scenario: Successful URL download

- **GIVEN** an entry exists in the active vault
- **WHEN** the user provides a valid image URL
- **THEN** the system downloads the image to a temporary location
- **AND** validates the image format
- **AND** moves the image to `<app_data>/images/<vault_id>/<entry_id>.<ext>`
- **AND** the entry's `cover_image_path` is updated in the database
- **AND** the thumbnail is displayed in the entry list

#### Scenario: URL download fails

- **GIVEN** an entry exists
- **WHEN** the user provides a URL that fails to download (network error, 404, timeout)
- **THEN** the system displays an error "Failed to download image from URL: [reason]"
- **AND** no image file is created
- **AND** the entry's cover image remains unchanged

#### Scenario: URL points to invalid image

- **GIVEN** an entry exists
- **WHEN** the user provides a URL that downloads successfully but is not a valid image
- **THEN** the system displays an error "URL does not point to a valid image"
- **AND** the temporary file is deleted
- **AND** the entry's cover image remains unchanged

#### Scenario: URL download timeout

- **GIVEN** an entry exists
- **WHEN** the user provides a URL and the download takes longer than 30 seconds
- **THEN** the system displays an error "Download timed out after 30 seconds"
- **AND** the download is cancelled

---

### Requirement: Generate and Display Thumbnails

The system SHALL generate optimized thumbnails for cover images and display them in the entry list.

#### Scenario: Display thumbnail in entry list

- **GIVEN** an entry has a cover image
- **WHEN** the entry row is visible in the viewport
- **THEN** the system loads the thumbnail (max 300x300 pixels, JPEG 85% quality)
- **AND** displays it in the entry list row
- **AND** maintains aspect ratio

#### Scenario: Display placeholder for missing cover

- **GIVEN** an entry does not have a cover image
- **WHEN** the entry row is displayed in the list
- **THEN** a placeholder icon or empty state is shown
- **AND** the entry remains functional

#### Scenario: Lazy load thumbnails on scroll

- **GIVEN** a vault contains 10,000+ entries with cover images
- **WHEN** the user scrolls through the entry list
- **THEN** only thumbnails for visible entries plus overscan buffer are loaded
- **AND** scrolling remains smooth without lag
- **AND** thumbnails are loaded as entries enter the viewport

---

### Requirement: Display Full Cover Image in Detail View

The system SHALL display the full-resolution cover image in the entry detail view.

#### Scenario: View full cover image

- **GIVEN** an entry has a cover image
- **WHEN** the user opens the entry detail dialog
- **THEN** the full cover image is displayed at the top of the dialog
- **AND** the image scales to fit the available space while maintaining aspect ratio

#### Scenario: Detail view without cover image

- **GIVEN** an entry does not have a cover image
- **WHEN** the user opens the entry detail dialog
- **THEN** no cover image area is shown or a placeholder is displayed
- **AND** other entry details are displayed normally

---

### Requirement: Replace or Remove Cover Image

The system SHALL allow users to replace or remove an entry's cover image.

#### Scenario: Replace existing cover image

- **GIVEN** an entry has a cover image
- **WHEN** the user uploads a new image or provides a new URL
- **THEN** the old image file is deleted from the file system
- **AND** the new image is saved to `<app_data>/images/<vault_id>/<entry_id>.<ext>`
- **AND** the entry's `cover_image_path` is updated
- **AND** the thumbnail in the entry list reflects the new image

#### Scenario: Remove cover image

- **GIVEN** an entry has a cover image
- **WHEN** the user clicks "Remove Cover Image" and confirms
- **THEN** the image file is deleted from the file system
- **AND** the entry's `cover_image_path` is set to NULL
- **AND** the entry list shows the placeholder for this entry

#### Scenario: Remove cover with confirmation

- **GIVEN** an entry has a cover image
- **WHEN** the user clicks "Remove Cover Image"
- **THEN** a confirmation dialog appears asking "Are you sure you want to remove this cover image?"
- **WHEN** the user confirms
- **THEN** the cover image is removed as per the previous scenario

---

### Requirement: Clean Up Images on Entry Deletion

The system SHALL automatically delete an entry's cover image file when the entry is deleted.

#### Scenario: Delete entry with cover image

- **GIVEN** an entry has a cover image at path `<app_data>/images/1/42.jpg`
- **WHEN** the user deletes the entry
- **THEN** the entry is removed from the database
- **AND** the cover image file `<app_data>/images/1/42.jpg` is deleted from the file system
- **AND** the entry disappears from the list

#### Scenario: Handle deletion failure gracefully

- **GIVEN** an entry has a cover image
- **WHEN** the entry is deleted successfully but the image file deletion fails (e.g., file locked)
- **THEN** the entry is still removed from the database
- **AND** an error is logged for manual cleanup
- **AND** the user sees a warning "Entry deleted but cover image cleanup failed"

---

### Requirement: Image Storage Organization

The system SHALL organize cover images in the file system using a structured directory hierarchy.

#### Scenario: Store image in vault-specific folder

- **GIVEN** an entry belongs to vault with ID 1
- **WHEN** a cover image is saved for entry with ID 42
- **THEN** the image is stored at path `<app_data>/images/1/42.<ext>`
- **WHERE** `<app_data>` is the application data directory
- **AND** `<ext>` is the original file extension (jpg, png, webp, gif)

#### Scenario: Create directories on demand

- **GIVEN** the images directory structure does not exist yet
- **WHEN** the first cover image is uploaded for vault 1
- **THEN** the system creates `<app_data>/images/` directory
- **AND** creates `<app_data>/images/1/` subdirectory
- **AND** saves the image file

#### Scenario: Use entry ID to prevent collisions

- **GIVEN** vault 1 has entries with IDs 42 and 43
- **WHEN** cover images are uploaded for both entries
- **THEN** entry 42's image is stored as `<app_data>/images/1/42.jpg`
- **AND** entry 43's image is stored as `<app_data>/images/1/43.png`
- **AND** no filename collisions occur

---

### Requirement: Image Format Support

The system SHALL support common image formats for cover images.

#### Scenario: Accept JPEG images

- **WHEN** the user uploads a JPEG image (.jpg, .jpeg)
- **THEN** the image is processed and stored successfully

#### Scenario: Accept PNG images

- **WHEN** the user uploads a PNG image (.png)
- **THEN** the image is processed and stored successfully

#### Scenario: Accept WebP images

- **WHEN** the user uploads a WebP image (.webp)
- **THEN** the image is processed and stored successfully

#### Scenario: Accept GIF images

- **WHEN** the user uploads a GIF image (.gif)
- **THEN** the first frame is extracted for the thumbnail
- **AND** the original GIF is stored as the cover image

#### Scenario: Reject unsupported formats

- **WHEN** the user uploads a file with extension .bmp, .tiff, .svg, or other unsupported format
- **THEN** the system displays an error "Unsupported image format"
- **AND** the upload is rejected
