# 💡 Ý tưởng Dự án Vaultrs

> File này chứa các ý tưởng cho tính năng mới, cải tiến, và thử nghiệm.
>
> **Quy tắc:**
>
> -   Mỗi ý tưởng phải có status: `[TODO]`, `[IN_PROGRESS]`, `[DONE]`, hoặc `[ARCHIVED]`
> -   Review và cập nhật status mỗi tuần
> -   Ý tưởng `[DONE]` quá 1 tháng nên xóa hoặc chuyển sang file archive

---

## [TODO] Search Custom Field Values

-   **Ngày tạo:** 2026-01-10
-   **Vấn đề:** User muốn search entries dựa trên giá trị của custom fields (vd: search theo rating, author, tags)
-   **Trade-off:** ~2 ngày dev, cần extend FTS5 index hoặc JSON search
-   **Loại:** Core
-   **Ưu tiên:** Trung bình
-   **Trạng thái:** TODO

**Chi tiết:**

-   Extend current FTS5 search để include custom field values
-   Support search theo field type (text, select values, etc.)
-   Có thể filter theo specific field (vd: `author:Tolkien`)
-   Performance consideration: JSON parsing có thể chậm với large datasets

**Phụ thuộc:**

-   Cần hoàn thành `add-vault-entry-search` (basic search on title/description) trước

---

## [DONE] Entry Cover Image

-   **Ngày tạo:** 2026-01-10
-   **Ngày hoàn thành:** 2026-02-08
-   **Vấn đề:** Entries thiếu visual representation, khó browse và identify nhanh trong large collections
-   **Trade-off:** ~1 tuần dev, cần implement image storage và thumbnail generation
-   **Loại:** Core
-   **Ưu tiên:** Cao
-   **Trạng thái:** DONE

**Chi tiết:**

-   Mỗi entry có 1 cover image
-   Nguồn ảnh: Upload từ local file system hoặc paste URL từ internet
-   Lưu ảnh trong app data folder (file system) - tốt cho large images
-   Hiển thị thumbnail trong entry list (lazy loading)
-   Mục đích: chỉ lưu dữ liệu, enhance browsability

**Implementation completed:**

-   ✅ Database schema updated with cover_image_path column
-   ✅ ImageStorage and ImageProcessor modules
-   ✅ EntryImageService for business logic
-   ✅ Tauri commands for frontend integration
-   ✅ React components: CoverImageUploader, CoverImageDisplay
-   ✅ Comprehensive unit and integration tests
-   ✅ Documentation in architecture and API docs

**Future enhancements (out of scope for v1):**

-   Support multiple attachments (images/videos/files) per entry
-   Layout options: portrait vs square vs landscape display modes
-   Image editing: crop, rotate, resize
-   Bulk operations: upload covers for multiple entries
-   Auto-fetch covers from metadata APIs (TMDB, Open Library, etc.)

---

## [TODO] Per-Vault Custom Theme

-   **Ngày tạo:** 2026-02-04
-   **Vấn đề:** Tất cả vault đều dùng chung một theme, user muốn cá nhân hóa giao diện cho từng vault để dễ phân biệt
-   **Trade-off:** ~2-3 ngày dev, cần refactor theme system để support context-based theming
-   **Loại:** UI/UX
-   **Ưu tiên:** Thấp
-   **Trạng thái:** TODO

**Chi tiết:**

-   Mỗi vault có thể set theme riêng (light/dark/custom colors)
-   Theme được lưu trong vault metadata
-   Auto-switch theme khi chuyển vault
-   Preset themes: Default, Ocean, Forest, Sunset, Midnight, etc.
-   Custom accent color picker
-   Override global theme setting khi vault có custom theme

**Lợi ích:**

-   Visual distinction giữa các vault (work vs personal)
-   Better UX cho users có nhiều vaults
-   Tăng personalization

---

## [TODO] Plugin System Architecture

