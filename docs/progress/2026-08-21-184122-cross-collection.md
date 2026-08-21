# Phase 5B: Cross-Collection Item Linking — Walkthrough

## Summary

Triển khai hệ thống **Relations** cho phép liên kết Items giữa các Collections khác nhau, tạo thành Knowledge Graph cá nhân. Ví dụ: một Film có thể reference nhiều Actors từ Collection khác.

---

## Changes Made

### Backend — Rust/Tauri (4 new files, 2 modified)

#### [MODIFY] [models.rs](file:///d:/Project/Rust/Vaultrs/desktop/src-tauri/src/custom_fields/models.rs)
- Thêm variant `Reference` vào enum `FieldType` (line 22)

#### [NEW] [relations/mod.rs](file:///d:/Project/Rust/Vaultrs/desktop/src-tauri/src/relations/mod.rs)
- Module declaration cho `commands`, `models`, `service`

#### [NEW] [relations/models.rs](file:///d:/Project/Rust/Vaultrs/desktop/src-tauri/src/relations/models.rs)
- DTOs: `ReferencedItem`, `BackReference`, `ResolvedReferencesResponse`, `ReferenceSearchDto`

#### [NEW] [relations/service.rs](file:///d:/Project/Rust/Vaultrs/desktop/src-tauri/src/relations/service.rs)
- `RelationService` với 3 methods:
  - **`resolve_references`** — Load item properties JSON → extract reference IDs → batch JOIN items + collections → return enriched data grouped by attribute key
  - **`search_reference_targets`** — LIKE search trong target collection, hỗ trợ exclude đã-chọn IDs
  - **`get_back_references`** — Reverse lookup sử dụng SQLite `json_each()` + `json_extract()` để tìm items reference đến target

#### [NEW] [relations/commands.rs](file:///d:/Project/Rust/Vaultrs/desktop/src-tauri/src/relations/commands.rs)
- 3 Tauri commands: `resolve_references`, `search_reference_targets`, `get_back_references`

#### [MODIFY] [lib.rs](file:///d:/Project/Rust/Vaultrs/desktop/src-tauri/src/lib.rs)
- Register `mod relations` + 3 commands vào `invoke_handler`

---

### Frontend — Types & API (2 files)

#### [MODIFY] [common.ts](file:///d:/Project/Rust/Vaultrs/desktop/src/core/types/common.ts)
- Thêm `"reference"` vào union type `FieldType`
- Thêm interfaces: `ReferencedItem`, `BackReference`, `ResolvedReferencesResponse`

#### [NEW] [relationService.ts](file:///d:/Project/Rust/Vaultrs/desktop/src/core/api/relationService.ts)
- 3 API wrappers: `resolveReferences()`, `searchReferenceTargets()`, `getBackReferences()`

---

### Frontend — UI Components (7 files)

#### [MODIFY] [attributeFieldTypes.ts](file:///d:/Project/Rust/Vaultrs/desktop/src/components/Attribute/attributeFieldTypes.ts)
- Thêm `reference` entry với `GitBranch` icon
- Thêm helper `isReferenceFieldType()`

#### [MODIFY] [CreateAttributeDialog.tsx](file:///d:/Project/Rust/Vaultrs/desktop/src/components/Attribute/CreateAttributeDialog.tsx)
- Khi chọn type `reference` → hiển thị **Target Collection Picker** (dropdown chọn collection đích)
- Options JSON lưu `{ target_collection_id: number }`
- Validate: phải chọn target collection trước khi submit

#### [MODIFY] [EditAttributeDialog.tsx](file:///d:/Project/Rust/Vaultrs/desktop/src/components/Attribute/EditAttributeDialog.tsx)
- Hiển thị target collection dưới dạng read-only info (không cho thay đổi sau khi tạo)

#### [NEW] [ReferenceField.tsx](file:///d:/Project/Rust/Vaultrs/desktop/src/components/Item/ReferenceField.tsx)
- Component chính cho reference field trong ItemDetailPage:
  - **Display**: Referenced items hiển thị dưới dạng badges (icon + title) với tooltip
  - **Search Picker**: Inline search input + dropdown từ target collection (debounced 250ms)
  - **Remove**: X button trên mỗi badge
  - **Optimistic updates**: Add/remove ngay lập tức trên UI

#### [MODIFY] [DynamicField.tsx](file:///d:/Project/Rust/Vaultrs/desktop/src/components/Item/DynamicField.tsx)
- Thêm `GitBranch` icon mapping cho reference type
- Thêm case `"reference"` trong switch: parse `target_collection_id` từ options, render `<ReferenceField>`

#### [NEW] [BackReferences.tsx](file:///d:/Project/Rust/Vaultrs/desktop/src/components/Item/BackReferences.tsx)
- Panel "Referenced By" trong sidebar:
  - Grouped by source collection (icon + name header)
  - Clickable items với hover animation
  - Loading/empty/error states

#### [MODIFY] [ItemDetailPage.tsx](file:///d:/Project/Rust/Vaultrs/desktop/src/pages/ItemDetailPage.tsx)
- Import `BackReferences`
- Render trong Right Panel sidebar dưới Details card

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| **EAV-based** (no junction table) | Consistent với hệ thống hiện tại: reference IDs lưu trong `properties` JSON |
| **Batch resolve** | Single query JOIN items + collections cho tất cả reference IDs |
| **SQLite json_each()** cho back-references | Native JSON support, không cần migration mới |
| **Debounced search** (250ms) | Tránh query quá nhiều khi user đang gõ |
| **Target collection immutable** | Thay đổi target sau khi đã có data sẽ làm invalidate references |

---

## Verification Results

| Check | Result |
|---|---|
| `cargo check` | ✅ 0 errors (9 warnings pre-existing) |
| `vite build` | ✅ Built in 7.58s, exit code 0 |

---

## How to Test

1. Tạo 2 collections: **Films** (🎬) và **Actors** (🎭)
2. Thêm vài items vào **Actors**: "Keanu Reeves", "Carrie-Anne Moss"
3. Trong **Films**, tạo attribute mới:
   - Name: `Actors`
   - Type: **Reference**
   - Target Collection: **Actors**
4. Tạo item "The Matrix" trong **Films**
5. Mở detail → trường **Actors** → click "Add reference" → search + chọn actors
6. Quay lại xem actor "Keanu Reeves" → sidebar hiển thị "Referenced By: Films > The Matrix"
