## ADDED Requirements

### Requirement: Frontend relation module tách biệt khỏi field module
Hệ thống MUST có module `modules/relation/` riêng biệt ở frontend chứa `relationApi` và các types liên quan. `relationApi` MUST KHÔNG nằm trong `field/api.ts`.

#### Scenario: relationApi nằm trong module riêng
- **WHEN** xem `modules/relation/api.ts`
- **THEN** file MUST chứa toàn bộ `relationApi` object với các methods: `searchEntriesForPicker`, `getRelatedEntries`

#### Scenario: field module không chứa relation logic
- **WHEN** xem `modules/field/api.ts`
- **THEN** file MUST KHÔNG chứa `relationApi` hay bất kỳ relation API calls nào

#### Scenario: Relation module có barrel exports đúng chuẩn
- **WHEN** xem `modules/relation/index.ts`
- **THEN** file MUST export `relationApi` từ `api.ts` và types từ `types.ts`

### Requirement: Relation types tách riêng khỏi field types
Types liên quan đến relation (như `RelationEntry`) MUST nằm trong `modules/relation/types.ts`, không nằm trong `modules/field/types.ts`.

#### Scenario: RelationEntry type trong relation module
- **WHEN** import `RelationEntry` type
- **THEN** MUST import từ `@/modules/relation/types` hoặc `@/modules/relation`

### Requirement: Cache appDataDir ở frontend
Frontend MUST cache kết quả `appDataDir()` thay vì gọi lại mỗi lần sử dụng. Giá trị này không thay đổi trong runtime.

#### Scenario: appDataDir chỉ gọi 1 lần
- **WHEN** entry API cần `appDataDir()` cho nhiều operations (delete, upload, thumbnail, etc.)
- **THEN** MUST sử dụng cached value thay vì gọi `appDataDir()` mỗi lần

#### Scenario: Cached value sẵn sàng cho mọi API call
- **WHEN** bất kỳ API method nào cần app data directory
- **THEN** MUST có thể lấy giá trị từ cache mà không block

### Requirement: Module barrel exports cập nhật cho relation module
`modules/index.ts` MUST re-export relation module cùng với vault, entry, field.

#### Scenario: Top-level index exports relation
- **WHEN** xem `modules/index.ts`
- **THEN** MUST có export cho relation module

### Requirement: Tất cả import paths cập nhật sau refactor
Tất cả components đang import `relationApi` hoặc `RelationEntry` từ field module MUST được cập nhật import path sang relation module.

#### Scenario: Components import từ đúng module
- **WHEN** component cần sử dụng `relationApi`
- **THEN** MUST import từ `@/modules/relation` hoặc relative path tới relation module, KHÔNG từ field module
