# 📋 Đặc tả Thiết kế Database - Hệ thống Vaultrs

> **Mục tiêu:** Đặc tả kiến trúc dữ liệu đầy đủ của hệ thống Vaultrs — bao gồm schema lõi (Collections, CollectionSettings, Attributes, Items, Full-Text Search) và schema Media (Asset, ItemAsset, Thumbnail/Preview) — dưới dạng mô tả thiết kế thuần túy.
>
> **Phạm vi tài liệu:** Chỉ mô tả entities, relationships, indexes, constraints, hiệu năng và các đánh đổi thiết kế. Tài liệu này **không chứa migration script và không chứa câu lệnh SQL** dưới bất kỳ hình thức nào — việc hiện thực hoá (DDL, trigger, câu lệnh truy vấn) thuộc về giai đoạn implementation, nằm ngoài phạm vi đặc tả.

---

## 📋 TL;DR

| Entity                     | Vai trò                                                                    | Quan hệ chính                                                       | Quy mô ước tính                   |
| -------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------- |
| **Collections**            | Định nghĩa metadata cho từng "bộ sưu tập" (Movies, Books...)               | 1 - N với Attributes, 1 - N với Items, 1 - 1 với CollectionSettings | ~100                              |
| **CollectionSettings**     | Thiết lập cấu hình theo Collection (appearance, media, behavior) dạng JSON | 1 - 1 với Collections                                               | ~100 (khớp Collections)           |
| **Attributes**             | Định nghĩa custom field theo từng Collection                               | N - 1 với Collections                                               | ~1.000                            |
| **Items**                  | Bản ghi dữ liệu chính, thuộc tính tuỳ biến lưu dạng JSON                   | N - 1 với Collections, 1 - N với ItemAssets                         | 10.000.000+                       |
| **Full-Text Search Index** | Chỉ mục tìm kiếm toàn văn, phản chiếu từ Items                             | 1 - 1 (đồng bộ) với Items                                           | Ảo (Virtual), không lưu trữ riêng |
| **Assets**                 | Metadata tài nguyên media (Local hoặc Remote URL), hỗ trợ cache offline    | 1 - N với ItemAssets                                                | Tuỳ mức dùng Media (opt-in)       |
| **ItemAssets**             | Bảng liên kết Item ↔ Asset, mang theo vai trò (role) đa dạng               | N - 1 với Items, N - 1 với Assets                                   | ≥ Assets                          |

---

## 1. 🧭 Nguyên tắc thiết kế tổng quan

1. **Dynamic Schema (EAV lai JSON):** thay vì mô hình EAV thuần (một bảng giá trị riêng cho mỗi thuộc tính), Vaultrs dùng một cột JSON (`properties`) trên `items` để lưu toàn bộ custom field, còn `attributes` chỉ đóng vai trò "định nghĩa schema" (tên field, kiểu dữ liệu, ràng buộc hiển thị). Lựa chọn này đánh đổi khả năng lọc/sắp xếp trực tiếp ở tầng DB để lấy tốc độ đọc một bản ghi Item chỉ với một dòng, không cần JOIN nhiều bảng giá trị — quan trọng khi Item đạt quy mô 10 triệu+.
2. **Local-first & Portable:** toàn bộ dữ liệu (database + file media) nằm trong một thư mục Vault duy nhất trên máy người dùng, không phụ thuộc cloud; mọi đường dẫn tệp lưu trong DB đều là **đường dẫn tương đối** để Vault có thể di chuyển giữa các máy mà không hỏng liên kết. Đối với Asset nguồn Remote (URL), hệ thống hỗ trợ cache bản sao cục bộ vào Vault Storage để phục vụ offline.
3. **Hiệu năng ưu tiên hàng đầu:** hệ quản trị DB chạy ở chế độ cho phép đọc đồng thời trong lúc ghi (WAL Mode), giúp các thao tác nền (sinh Thumbnail, cache ảnh Remote, cập nhật metadata) không chặn các truy vấn phục vụ cuộn ảo (Virtualization) đang diễn ra song song trên UI.
4. **Tối giản bảng chính:** bảng `items` được giữ càng nhẹ càng tốt — mọi phần dữ liệu ít-truy-cập-hơn hoặc có vòng đời khác biệt (Media, Settings) đều được tách thành entity riêng thay vì gộp cột trực tiếp vào `items` hoặc `collections`.

---

## 2. 🗂️ Entities

### 2.1 Collections

