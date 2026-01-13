# 📋 Field Data Handling - Xử lý dữ liệu khi thay đổi/xóa Field

> **Mục tiêu:** Mô tả logic xử lý dữ liệu khi người dùng thao tác với field definition, sử dụng chiến lược **ID-based key**.

---

## 📋 Tóm tắt quyết định

**Nguyên tắc:** Metadata trong entries sử dụng **Field ID** làm key thay vì tên field.

| Hành động      | Cách xử lý                     | Ảnh hưởng dữ liệu           |
| -------------- | ------------------------------ | --------------------------- |
| Xóa field      | Giữ nguyên orphan data         | Không mất dữ liệu           |
| Đổi tên field  | Chỉ cập nhật definition        | Metadata không bị ảnh hưởng |
| Đổi loại field | Không cho phép                 | N/A                         |
| Đổi options    | Cập nhật definition + cảnh báo | Giá trị cũ vẫn còn          |

---

## 1. Cấu trúc lưu trữ

### So sánh hai cách tiếp cận

**Cách cũ (Name-based):**

-   Metadata lưu: `{"Director": "Nolan", "Year": 2010}`
-   Vấn đề: Khi đổi tên field → metadata mất liên kết

**Cách mới (ID-based):**

-   Metadata lưu: `{"1": "Nolan", "2": 2010}` (key = field ID)
-   Lợi ích: Đổi tên field tự do, metadata không bị ảnh hưởng

### Mối quan hệ dữ liệu

```
Field Definition                Entry Metadata
┌────────────────┐              ┌────────────────────┐
│ id: 1          │◄─────────────│ {"1": "Nolan",     │
│ name: Director │              │  "2": 2010}        │
│ type: text     │              └────────────────────┘
└────────────────┘                     ↑
                                      │
                              Key = Field ID (immutable)
```

---

## 2. Quy trình xử lý từng thao tác

### 2.1 Khi TẠO field mới

**Các bước:**

1. Nhận thông tin: vault_id, tên field, loại, options
2. Kiểm tra tên field không trống
3. Kiểm tra vault tồn tại
4. Kiểm tra trùng tên trong vault → nếu trùng, báo lỗi
5. Tạo field definition với ID tự động
6. Trả về field definition kèm ID
7. **Lưu ý:** ID này sẽ được dùng làm key trong metadata của entries

---

### 2.2 Khi LƯU metadata của entry

**Các bước:**

1. Nhận danh sách giá trị: `[(field_id, giá trị), ...]`
2. Với mỗi cặp (field_id, giá trị):
    - Chuyển field_id thành chuỗi làm key
    - Lưu giá trị tương ứng
3. Kết quả: `{"1": "giá trị", "2": "giá trị", ...}`
4. Lưu JSON này vào cột metadata của entry

---

### 2.3 Khi ĐỌC metadata để hiển thị

**Các bước:**

1. Lấy danh sách field definitions của vault (có id, name, type)
2. Parse metadata JSON của entry
3. Với mỗi field definition:
    - Dùng field.id làm key để tìm giá trị trong metadata
    - Hiển thị: `field.name: giá trị`
4. Bỏ qua các key trong metadata không match với field nào (orphan data)

**⚠️ Rủi ro:**

-   FE phải tự mapping giữa list definitions và list entries
-   Nếu list definitions lớn hoặc logic FE không đồng bộ → hiển thị chậm/lỗi

**Giải pháp giảm thiểu:**

1. Cache field definitions theo vault_id (chỉ fetch khi cần)
2. Tạo Map/Dict `{field_id → definition}` một lần khi load vault
3. Khi render entry: O(1) lookup thay vì O(n) duyệt list
4. Backend có thể trả về entries đã được "hydrate" với field names (optional API)

---

### 2.4 Khi ĐỔI TÊN field

**Các bước:**

1. Nhận field_id và tên mới
2. Kiểm tra field tồn tại
3. Kiểm tra tên mới không trống
4. Kiểm tra tên mới không trùng với field khác trong vault
5. Cập nhật tên trong field_definitions
6. **KHÔNG CẦN** cập nhật metadata của entries
7. Lý do: metadata dùng field ID làm key, không phải tên

**Ví dụ:**

-   Trước: field có id=1, name="Director"
-   Entry metadata: `{"1": "Nolan"}`
-   Sau khi đổi tên thành "Film Director"
-   Entry metadata vẫn là: `{"1": "Nolan"}` (không đổi)
-   UI hiển thị: "Film Director: Nolan" ✓

---

### 2.5 Khi XÓA field

**Các bước:**

1. Nhận field_id cần xóa
2. Kiểm tra field tồn tại
3. Xóa field definition khỏi database
4. **KHÔNG XÓA** dữ liệu tương ứng trong entries ngay lập tức
5. Kết quả: metadata entries vẫn chứa key cũ (orphan data)

**Xử lý orphan data: Lazy Cleanup on Write**

> ⚠️ **Không dùng batch processing** (duyệt toàn bộ entries) vì quá nặng với DB lớn.

**Chiến lược: Dọn dẹp khi ghi (Lazy Migration on Write)**

-   Orphan data được dọn dẹp **chỉ khi entry được UPDATE**
-   Không cần chạy job quét toàn bộ DB
-   Entries không được chỉnh sửa → orphan data vẫn còn (vô hại)

**Quy trình khi UPDATE entry:**

1. Nhận metadata mới từ client
2. Lấy danh sách field IDs hợp lệ của vault
3. Lọc metadata: chỉ giữ các key nằm trong danh sách field ID hợp lệ
4. Lưu metadata đã được "clean"

