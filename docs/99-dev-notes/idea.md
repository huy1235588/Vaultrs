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

## 📊 Thống kê

-   **Tổng ý tưởng:** 9
-   **TODO:** 8
-   **IN_PROGRESS:** 0
-   **DONE:** 0
-   **ARCHIVED:** 1

---

_Cập nhật lần cuối: 2025-12-21_