Lưu trữ metadata của các bộ sưu tập (Movies, Books, Games...) — là gốc phân cấp của toàn bộ hệ thống. Bảng này chỉ chứa các thuộc tính định danh cốt lõi; mọi thiết lập cấu hình được tách sang bảng `CollectionSettings` (xem [2.1.1](#211-collectionsettings)).

| Cột           | Bắt buộc | Mô tả                                           |
| ------------- | :------: | ----------------------------------------------- |
| `id`          |    ✔     | Định danh duy nhất, khoá chính tự tăng.         |
| `name`        |    ✔     | Tên hiển thị.                                   |
| `slug`        |    ✔     | Định danh URL-friendly, duy nhất toàn hệ thống. |
| `icon`        |          | Emoji hoặc đường dẫn icon.                      |
| `description` |          | Mô tả bộ sưu tập.                               |
| `created_at`  |    ✔     | Thời điểm tạo.                                  |
| `updated_at`  |    ✔     | Tự động cập nhật mỗi khi bản ghi thay đổi.      |

**Ví dụ dữ liệu:**

| name     | slug     | icon | description           |
| -------- | -------- | ---- | --------------------- |
| Movies   | movies   | 🎬   | Film collection       |
| TV Shows | tv-shows | 📺   | Television series     |
| Books    | books    | 📚   | Book library          |
| Games    | games    | 🎮   | Video game collection |

---

### 2.1.1 CollectionSettings

Bảng thiết lập cấu hình cho mỗi Collection, quan hệ **1-1** với `Collections`. Mọi thiết lập được tổ chức thành **ba nhóm chức năng** lưu dưới dạng JSON, giúp dễ mở rộng mà không cần thay đổi cấu trúc bảng khi bổ sung setting mới.

| Cột             | Bắt buộc | Mô tả                                                                  |
| --------------- | :------: | ---------------------------------------------------------------------- |
| `id`            |    ✔     | Khoá chính tự tăng.                                                    |
| `collection_id` |    ✔     | FK → Collections, **unique** (đảm bảo quan hệ 1-1).                    |
| `appearance`    |    ✔     | JSON — thiết lập giao diện (layout, theme, hiển thị card...).          |
| `media`         |    ✔     | JSON — thiết lập media (bật/tắt media, cover, default cover, role...). |
| `behavior`      |    ✔     | JSON — thiết lập hành vi (sắp xếp mặc định, chiến lược tải...).        |
| `created_at`    |    ✔     | Thời điểm tạo.                                                         |
| `updated_at`    |    ✔     | Tự động cập nhật khi thiết lập thay đổi.                               |

**Cấu trúc JSON của `media` (ví dụ):**

```json
{
    "media_enabled": true,
    "cover_enabled": true,
    "default_cover_mode": "SYSTEM",
    "default_cover_asset_id": null,
    "allowed_roles": ["COVER", "GALLERY", "SCREENSHOT", "ATTACHMENT"]
}
```

| Trường                   | Kiểu        | Mô tả                                                                                        |
| ------------------------ | ----------- | -------------------------------------------------------------------------------------------- |
| `media_enabled`          | boolean     | Cờ bật/tắt tính năng Media cho Collection (mặc định **tắt** — opt-in).                       |
| `cover_enabled`          | boolean     | Cho phép Collection hỗ trợ Cover hay không.                                                  |
| `default_cover_mode`     | enum string | `SYSTEM` (ảnh mặc định hệ thống) \| `CUSTOM` (ảnh do admin chọn) \| `NONE` (không hiển thị). |
| `default_cover_asset_id` | integer?    | FK → Assets, chỉ có giá trị khi `default_cover_mode = CUSTOM`.                               |
| `allowed_roles`          | string[]    | Danh sách vai trò Asset được phép sử dụng trong Collection này.                              |

**Cấu trúc JSON của `appearance` (ví dụ):**

```json
{
    "default_view_mode": "GRID",
    "card_size": "MEDIUM",
    "show_title_on_card": true
}
```

**Cấu trúc JSON của `behavior` (ví dụ):**

```json
{
    "default_sort_field": "created_at",
    "default_sort_order": "DESC"
}
```

**Vì sao tách ra bảng riêng thay vì thêm cột trên Collections?**

1. **Separation of Concerns:** `Collections` chỉ chứa thuộc tính định danh (tên, slug, icon), giữ bảng gốc gọn — đặc biệt khi số lượng setting tăng theo thời gian.
2. **Mở rộng không cần migration:** thêm setting mới chỉ cần thêm trường vào JSON, không cần thay đổi cấu trúc bảng.
3. **Vòng đời khác biệt:** settings thay đổi thường xuyên hơn metadata định danh — tách riêng giúp `updated_at` của Collections phản ánh đúng thay đổi metadata thay vì bị nhiễu bởi điều chỉnh setting.

**Cơ chế Default Cover (xử lý ở tầng ứng dụng):**

Khi hiển thị Cover cho một Item, tầng Service thực hiện fallback theo thứ tự:

1. Kiểm tra Item có `ItemAsset` với `role = COVER` không → **Có**: dùng Asset tương ứng.
2. **Không**: đọc `CollectionSettings.media.default_cover_mode`:
    - `SYSTEM` → Dùng ảnh mặc định built-in của hệ thống (không lưu trong DB).
    - `CUSTOM` → Dùng Asset được chỉ định bởi `default_cover_asset_id`.
    - `NONE` → Hiển thị placeholder hoặc ẩn ảnh bìa.

> Lưu ý: **Không** tạo bản ghi `ItemAssets` mặc định cho từng Item để tham chiếu cùng một ảnh default — tránh phình dữ liệu không cần thiết khi Collection có hàng triệu Item. Logic fallback hoàn toàn ở tầng ứng dụng.

---

### 2.2 Attributes

Định nghĩa custom field cho mỗi Collection — mỗi dòng ở đây mô tả "hình dạng" của một trường dữ liệu sẽ xuất hiện trong `items.properties`.

| Cột             | Bắt buộc | Mô tả                                                                        |
| --------------- | :------: | ---------------------------------------------------------------------------- |
| `id`            |    ✔     | Định danh duy nhất.                                                          |
| `collection_id` |    ✔     | Collection sở hữu field này.                                                 |
| `name`          |    ✔     | Tên hiển thị trên UI.                                                        |
| `key`           |    ✔     | Tên khoá dùng trong JSON `properties` của Item, duy nhất trong 1 Collection. |
| `type`          |    ✔     | Kiểu dữ liệu field (xem bảng Field Types).                                   |
| `options`       |          | Danh sách lựa chọn (dạng JSON array) cho field `select`/`multiselect`.       |
| `display_order` |          | Thứ tự hiển thị trên UI.                                                     |
| `required`      |          | Cờ bắt buộc nhập (boolean).                                                  |
| `searchable`    |          | Có đưa vào chỉ mục Full-Text Search hay không.                               |
| `created_at`    |    ✔     | Thời điểm tạo.                                                               |

**Field Types:**

| Type          | Input Component | Validation             |
| ------------- | --------------- | ---------------------- |
| `text`        | Text input      | Tối đa 255 ký tự       |
| `textarea`    | Text area       | Tối đa 10.000 ký tự    |
| `number`      | Number input    | Số nguyên              |
| `decimal`     | Number input    | Số thực                |
| `date`        | Date picker     | ISO date               |
| `datetime`    | Datetime picker | ISO datetime           |
| `select`      | Dropdown        | Từ danh sách `options` |
| `multiselect` | Multi-select    | Mảng, từ `options`     |
| `checkbox`    | Checkbox        | Boolean                |
| `url`         | URL input       | URL hợp lệ             |
| `image`       | Image picker    | Đường dẫn/URL hợp lệ   |
| `file`        | File picker     | Đường dẫn hợp lệ       |

---

### 2.3 Items

Bảng chính lưu trữ dữ liệu, dự kiến 10 triệu+ bản ghi.

| Cột             | Bắt buộc | Mô tả                                                                   |
| --------------- | :------: | ----------------------------------------------------------------------- |
| `id`            |    ✔     | Định danh duy nhất.                                                     |
| `collection_id` |    ✔     | Collection sở hữu Item.                                                 |
| `title`         |    ✔     | Tiêu đề Item, được index để hỗ trợ sắp xếp/tìm kiếm nhanh.              |
| `properties`    |    ✔     | Khối JSON chứa toàn bộ giá trị custom field, khớp với `attributes.key`. |
| `created_at`    |    ✔     | Thời điểm tạo.                                                          |
| `updated_at`    |    ✔     | Tự động cập nhật mỗi khi bản ghi thay đổi.                              |

**Cấu trúc JSON của `properties` (ví dụ):**

```json
{
    "director": "Christopher Nolan",
    "rating": 8.8,
    "release_year": 2010,
    "genre": ["Sci-Fi", "Thriller", "Action"],
    "status": "Completed",
    "notes": "Mind-bending masterpiece"
}
```

> Lưu ý: Media (Cover, Background, Gallery, Attachment...) **không** nằm trong `properties` — đây là quyết định thiết kế trung tâm được giải thích ở mục [Normalization](#8--normalization) và [Trade-offs](#9--trade-offs).

---

### 2.4 Full-Text Search Index (Items)

Một chỉ mục tìm kiếm toàn văn ảo (virtual), phản chiếu nội dung `title` và `properties` của `items` mà **không lưu trữ dữ liệu trùng lặp** — chỉ mục tham chiếu ngược lại bản ghi gốc thông qua `id` của Item.

- **Đồng bộ tự động:** mỗi khi một Item được thêm, sửa, hoặc xoá, chỉ mục tìm kiếm được cập nhật tương ứng ở tầng database, đảm bảo kết quả tìm kiếm luôn khớp với dữ liệu hiện tại mà không cần tầng ứng dụng tự đồng bộ thủ công.
- **Hành vi truy vấn:** hỗ trợ tìm kiếm kết hợp nhiều từ khoá, trả kết quả theo mức độ liên quan (relevance ranking), và có thể giới hạn số lượng kết quả để phục vụ hiển thị dạng trang hoặc gợi ý tức thời trên thanh tìm kiếm.
- **Chỉ những field được đánh dấu `searchable = true`** ở bảng Attributes mới thực sự đóng góp nội dung vào chỉ mục — giữ chỉ mục gọn và tránh nhiễu (noise) khi tìm kiếm.

---

### 2.5 Assets (Media)

Đại diện cho **một tài nguyên media** — có thể là tệp cục bộ (Local) đã được import vào Vault Storage, hoặc tham chiếu URL bên ngoài (Remote) với khả năng cache về Vault để phục vụ offline. Đây là entity trung tâm của hệ thống Media.

| Trường              |    Bắt buộc    | Mô tả                                                                                                                  |
| ------------------- | :------------: | ---------------------------------------------------------------------------------------------------------------------- |
| `id`                |       ✔        | Định danh duy nhất.                                                                                                    |
| `source_type`       |       ✔        | `LOCAL` \| `REMOTE` — phân biệt Asset là file cục bộ hay tham chiếu URL bên ngoài.                                     |
| `source_url`        | ✔ khi `REMOTE` | URL gốc của tài nguyên. Bắt buộc khi `source_type = REMOTE`; tuỳ chọn khi `LOCAL` (để lưu truy xuất nguồn gốc nếu có). |
| `media_type`        |       ✔        | Phân loại nội dung: `IMAGE`.                                                                                           |
| `mime_type`         |       ✔        | Ví dụ `image/jpeg` — dùng để render đúng component & validate.                                                         |
| `original_filename` |       ✔        | Tên tệp gốc do người dùng đặt, phục vụ hiển thị.                                                                       |
| `relative_path`     | ✔ khi `LOCAL`  | Đường dẫn **tương đối** tới tệp gốc trong Vault Storage. Bắt buộc khi `LOCAL`; `NULL` khi `REMOTE` chưa cache.         |
| `local_cache_path`  |                | Đường dẫn tương đối tới bản cache cục bộ của Asset `REMOTE` trong Vault Storage. `NULL` khi chưa cache.                |
| `thumbnail_path`    |                | Đường dẫn tới bản Thumbnail; rỗng khi chưa xử lý xong.                                                                 |
| `preview_path`      |                | Đường dẫn tới bản Preview; rỗng khi chưa xử lý xong.                                                                   |
| `file_size_bytes`   |                | Dung lượng tệp gốc. Nullable — không biết trước khi `REMOTE` chưa tải.                                                 |
| `width` / `height`  |                | Kích thước gốc (áp dụng cho Image).                                                                                    |
| `checksum`          |                | Hash nội dung tệp — phục vụ kiểm tra toàn vẹn. Nullable — không tính được khi `REMOTE` chưa có file cục bộ.            |
| `state`             |       ✔        | `PROCESSING` \| `READY` \| `CACHED` \| `ERROR` \| `MISSING` \| `DELETED`.                                              |
| `error_message`     |                | Chỉ có giá trị khi `state = ERROR`.                                                                                    |
| `metadata`          |                | Khối JSON mở rộng cho các thông tin phụ trợ của tệp media (nếu có).                                                    |
| `created_at`        |       ✔        | Thời điểm import.                                                                                                      |
| `updated_at`        |       ✔        | Tự động cập nhật khi trạng thái/metadata thay đổi.                                                                     |

**Giải thích `source_type` và luồng xử lý:**

- **`LOCAL`:** Asset là tệp đã được import trực tiếp vào Vault Storage. `relative_path` bắt buộc, `source_url` tuỳ chọn (lưu lại nguồn gốc nếu ảnh được tải từ URL rồi import). `file_size_bytes` và `checksum` bắt buộc (validate ở tầng ứng dụng).
- **`REMOTE`:** Asset là tham chiếu tới URL bên ngoài. `source_url` bắt buộc, `relative_path` rỗng ban đầu. Ứng dụng có thể cache ảnh về Vault Storage bất đồng bộ:
    1. Tải ảnh từ `source_url` về Vault Storage.
    2. Lưu đường dẫn tương đối vào `local_cache_path`.
    3. Cập nhật `file_size_bytes`, `checksum`, `width`/`height` từ bản cache.
    4. Chuyển `state` sang `CACHED`.
    5. Sinh Thumbnail/Preview từ bản cache (nếu chưa có).

**Ưu tiên nguồn khi render:**

1. `local_cache_path` (nếu có) hoặc `relative_path` (nếu `LOCAL`) → Dùng file cục bộ.
2. `source_url` → Fallback dùng URL trực tiếp (khi offline + chưa cache → hiển thị placeholder).

> Lưu ý: Cache có thể bị xoá bất kỳ lúc nào (dọn dẹp dung lượng) mà không mất tham chiếu — `source_url` vẫn giữ nguyên, hệ thống sẽ tải lại khi cần.

---

### 2.6 ItemAssets (Media)

Bảng liên kết (junction) giữa Items và Assets, lưu vai trò (`role`) và thứ tự hiển thị — tách biệt hoàn toàn khỏi cả hai bảng còn lại. Hỗ trợ đa dạng loại hình ảnh cho mỗi Item thông qua hệ thống role phong phú.

| Trường          | Bắt buộc | Mô tả                                                    |
| --------------- | :------: | -------------------------------------------------------- |
| `id`            |    ✔     | Khoá chính riêng (surrogate key).                        |
| `item_id`       |    ✔     | Item sở hữu liên kết.                                    |
| `asset_id`      |    ✔     | Asset được liên kết.                                     |
| `role`          |    ✔     | Vai trò của Asset đối với Item (xem bảng Role bên dưới). |
| `display_order` |          | Thứ tự hiển thị các Asset cùng role trong tab Media.     |
| `created_at`    |    ✔     | Thời điểm liên kết được tạo.                             |

**Hệ thống Role:**

Các role được chia thành hai nhóm dựa trên ràng buộc số lượng:

| Role         | Nhóm         | Mô tả                                  | Tối đa / Item |
| ------------ | ------------ | -------------------------------------- | :-----------: |
| `COVER`      | **Singular** | Ảnh bìa đại diện chính của Item.       |       1       |
| `BACKGROUND` | **Singular** | Ảnh nền chi tiết / hero image.         |       1       |
| `LOGO`       | **Singular** | Logo hoặc icon đại diện.               |       1       |
| `BANNER`     | **Singular** | Banner header / ảnh quảng cáo.         |       1       |
| `GALLERY`    | **Plural**   | Ảnh trong bộ sưu tập hình.             |       N       |
| `SCREENSHOT` | **Plural**   | Ảnh chụp màn hình (game, phần mềm...). |       N       |
| `ATTACHMENT` | **Plural**   | Tệp đính kèm tổng quát.                |       N       |

- **Singular Roles** (`COVER`, `BACKGROUND`, `LOGO`, `BANNER`): mỗi Item chỉ có **tối đa 1** Asset cho mỗi Singular Role. Ràng buộc này được enforce bởi **partial unique index** trên `item_id` cho từng giá trị Singular Role (tương tự cơ chế hiện tại cho `COVER`).
- **Plural Roles** (`GALLERY`, `SCREENSHOT`, `ATTACHMENT`): không giới hạn số lượng, chỉ ràng buộc unique trên cặp `(item_id, asset_id)` để tránh liên kết trùng.

**Vì sao tách riêng thay vì gắn `item_id`/`role` trực tiếp lên Asset?**

1. **Vòng đời độc lập:** xoá Item chỉ xoá dòng liên kết, Asset (và file vật lý hoặc tham chiếu URL) tồn tại chờ dọn dẹp nền (Garbage Collection) — tránh mất dữ liệu ngoài ý muốn.
2. **Đổi Cover/Background/Logo an toàn:** chuyển vai trò giữa hai Asset chỉ là thao tác trên dòng liên kết, không đụng tới bản ghi Asset — giảm rủi ro xung đột khi nhiều thao tác diễn ra đồng thời.
3. **Hỗ trợ khả năng một Asset được chia sẻ** giữa nhiều Item (dựa trên `checksum` hoặc `source_url`) mà không cần đổi cấu trúc bảng.

---

### 2.7 Thumbnail & Preview

Là hai phiên bản phái sinh của Asset (kích thước siêu nhỏ cho danh sách, và kích thước tối ưu cho màn hình chi tiết). Quan hệ luôn là 1 Asset : tối đa 1 Thumbnail : tối đa 1 Preview.

**Quyết định thiết kế:** thay vì tách thành bảng phái sinh riêng, hai trường `thumbnail_path` và `preview_path` được **nhúng trực tiếp** vào bảng Assets. Lý do và đánh đổi được trình bày chi tiết ở mục [Trade-offs](#9--trade-offs) — về bản chất, đây là lựa chọn ưu tiên tốc độ đọc trên đường truy vấn được gọi nhiều nhất (hiển thị Cover cho hàng ngàn Item trong Grid/List View), đổi lấy việc kém linh hoạt hơn nếu sau này cần nhiều biến thể kích thước ảnh.

Trạng thái xử lý dùng chung với `assets.state` — một lỗi sinh Thumbnail sẽ đưa toàn bộ Asset vào trạng thái `ERROR`, không có trạng thái lỗi cục bộ riêng cho từng bản phái sinh.

**Đối với Asset `REMOTE`:** Thumbnail/Preview chỉ được sinh **sau khi** Asset đã được cache về cục bộ (`local_cache_path` có giá trị). Khi chưa cache, UI fallback hiển thị ảnh từ `source_url` trực tiếp (không có Thumbnail riêng).

---

## 3. 🔗 Relationships

| Quan hệ                                                  | Bản chất          | Ghi chú                                                                                                                                      |
| -------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Collections → CollectionSettings                         | 1 - 1             | Mỗi Collection có đúng 1 bản ghi settings. Xoá Collection kéo theo xoá settings tương ứng.                                                   |
| Collections → Attributes                                 | 1 - N             | Xoá Collection kéo theo xoá toàn bộ Attributes định nghĩa cho nó.                                                                            |
| Collections → Items                                      | 1 - N             | Xoá Collection kéo theo xoá toàn bộ Items thuộc nó.                                                                                          |
| CollectionSettings.media.media_enabled                   | thuộc tính (JSON) | Điều kiện tiên quyết (gatekeeper) cho toàn bộ nhánh quan hệ Media. Enforce ở tầng ứng dụng.                                                  |
| CollectionSettings.media.default_cover_asset_id → Assets | FK (logic)        | Tham chiếu tới Asset mặc định khi `default_cover_mode = CUSTOM`. Enforce ở tầng ứng dụng (nằm trong JSON, không phải FK ở tầng DB).          |
| Items → Full-Text Search Index                           | 1 - 1 (đồng bộ)   | Không phải khoá ngoại thực sự — là quan hệ đồng bộ một chiều từ Items sang chỉ mục ảo.                                                       |
| Items → ItemAssets                                       | 1 - N             | Một Item có 0..N Asset liên kết (0..1 Cover + 0..1 Background + 0..1 Logo + 0..1 Banner + 0..N Gallery + 0..N Screenshot + 0..N Attachment). |
| Assets → ItemAssets                                      | 1 - N             | Schema cho phép 1 Asset được nhiều `ItemAsset` trỏ tới; luồng nghiệp vụ hiện tại mỗi Asset gắn với đúng 1 Item.                              |
| ItemAssets.role ∈ Singular Roles                         | ràng buộc         | Tối đa **01** dòng cho mỗi Singular Role (`COVER`, `BACKGROUND`, `LOGO`, `BANNER`) trên cùng `item_id` tại một thời điểm.                    |
| Items xoá → ItemAssets                                   | Cascade           | Xoá Item sẽ xoá các dòng liên kết `ItemAssets` tương ứng.                                                                                    |
| ItemAssets xoá → Assets                                  | **Không cascade** | Xoá liên kết không kéo theo xoá Asset; Asset trở thành "orphan" chờ Garbage Collection.                                                      |

**Điểm quan trọng:** Assets **không** lưu trực tiếp `collection_id`. Kiểm tra quyền theo Collection luôn đi qua chuỗi Collections → Items → ItemAssets → Assets, tránh dữ liệu trùng lặp không cần thiết vì Asset luôn được truy cập thông qua Item chủ quản.

---

## 4. 📇 Indexes

| Index (mô tả)                                                       | Trên entity        | Mục đích                                                                                                                  |
| ------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Index theo `slug`                                                   | Collections        | Tra cứu nhanh theo định danh URL-friendly.                                                                                |
| **Unique index** theo `collection_id`                               | CollectionSettings | Đảm bảo quan hệ 1-1 với Collections; đồng thời phục vụ tra cứu settings theo Collection.                                  |
| Index theo `collection_id`                                          | Attributes         | Lấy toàn bộ định nghĩa field của một Collection khi render form nhập liệu.                                                |
| Index theo `collection_id`                                          | Items              | Lọc Item theo Collection — thao tác phổ biến nhất khi mở một bộ sưu tập.                                                  |
| Index theo `title` (không phân biệt hoa/thường)                     | Items              | Sắp xếp/tìm kiếm theo tiêu đề không phân biệt chữ hoa-thường.                                                             |
| Index theo `created_at` (giảm dần)                                  | Items              | Sắp xếp theo mới nhất, hỗ trợ Infinite Scroll/Keyset Pagination.                                                          |
| Index theo `updated_at` (giảm dần)                                  | Items              | Sắp xếp theo vừa cập nhật.                                                                                                |
| Index kết hợp `(collection_id, created_at)`                         | Items              | Truy vấn tổ hợp phổ biến nhất: "Item mới nhất trong Collection X" — tránh full scan trên 10M+ dòng.                       |
| Index theo `item_id`                                                | ItemAssets         | Lấy toàn bộ Asset (Cover + Background + Gallery...) của một Item khi mở màn hình chi tiết.                                |
| Index kết hợp `(item_id, role)`                                     | ItemAssets         | Truy vấn nóng nhất của hệ thống Media: lấy Cover/Background của Item đang hiển thị trong Grid/List.                       |
| **Unique index bộ phận** trên `item_id` **khi `role = COVER`**      | ItemAssets         | Enforce ràng buộc "tối đa 1 Cover/Item" ở tầng database, kể cả khi có thao tác đồng thời.                                 |
| **Unique index bộ phận** trên `item_id` **khi `role = BACKGROUND`** | ItemAssets         | Enforce ràng buộc "tối đa 1 Background/Item" ở tầng database.                                                             |
| **Unique index bộ phận** trên `item_id` **khi `role = LOGO`**       | ItemAssets         | Enforce ràng buộc "tối đa 1 Logo/Item" ở tầng database.                                                                   |
| **Unique index bộ phận** trên `item_id` **khi `role = BANNER`**     | ItemAssets         | Enforce ràng buộc "tối đa 1 Banner/Item" ở tầng database.                                                                 |
| Unique index trên cặp `(item_id, asset_id)`                         | ItemAssets         | Ngăn liên kết trùng lặp giữa một Item và một Asset.                                                                       |
| Index theo `asset_id`                                               | ItemAssets         | Truy vấn ngược: "Asset này còn được Item nào tham chiếu?" — nền tảng phát hiện orphan cho Garbage Collection.             |
| Index kết hợp `(source_type, state)`                                | Assets             | Tác vụ nền: quét Asset `REMOTE` chưa cache (`state != CACHED`), quét `PROCESSING`/`ERROR` để retry, `DELETED` để dọn dẹp. |
| Index theo `checksum`                                               | Assets             | Phục vụ đối chiếu khi kiểm tra File Integrity lúc import và phát hiện trùng lặp.                                          |

Không đánh index rời trên các cột cardinality thấp (`role`, `media_type`, `source_type`) — luôn kết hợp cùng cột chọn lọc cao hơn (`item_id`, `state`) để đảm bảo index thực sự hữu ích.

---

## 5. 🔒 Constraints

| Constraint                                                                                              | Áp dụng cho                                                           | Mục đích                                                                                             |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Khoá chính tự tăng                                                                                      | Tất cả entity                                                         | Định danh duy nhất, nhất quán trên toàn hệ thống.                                                    |
| `slug` duy nhất, bắt buộc                                                                               | Collections                                                           | Đảm bảo định danh URL không trùng lặp.                                                               |
| `collection_id` duy nhất (unique)                                                                       | CollectionSettings                                                    | Đảm bảo quan hệ 1-1 với Collections — mỗi Collection có đúng 1 bản ghi settings.                     |
| Khoá ngoại `collection_id`, xoá Collection kéo theo xoá bản ghi liên quan                               | CollectionSettings, Attributes, Items                                 | Đảm bảo không tồn tại Attribute/Item/Settings "mồ côi" khi Collection bị xoá.                        |
| Mặc định `media.media_enabled = tắt` trong JSON                                                         | CollectionSettings (enforce ở tầng ứng dụng)                          | Media là tính năng opt-in, không tự động bật.                                                        |
| Cặp `(collection_id, key)` duy nhất                                                                     | Attributes                                                            | Một Collection không thể có hai field trùng khoá JSON.                                               |
| Khoá ngoại `item_id`, xoá Item kéo theo xoá dòng liên kết                                               | ItemAssets                                                            | Đảm bảo không còn liên kết trỏ tới Item đã xoá.                                                      |
| Khoá ngoại `asset_id`, **không** cascade xoá Asset khi liên kết bị xoá                                  | ItemAssets                                                            | Giữ nguyên vòng đời độc lập của Asset (chờ Garbage Collection).                                      |
| Duy nhất cặp `(item_id, asset_id)`                                                                      | ItemAssets                                                            | Chống liên kết trùng.                                                                                |
| **Duy nhất bộ phận** trên `item_id` khi `role` ∈ `{COVER, BACKGROUND, LOGO, BANNER}` (mỗi role 1 index) | ItemAssets                                                            | Tối đa 1 Asset cho mỗi Singular Role trên mỗi Item.                                                  |
| Giá trị `role` giới hạn trong `{COVER, BACKGROUND, LOGO, BANNER, GALLERY, SCREENSHOT, ATTACHMENT}`      | ItemAssets                                                            | Đúng theo định nghĩa nghiệp vụ.                                                                      |
| Giá trị `source_type` giới hạn trong `{LOCAL, REMOTE}`                                                  | Assets                                                                | Đảm bảo chỉ có hai nguồn hợp lệ.                                                                     |
| `relative_path` bắt buộc khi `source_type = LOCAL`                                                      | Assets (enforce ở tầng ứng dụng)                                      | Asset Local phải có đường dẫn tệp cục bộ.                                                            |
| `source_url` bắt buộc khi `source_type = REMOTE`                                                        | Assets (enforce ở tầng ứng dụng)                                      | Asset Remote phải có URL gốc.                                                                        |
| Đường dẫn không được là đường dẫn tuyệt đối                                                             | Assets (`relative_path`, `local_cache_path`, enforce ở tầng ứng dụng) | Đảm bảo tính di động (Portable) của Vault.                                                           |
| Giá trị `state` giới hạn trong `{PROCESSING, READY, CACHED, ERROR, MISSING, DELETED}`                   | Assets                                                                | Khớp với vòng đời trạng thái đã định nghĩa. `CACHED` dành cho Asset `REMOTE` đã cache xong.          |
| Đổi Singular Role phải thực hiện trong một giao dịch (transaction) trọn vẹn                             | ItemAssets (quy tắc nghiệp vụ, không phải constraint đơn lẻ)          | Tránh trạng thái vi phạm tạm thời khi hạ role cũ và nâng role mới, đặc biệt dưới thao tác đồng thời. |

---

## 6. ⚡ Performance

- **Truy vấn Item theo Collection, sắp xếp theo thời gian** là tổ hợp phổ biến nhất, được phục vụ bởi index kết hợp trên `(collection_id, created_at)` — tránh full scan trên bảng 10 triệu+ dòng.
- **Keyset Pagination** (lọc theo `id`/`created_at` lớn hơn giá trị cuối cùng đã tải) được ưu tiên hơn phân trang kiểu OFFSET cho chiến lược Infinite Scroll, vì OFFSET lớn sẽ suy giảm hiệu năng khi cuộn sâu vào danh sách.
- **Truy vấn Cover cho Grid/List View** — nóng nhất của phần Media — được phục vụ bởi index kết hợp `(item_id, role)` trên ItemAssets, kết hợp việc nhúng `thumbnail_path` trực tiếp trên Assets để tránh thêm một JOIN nữa trên đường đọc. Khi Item không có Cover riêng, tầng ứng dụng áp dụng fallback từ `CollectionSettings.media.default_cover_mode` — không cần truy vấn thêm bảng ItemAssets.
- **Không tải trước danh sách Plural Roles:** danh sách Gallery/Screenshot/Attachment chỉ được truy vấn khi người dùng mở màn hình chi tiết Item, giảm tải I/O cho trường hợp phổ biến nhất (cuộn danh sách).
- **Asset Remote — ưu tiên cache cục bộ:** khi `local_cache_path` có giá trị, ứng dụng dùng bản cache thay vì gọi URL — tránh latency mạng trên đường đọc nóng. Cache được sinh bất đồng bộ ở tiến trình nền, không chặn UI.
- **Xử lý nền bất đồng bộ:** việc sinh Thumbnail/Preview và cache ảnh Remote diễn ra ở tiến trình nền tách biệt khỏi luồng ghi DB chính — bản ghi Asset được tạo ngay ở trạng thái "đang xử lý" để UI phản hồi tức thì, sau đó cập nhật khi xử lý xong.
- **Chế độ ghi cho phép đọc song song (WAL Mode)** đảm bảo các tác vụ nền (cập nhật trạng thái Asset, cache ảnh Remote, chỉ mục tìm kiếm) không chặn các truy vấn đọc phục vụ giao diện đang hoạt động cùng lúc.
- **CollectionSettings được đọc trọn bộ** theo `collection_id` và cache ở tầng ứng dụng — chỉ cần 1 truy vấn khi mở Collection, không cần truy vấn lặp lại cho từng Item.

---

## 7. 📊 Large Dataset

- Với quy mô **10 triệu+ Item**, mọi index trên bảng Items đều được thiết kế để phục vụ đúng các truy vấn thực tế (lọc theo Collection, sắp xếp theo thời gian, tra cứu theo tiêu đề) — tránh index dư thừa làm chậm thao tác ghi.
- Chiến lược tải dữ liệu (Pagination hoặc Infinite Scroll với Keyset Pagination) đảm bảo mỗi lần truy vấn chỉ chạm vào một lượng nhỏ bản ghi tương ứng với khung nhìn (viewport) hiện tại, không phụ thuộc vào tổng kích thước bảng.
- **Media là tính năng opt-in theo Collection** (qua `CollectionSettings.media.media_enabled`), vì vậy Assets/ItemAssets không được giả định tỉ lệ 1:1 với Items — phần lớn Item có thể không có Asset nào; thiết kế index tránh giả định "dày đặc" không cần thiết.
- **Default Cover không tạo bản ghi ItemAssets** cho từng Item — tránh phình dữ liệu khi Collection có hàng triệu Item mà tất cả dùng chung ảnh mặc định. Logic fallback hoàn toàn ở tầng ứng dụng.
- **Garbage Collection** cho Asset orphan (không còn ItemAsset nào trỏ tới) phải chạy theo lô (batch), không chạy một thao tác dọn dẹp không giới hạn — tránh giữ khoá ghi dài trên file database, gây treo các truy vấn đọc song song. Đối với Asset `REMOTE`, xoá orphan chỉ xoá bản cache cục bộ (nếu có) và bản ghi DB — không ảnh hưởng tài nguyên gốc trên Internet.
- Chỉ mục tìm kiếm toàn văn không lưu trữ dữ liệu trùng lặp với bảng gốc (chỉ tham chiếu qua `id`), giữ tổng dung lượng database ở mức tối thiểu dù dữ liệu văn bản có thể lớn.

---

## 8. 🧮 Normalization

- **Items dùng JSON (`properties`) thay vì EAV chuẩn hoàn toàn** cho custom field: đổi lấy việc đọc một Item chỉ cần một dòng dữ liệu duy nhất, không cần JOIN qua nhiều bảng giá trị — quyết định sống còn ở quy mô 10 triệu+ bản ghi. `Attributes` vẫn được chuẩn hoá đầy đủ vì đây là dữ liệu định nghĩa schema (ít bản ghi, đọc không thường xuyên như Items).
- **Assets và ItemAssets được tách theo đúng chuẩn 3NF:** Asset là một thực thể độc lập (đại diện cho tài nguyên media — dù Local hay Remote), ItemAsset là một thực thể quan hệ độc lập (đại diện cho việc "Item nào liên kết Asset nào với vai trò gì") — hai sự thật thay đổi độc lập với nhau, tránh update anomaly khi đổi Cover/Background/Logo.
- **CollectionSettings tách riêng khỏi Collections** theo quan hệ 1-1: settings có vòng đời thay đổi khác biệt so với metadata định danh, và được nhóm thành JSON theo chức năng (appearance/media/behavior) — đổi lấy khả năng mở rộng không cần migration khi thêm setting mới.
- **Ba điểm denormalization có chủ đích** (không phải sơ suất):
    1. `thumbnail_path`/`preview_path` nhúng thẳng trên Assets thay vì bảng phái sinh riêng — đổi lấy hiệu năng đọc trên đường Grid/List.
    2. `metadata` dạng JSON trên Assets cho các thông tin phụ trợ thay vì bảng con riêng — đổi lấy khả năng mở rộng không cần thay đổi cấu trúc bảng.
    3. `appearance`/`media`/`behavior` dạng JSON trên CollectionSettings thay vì cột riêng lẻ — đổi lấy khả năng mở rộng settings không cần migration, chấp nhận việc không thể index trường con (không cần thiết vì settings luôn đọc trọn bộ theo `collection_id`).

---

## 9. ⚖️ Trade-offs

| Quyết định                  | Đã chọn                                                                            | Đánh đổi                                                                                                                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lưu custom field của Item   | Một cột JSON (`properties`) thay vì bảng giá trị EAV chuẩn                         | (+) Đọc một Item chỉ cần một dòng, không JOIN. (−) Không thể lọc/sắp xếp trực tiếp theo một field tuỳ biến bằng index thông thường.                                                                                 |
| Chỉ mục tìm kiếm toàn văn   | Bảng ảo tham chiếu ngược Items (external content) thay vì lưu bản sao dữ liệu      | (+) Không nhân đôi dung lượng lưu trữ. (−) Cần cơ chế đồng bộ mỗi khi Item thay đổi, thêm một điểm cần đảm bảo nhất quán.                                                                                           |
| Quan hệ Item ↔ Asset        | Bảng liên kết ItemAssets thay vì gắn `item_id` trực tiếp trên Assets               | (+) Vòng đời độc lập, đổi Cover/Background/Logo an toàn, hỗ trợ chia sẻ Asset giữa nhiều Item. (−) Thêm một bước liên kết cho mọi lần truy cập Asset qua Item.                                                      |
| Lưu trữ Thumbnail/Preview   | Nhúng cột trên Assets thay vì bảng phái sinh riêng                                 | (+) Không cần bước liên kết thêm trên đường Grid/List nóng nhất. (−) Kém linh hoạt nếu cần nhiều biến thể kích thước sau này.                                                                                       |
| Ràng buộc Singular Role     | Partial unique index cho mỗi Singular Role + giao dịch ở tầng dịch vụ              | (+) Đảm bảo đúng đắn ngay ở tầng database cho tất cả Singular Roles, chống xung đột đồng thời. (−) Mỗi Singular Role mới cần thêm 1 partial unique index — chấp nhận được vì số lượng Singular Role nhỏ và ổn định. |
| Nguồn Asset: Local + Remote | Cột `source_type` phân biệt, `source_url` và `local_cache_path` hỗ trợ dual-source | (+) Hỗ trợ cả file cục bộ và URL ngoài, cache offline linh hoạt. (−) Một số cột trở thành nullable tuỳ `source_type`, cần validate ở tầng ứng dụng thay vì hoàn toàn ở DB.                                          |
| Thiết lập Collection        | Bảng `CollectionSettings` riêng, settings dạng JSON nhóm theo chức năng            | (+) Tách biệt concerns, mở rộng không cần migration, nhóm logic rõ ràng. (−) Không index được trường con JSON — chấp nhận được vì settings luôn đọc trọn bộ.                                                        |
| Default Cover cho Item      | Fallback ở tầng ứng dụng thay vì tạo bản ghi `ItemAssets` mặc định cho từng Item   | (+) Không phình dữ liệu khi Collection có hàng triệu Item. (−) Logic fallback phải nằm ở tầng Service, không được enforce bởi DB — cần kiểm thử kỹ.                                                                 |
| Metadata mở rộng            | Cột JSON dùng chung trên Assets                                                    | (+) Không cần đổi cấu trúc bảng cho các thông tin mở rộng. (−) Không lọc/sắp xếp trực tiếp được như cột thường.                                                                                                     |
| Xoá Asset khi Item bị xoá   | Xoá liên kết ngay, xoá Asset/file trễ qua tiến trình dọn dẹp nền                   | (+) An toàn, tránh mất dữ liệu ngoài ý muốn, thân thiện với thao tác theo lô ở quy mô lớn. (−) File "mồ côi" tồn tại trên ổ đĩa cho tới khi tiến trình dọn dẹp chạy.                                                |

---

## 🔗 Tài liệu Liên quan

- [Kiến trúc Nguồn Asset](./asset-source-architecture.md) — Chi tiết LOCAL/REMOTE, cơ chế cache, state machine
- [Hệ thống Multi-role Asset](./multi-role-asset-system.md) — Chi tiết 7 role, Singular/Plural, query patterns
- [Thiết kế CollectionSettings](./collection-settings-design.md) — Chi tiết JSON settings, default cover, validation
- [Feature Specification: Media System](./media_feature_specification.md)
- [System Design tổng quan](../01-architecture/2-system-design.md)

---

_Cập nhật: 2026-07-28_