**Ví dụ:**

-   Entry cũ: `{"1": "Nolan", "2": 2010, "99": "orphan"}` (field 99 đã bị xóa)
-   User edit field 1: gửi `{"1": "Spielberg", "2": 2010, "99": "orphan"}`
-   Backend lọc: `{"1": "Spielberg", "2": 2010}` (bỏ key "99")
-   Kết quả: orphan data được dọn dẹp tự động khi user edit

**Lợi ích:**

-   Không block khi xóa field
-   Không cần batch job
-   Dọn dẹp dần dần theo thời gian
-   Entries không active → không tốn resource

---

### 2.6 Khi THAY ĐỔI loại field

**Quyết định:** KHÔNG CHO PHÉP

**Lý do:**

1. Chuyển đổi dữ liệu phức tạp (text → number, number → boolean)
2. Có thể mất dữ liệu
3. Validation rules khác nhau giữa các loại

**Hướng dẫn user nếu cần đổi loại:**

1. Tạo field mới với loại mới
2. Sao chép/chuyển dữ liệu thủ công
3. Xóa field cũ

---

### 2.7 Khi THAY ĐỔI options của field

**Các bước:**

1. Nhận field_id và options mới
2. Cập nhật options trong field_definitions
3. **KHÔNG CẬP NHẬT** giá trị trong entries

**Xử lý giá trị không còn hợp lệ:**

1. Khi hiển thị entry:

    - Kiểm tra giá trị có hợp lệ với options mới không
    - Nếu không hợp lệ → hiển thị cảnh báo

2. Khi chỉnh sửa entry:
    - Validate giá trị mới theo options hiện tại
    - Giá trị cũ không hợp lệ → yêu cầu user sửa

**Ví dụ - Select field:**

-   Options cũ: ["Action", "Comedy", "Drama"]
-   Entry có giá trị: "Drama"
-   Options mới: ["Action", "Comedy", "Horror"] (bỏ Drama)
-   Khi hiển thị: "Drama" + icon cảnh báo

**Ví dụ - Number field:**

-   Options cũ: min=1, max=100
-   Entry có giá trị: 50
-   Options mới: min=1, max=10 (thu hẹp range)
-   Khi hiển thị: "50" + cảnh báo "vượt quá max"

---

## 3. Migration dữ liệu cũ

Nếu đã có dữ liệu theo cách cũ (name-based), cần chuyển đổi:

**Các bước migration:**

1. Lấy tất cả vaults
2. Với mỗi vault:
    - Tạo bảng ánh xạ: tên field → field ID
    - Lấy tất cả entries của vault
3. Với mỗi entry:
    - Parse metadata JSON
    - Với mỗi key trong metadata:
        - Nếu key là số → giữ nguyên (đã đúng format)
        - Nếu key là tên → tra bảng ánh xạ → đổi thành ID
        - Nếu key không tìm thấy → giữ nguyên (sẽ thành orphan)
    - Lưu metadata mới
4. Ghi log kết quả migration

---

## 4. Xử lý validation

### Khi lưu metadata

1. Parse metadata JSON
2. Với mỗi key:
    - Kiểm tra key có phải là số không → nếu không, cảnh báo
    - Kiểm tra field ID có tồn tại trong vault không → nếu không, cảnh báo (có thể là orphan)
3. Cho phép lưu (không block) vì orphan data vô hại

### Khi hiển thị

1. Chỉ hiển thị các field có trong field_definitions
2. Bỏ qua orphan keys trong metadata
3. Với mỗi giá trị:
    - Validate theo loại và options của field
    - Hiển thị cảnh báo nếu giá trị không hợp lệ

---

## 5. Tóm tắt logic chính

```
┌─────────────────────────────────────────────────────────────┐
│                    FIELD OPERATIONS                         │
├──────────────┬──────────────────────────────────────────────┤
│ Tạo field    │ → Sinh ID tự động                            │
│              │ → ID này dùng làm key trong metadata         │
├──────────────┼──────────────────────────────────────────────┤
│ Đổi tên      │ → Chỉ update definition                      │
│              │ → Metadata entries KHÔNG ĐỔI                 │
├──────────────┼──────────────────────────────────────────────┤
│ Xóa field    │ → Xóa definition                             │
│              │ → Metadata entries KHÔNG XÓA (orphan)        │
├──────────────┼──────────────────────────────────────────────┤
│ Đổi loại     │ → KHÔNG CHO PHÉP                             │
├──────────────┼──────────────────────────────────────────────┤
│ Đổi options  │ → Update definition                          │
│              │ → Metadata giữ nguyên + cảnh báo nếu invalid │
└──────────────┴──────────────────────────────────────────────┘
```

---

## 6. Lợi ích của ID-based approach

| Điểm               | Mô tả                                        |
| ------------------ | -------------------------------------------- |
| Đổi tên tự do      | Không cần migrate metadata khi đổi tên field |
| Performance        | Lookup bằng ID nhanh hơn                     |
| Data integrity     | Liên kết ổn định qua ID (immutable)          |
| Đơn giản hóa logic | Không cần xử lý phức tạp khi rename          |

---

## 7. Trade-offs

| Nhược điểm               | Giải pháp                              |
| ------------------------ | -------------------------------------- |
| Raw metadata khó đọc     | UI luôn hiển thị qua field definitions |
| Cần migration dữ liệu cũ | Chạy một lần khi deploy                |
| Debug khó hơn            | Log đầy đủ + tool mapping ID → name    |

---

_Cập nhật: 2026-01-13_