-   **Ngày tạo:** 2026-02-04
-   **Vấn đề:** App hiện tại là monolithic, user không thể extend functionality theo nhu cầu riêng
-   **Trade-off:** ~2-3 tuần dev, cần design plugin API và sandbox environment
-   **Loại:** Core
-   **Ưu tiên:** Trung bình
-   **Trạng thái:** TODO

**Chi tiết:**

-   Plugin API cho phép third-party extend app functionality
-   Sandbox environment để isolate plugins (security)
-   Plugin marketplace hoặc manual install
-   Plugin types: UI extensions, data processors, integrations
-   Version compatibility checking

**Plugin Ideas:**

### 1. Web Scraper / Data Crawler

-   **Mô tả:** Tự động crawl dữ liệu từ website và tạo entries
-   **Use cases:**
    -   Crawl danh sách phim từ IMDB/TMDB
    -   Scrape sách từ Goodreads
    -   Import game từ Steam library
    -   Lấy thông tin anime từ MyAnimeList
-   **Features:**
    -   Custom selector rules (CSS/XPath)
    -   Field mapping (title, description, cover image, etc.)
    -   Batch import với progress tracking
    -   Schedule periodic re-crawl để update data
    -   Respect robots.txt và rate limiting

### 2. Time Tracker / Pomodoro Timer

-   **Mô tả:** Track thời gian dành cho mỗi entry (watching, reading, playing)
-   **Use cases:**
    -   Đếm giờ xem phim/anime
    -   Track reading time cho sách
    -   Log playtime cho games
    -   Pomodoro sessions cho tasks
-   **Features:**
    -   Start/pause/stop timer
    -   Auto-pause khi inactive
    -   Daily/weekly/monthly statistics
    -   Custom field để lưu total time
    -   Reminder notifications
    -   Export time logs

### 3. Music Player / Audio Integration

-   **Mô tả:** Phát nhạc/audio trực tiếp trong app
-   **Use cases:**
    -   Nghe soundtrack của game/movie
    -   Play audiobook
    -   Background music khi browse collection
    -   Podcast player
-   **Features:**
    -   Mini player trong app
    -   Link audio files với entries
    -   Playlist từ vault entries
    -   Stream từ local files hoặc URLs
    -   Integration với Spotify/Apple Music API (metadata only)

### 4. AI Assistant / Smart Tagging

-   **Mô tả:** Sử dụng AI để auto-tag và suggest metadata
-   **Use cases:**
    -   Auto-generate tags từ description
    -   Suggest similar entries
    -   Smart search với natural language
    -   Content summarization
-   **Features:**
    -   Local AI models (Ollama) hoặc cloud APIs (OpenAI)
    -   Privacy-first: optional cloud features
    -   Batch processing cho existing entries
    -   Custom prompt templates

### 5. Calendar / Scheduling

-   **Mô tả:** Lên lịch và reminder cho entries
-   **Use cases:**
    -   Release date tracking (games, movies, books)
    -   Reading/watching schedule
    -   Deadline reminders
    -   Episode airing schedule
-   **Features:**
    -   Calendar view
    -   Sync với Google Calendar/iCal
    -   Push notifications
    -   Recurring events

### 6. Statistics Dashboard

-   **Mô tả:** Visualize collection data với charts và graphs
-   **Use cases:**
    -   Entries by category/status over time
    -   Rating distribution
    -   Most active periods
    -   Collection growth trends
-   **Features:**
    -   Interactive charts (bar, pie, line)
    -   Custom date ranges
    -   Export reports (PDF, PNG)
    -   Comparison between vaults

### 7. Social Sharing / Export

-   **Mô tả:** Share collection hoặc specific entries lên social media
-   **Use cases:**
    -   Share "Currently watching" status
    -   Export "Top 10" lists
    -   Generate shareable images
    -   Blog integration
