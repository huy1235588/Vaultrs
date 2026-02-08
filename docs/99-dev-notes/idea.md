# 💡 Ý tưởng Dự án Vaultrs

> File này chứa các ý tưởng cho tính năng mới, cải tiến, và thử nghiệm.
>
> **Quy tắc:**
>
> -   Mỗi ý tưởng phải có status: `[TODO]`, `[IN_PROGRESS]`, `[DONE]`, hoặc `[ARCHIVED]`
> -   Review và cập nhật status mỗi tuần
> -   Ý tưởng `[DONE]` quá 1 tháng nên xóa hoặc chuyển sang file archive

---

## [TODO] Password Strength Analyzer

-   **Ngày tạo:** 2025-12-21
-   **Vấn đề:** User không biết mật khẩu của họ có đủ mạnh không
-   **Trade-off:** ~1 ngày dev, cần integrate thư viện zxcvbn hoặc tương tự
-   **Loại:** UI/UX
-   **Ưu tiên:** Trung bình
-   **Trạng thái:** TODO

**Chi tiết:**

-   Hiển thị thanh màu (đỏ/vàng/xanh) khi user tạo/sửa password
-   Gợi ý cách cải thiện (thêm ký tự đặc biệt, tăng độ dài, etc.)
-   Tích hợp với password generator

---

## [TODO] Biometric Authentication (Fingerprint/Face ID)

-   **Ngày tạo:** 2025-12-21
-   **Vấn đề:** Nhập master password mỗi lần mở app rất bất tiện
-   **Trade-off:** ~1 tuần dev, phụ thuộc vào platform (iOS/Android khác nhau)
-   **Loại:** Security
-   **Ưu tiên:** Cao
-   **Trạng thái:** TODO

**Chi tiết:**

-   Cho phép unlock vault bằng vân tay/Face ID
-   Master password vẫn cần cho lần đầu setup
-   Fallback về master password nếu biometric fail
-   **Security note:** Biometric chỉ unlock, không thay thế encryption key

---

## [TODO] Password History & Audit Log

-   **Ngày tạo:** 2025-12-21
-   **Vấn đề:** User muốn xem lịch sử thay đổi password và ai đã truy cập
-   **Trade-off:** ~3 ngày dev, tăng kích thước vault file
-   **Loại:** Core
-   **Ưu tiên:** Trung bình
-   **Trạng thái:** TODO

**Chi tiết:**

-   Lưu 5 password cũ nhất
-   Log mỗi lần view/copy password (timestamp + device)
-   Cảnh báo nếu password bị reuse
-   Export audit log ra CSV

---

## [TODO] Browser Extension (Chrome/Firefox)

-   **Ngày tạo:** 2025-12-21
-   **Vấn đề:** User phải copy-paste password thủ công từ app
-   **Trade-off:** ~2 tuần dev, cần học WebExtension API và native messaging
-   **Loại:** Add-on
-   **Ưu tiên:** Cao
-   **Trạng thái:** TODO

**Chi tiết:**

-   Auto-fill username/password trên web
-   Detect login form và suggest credentials
-   Native messaging để communicate với Rust backend
-   Support Chrome, Firefox, Edge

---

## [TODO] Secure Password Sharing

-   **Ngày tạo:** 2025-12-21
-   **Vấn đề:** User muốn share password với người khác một cách an toàn
-   **Trade-off:** ~1 tuần dev, cần implement end-to-end encryption cho sharing
-   **Loại:** Security
-   **Ưu tiên:** Thấp
-   **Trạng thái:** TODO

**Chi tiết:**

-   Generate one-time link với expiry time
-   Encrypt password với random key, embed key trong link
-   Link tự hủy sau khi xem hoặc hết hạn
-   Không lưu password trên server

---

## [TODO] Dark Mode

-   **Ngày tạo:** 2025-12-21
-   **Vấn đề:** UI hiện tại chỉ có light mode, gây khó chịu khi dùng ban đêm
-   **Trade-off:** ~2 ngày dev, cần redesign color palette
-   **Loại:** UI/UX
-   **Ưu tiên:** Trung bình
-   **Trạng thái:** TODO

**Chi tiết:**

-   Toggle dark/light mode trong settings
-   Auto-detect system theme preference
-   Ensure contrast ratio đủ cho accessibility (WCAG AA)

---

## [TODO] Import từ Password Managers khác

-   **Ngày tạo:** 2025-12-21
-   **Vấn đề:** User muốn migrate từ LastPass, 1Password, Bitwarden
-   **Trade-off:** ~3 ngày dev, cần parse nhiều format khác nhau
-   **Loại:** Core
-   **Ưu tiên:** Cao
-   **Trạng thái:** TODO

**Chi tiết:**

-   Support import CSV từ các password manager phổ biến
-   Mapping fields (title, username, password, url, notes)
-   Validate và sanitize data trước khi import
-   Show preview trước khi confirm

---

## [TODO] Password Generator với Custom Rules

-   **Ngày tạo:** 2025-12-21
-   **Vấn đề:** Một số website có yêu cầu password kỳ quặc (vd: phải có 1 chữ hoa, 1 số, không quá 16 ký tự)
-   **Trade-off:** ~1 ngày dev
-   **Loại:** UI/UX
-   **Ưu tiên:** Thấp
-   **Trạng thái:** TODO

**Chi tiết:**

-   Cho phép set min/max length
-   Toggle uppercase, lowercase, numbers, symbols
-   Exclude ambiguous characters (0, O, l, 1)
-   Save preset rules

---

## [ARCHIVED] Cloud Sync với Google Drive

-   **Ngày tạo:** 2025-12-21
-   **Vấn đề:** User muốn sync vault giữa nhiều thiết bị
-   **Trade-off:** ~2 tuần dev, phức tạp về conflict resolution
-   **Loại:** Core
-   **Ưu tiên:** Cao
-   **Trạng thái:** ARCHIVED

**Lý do archive:**

-   Quyết định focus vào local-first approach
-   Cloud sync có thể làm sau khi core features ổn định
-   Security concern: không muốn vault file lưu trên cloud của bên thứ 3

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

**Proposal:**

-   OpenSpec change: `add-entry-cover-image`
-   Status: COMPLETED

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

## 📊 Thống kê

-   **Tổng ý tưởng:** 12
-   **TODO:** 10
-   **IN_PROGRESS:** 0
-   **DONE:** 1
-   **ARCHIVED:** 1

---

_Cập nhật lần cuối: 2026-02-08_