-   **Features:**
    -   Template-based image generation
    -   Social media integration (Twitter, Mastodon)
    -   Public profile/list page (optional)
    -   RSS feed generation

### 8. Backup & Sync Service

-   **Mô tả:** Cloud backup và cross-device sync
-   **Use cases:**
    -   Automatic backup to cloud storage
    -   Sync between PC and mobile
    -   Version history
-   **Features:**
    -   Support multiple providers (Google Drive, Dropbox, OneDrive)
    -   End-to-end encryption
    -   Conflict resolution
    -   Selective sync

### 9. External API Integrations

-   **Mô tả:** Connect với external services để enrich data
-   **Use cases:**
    -   Auto-fetch movie info từ TMDB
    -   Get book details từ Open Library
    -   Import game achievements từ Steam
    -   Sync reading progress từ Kindle
-   **Features:**
    -   API key management
    -   Field mapping configuration
    -   Batch update existing entries
    -   Webhook support

### 10. Note Taking / Markdown Editor

-   **Mô tả:** Enhanced note-taking với rich text support
-   **Use cases:**
    -   Review/notes cho mỗi entry
    -   Wiki-style linked notes
    -   Code snippets storage
-   **Features:**
    -   Markdown editor với preview
    -   Image embedding
    -   Internal linking giữa entries
    -   Export to PDF/HTML

**Technical Considerations:**

-   **Plugin Format:** WebAssembly (WASM) cho performance và security
-   **UI Extensions:** React components với defined extension points
-   **Data Access:** Controlled API, plugins không access DB trực tiếp
-   **Permissions:** Granular permission system (network, file system, etc.)
-   **Distribution:** Plugin registry với review process

---

## Archived Ideas (Password Manager Era)

> Các ý tưởng dưới đây thuộc giai đoạn Vaultrs còn là **password manager** (trước 2026-01).
> Concept sản phẩm đã thay đổi sang **personal metadata vault** — các ý tưởng này không còn phù hợp.

<details>
<summary>Click to expand archived ideas</summary>

### [ARCHIVED] Password Strength Analyzer
- **Ngày tạo:** 2025-12-21 | **Lý do archive:** Concept sản phẩm thay đổi

### [ARCHIVED] Biometric Authentication
- **Ngày tạo:** 2025-12-21 | **Lý do archive:** Concept sản phẩm thay đổi

### [ARCHIVED] Password History & Audit Log
- **Ngày tạo:** 2025-12-21 | **Lý do archive:** Concept sản phẩm thay đổi

### [ARCHIVED] Browser Extension (Chrome/Firefox)
- **Ngày tạo:** 2025-12-21 | **Lý do archive:** Concept sản phẩm thay đổi

### [ARCHIVED] Secure Password Sharing
- **Ngày tạo:** 2025-12-21 | **Lý do archive:** Concept sản phẩm thay đổi

### [ARCHIVED] Dark Mode
- **Ngày tạo:** 2025-12-21 | **Lý do archive:** Concept sản phẩm thay đổi — Per-Vault Custom Theme thay thế

### [ARCHIVED] Import từ Password Managers khác
- **Ngày tạo:** 2025-12-21 | **Lý do archive:** Concept sản phẩm thay đổi

### [ARCHIVED] Password Generator với Custom Rules
- **Ngày tạo:** 2025-12-21 | **Lý do archive:** Concept sản phẩm thay đổi

### [ARCHIVED] Cloud Sync với Google Drive
- **Ngày tạo:** 2025-12-21 | **Lý do archive:** Focus vào local-first approach, concept sản phẩm thay đổi

</details>

---

## 📊 Thống kê

-   **Tổng ý tưởng:** 12
-   **TODO:** 3 (Search Custom Fields, Per-Vault Theme, Plugin System)
-   **IN_PROGRESS:** 0
-   **DONE:** 1 (Entry Cover Image)
-   **ARCHIVED:** 9

---

_Cập nhật lần cuối: 2026-07-16_
