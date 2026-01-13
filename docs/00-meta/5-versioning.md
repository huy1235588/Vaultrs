# 🏷️ Quy ước Versioning - Vaultrs

> **Mục tiêu:** Định nghĩa cách đánh version, quản lý changelog, và quy trình release cho dự án Vaultrs.

---

## 📋 TL;DR - Tóm tắt Nhanh

```
Version format:  MAJOR.MINOR.PATCH  (ví dụ: 1.2.3)
                   │     │     │
                   │     │     └── Bug fixes (backward compatible)
                   │     └──────── New features (backward compatible)
                   └────────────── Breaking changes

Pre-release:     1.0.0-alpha.1, 1.0.0-beta.2, 1.0.0-rc.1
```

| Thay đổi                    | Increment | Ví dụ         |
| --------------------------- | --------- | ------------- |
| Breaking API change         | MAJOR     | 1.0.0 → 2.0.0 |
| New feature (backward safe) | MINOR     | 1.0.0 → 1.1.0 |
| Bug fix                     | PATCH     | 1.0.0 → 1.0.1 |

---

## 1. 📐 Semantic Versioning (SemVer)

Vaultrs tuân theo [Semantic Versioning 2.0.0](https://semver.org/).

### Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Ví dụ:
  1.0.0           # Release chính thức
  1.2.3           # Major 1, Minor 2, Patch 3
  2.0.0-alpha.1   # Pre-release alpha
  1.0.0-beta.2    # Pre-release beta
  1.0.0-rc.1      # Release candidate
```

### Quy tắc Increment

#### MAJOR (Breaking Changes)

Tăng khi có thay đổi **không tương thích ngược**:

```
✅ Tăng MAJOR:
- Thay đổi vault file format (không đọc được file cũ)
- Xóa/đổi tên Tauri commands
- Thay đổi API response structure
- Đổi thuật toán mã hóa mặc định

Ví dụ: 1.5.2 → 2.0.0
```

#### MINOR (New Features)

Tăng khi thêm **tính năng mới** mà vẫn tương thích ngược:

```
✅ Tăng MINOR:
- Thêm category mới (Identity, Secure Note)
- Thêm Tauri command mới
- Thêm UI component mới
- Thêm export format mới

Ví dụ: 1.5.2 → 1.6.0
```

#### PATCH (Bug Fixes)

Tăng khi sửa **lỗi** mà không thay đổi API:

```
✅ Tăng PATCH:
- Fix bug decryption
- Fix UI glitch
- Performance improvements
- Security patches

Ví dụ: 1.5.2 → 1.5.3
```

### Pre-release Labels

| Label   | Ý nghĩa                             | Ổn định     |
| ------- | ----------------------------------- | ----------- |
| `alpha` | Development build, nhiều bug        | ❌ Rất thấp |
| `beta`  | Feature complete, đang test         | ⚠️ Thấp     |
| `rc`    | Release Candidate, gần như sẵn sàng | ✅ Cao      |

```
Flow: alpha → beta → rc → release

1.0.0-alpha.1     # Phát triển
1.0.0-alpha.2
1.0.0-beta.1      # Feature freeze
1.0.0-beta.2
1.0.0-rc.1        # Chỉ fix critical bugs
1.0.0             # 🚀 Release!
```

---

## 2. 📝 Changelog Format

### File Location

```
vaultrs/
└── CHANGELOG.md
```

### Format: Keep a Changelog

Tuân theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

```markdown
# Changelog

Tất cả thay đổi đáng chú ý của dự án sẽ được ghi lại ở đây.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   Tính năng mới đang phát triển

## [1.2.0] - 2025-12-26

### Added

-   Thêm dark mode (#123)
-   Thêm password strength indicator (#145)

### Changed

-   Cải thiện UI vault list
-   Tăng default Argon2 iterations

### Fixed

-   Fix lỗi copy password trên macOS (#156)
-   Fix memory leak khi unlock vault (#160)

### Security

-   Cập nhật AES-GCM library để fix CVE-2025-XXXX

## [1.1.0] - 2025-11-15

### Added

-   Thêm tính năng export CSV

### Deprecated

-   `generate_password_simple()` sẽ bị xóa ở v2.0
```

### Categories

| Category       | Ý nghĩa                             |
| -------------- | ----------------------------------- |
| **Added**      | Tính năng mới                       |
| **Changed**    | Thay đổi tính năng hiện có          |
| **Deprecated** | Tính năng sẽ bị xóa trong tương lai |
| **Removed**    | Tính năng đã bị xóa                 |
| **Fixed**      | Bug fixes                           |
| **Security**   | Vulnerability fixes                 |

### Best Practices

```markdown
✅ ĐÚNG:

-   Thêm nút "Copy Password" vào entry detail (#123)
-   Fix lỗi crash khi vault file bị corrupt (#145)
-   [BREAKING] Thay đổi vault format v2

❌ SAI:

-   Fixed bug # Quá chung chung
-   Updated code # Không có thông tin
-   Changes # Vô nghĩa
```

---

## 3. 🚀 Release Process

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                       RELEASE WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Feature Development                                         │
│     └── main branch                                             │
│                                                                 │
│  2. Pre-release Testing                                         │
│     ├── Create tag: v1.0.0-beta.1                               │
│     └── Test trên các platforms                                 │
│                                                                 │
│  3. Release Candidate                                           │
│     ├── Create tag: v1.0.0-rc.1                                 │
│     └── Final testing, documentation review                     │
│                                                                 │
│  4. Production Release                                          │
│     ├── Update CHANGELOG.md                                     │
│     ├── Update version in Cargo.toml & package.json             │
│     ├── Create tag: v1.0.0                                      │
│     └── Create GitHub Release                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Checklist Trước Release

```markdown
## Release Checklist v1.x.x

### Code

-   [ ] Tất cả tests pass
-   [ ] Không có linter warnings
-   [ ] Code review completed

### Documentation

-   [ ] CHANGELOG.md updated
-   [ ] README.md updated (nếu cần)
-   [ ] API docs updated

### Version Bump

-   [ ] desktop/src-tauri/Cargo.toml
-   [ ] desktop/src-tauri/tauri.conf.json
-   [ ] desktop/package.json

### Testing

-   [ ] Windows build OK
-   [ ] macOS build OK (nếu có)
-   [ ] Linux build OK (nếu có)
-   [ ] Manual testing completed

### Release

-   [ ] Git tag created
-   [ ] GitHub Release created
-   [ ] Release notes written
```

### Version Bump Locations

```
vaultrs/
├── desktop/
│   ├── package.json              # "version": "1.0.0"
│   └── src-tauri/
│       ├── Cargo.toml            # version = "1.0.0"
│       └── tauri.conf.json       # "version": "1.0.0"
└── CHANGELOG.md                  # ## [1.0.0] - YYYY-MM-DD
```

### Git Tags

```bash
# Pre-release
git tag -a v1.0.0-alpha.1 -m "Alpha release 1"
git tag -a v1.0.0-beta.1 -m "Beta release 1"
git tag -a v1.0.0-rc.1 -m "Release candidate 1"

# Production release
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin --tags
```

---

## 4. 🗂️ Vault File Versioning

### Schema Version

Vault file có version riêng để track format changes:

```rust
struct VaultHeader {
    magic: [u8; 4],           // "VLTR"
    schema_version: u16,      // 1, 2, 3...
    // ...
}
```

### Migration Rules

| App Version | Schema Version | Compatibility               |
| ----------- | -------------- | --------------------------- |
| 1.x.x       | 1              | Read/Write                  |
| 2.0.0       | 2              | Read v1 (migrate), Write v2 |
| 2.1.0       | 2              | Read v1 & v2, Write v2      |

```
Quy tắc:
- Luôn đọc được schema version cũ hơn
- Migrate tự động khi mở file cũ
- Backup file gốc trước khi migrate
```

---

## 5. 📋 Version trong Code

### Rust (Cargo.toml)

```toml
[package]
name = "vaultrs"
version = "1.0.0"
```

### Rust (Runtime)

```rust
const APP_VERSION: &str = env!("CARGO_PKG_VERSION");

fn get_version() -> String {
    APP_VERSION.to_string()
}
```

### TypeScript (package.json)

```json
{
    "name": "vaultrs",
    "version": "1.0.0"
}
```

### TypeScript (Runtime)

```typescript
import { version } from "../package.json";

export const APP_VERSION = version;
```

---

## 6. 🔒 Security Releases

### Severity Levels

| Level    | Response Time | Action                       |
| -------- | ------------- | ---------------------------- |
| Critical | 24 hours      | Hotfix release, notify users |
| High     | 1 week        | Patch release                |
| Medium   | Next minor    | Include in planned release   |
| Low      | Next minor    | Include in planned release   |

### Security Release Naming

```
# Security patch
v1.5.2 → v1.5.3 (security)

# Nếu cần breaking change để fix security
v1.5.2 → v2.0.0 (dù là security fix)
```

---

## 🔗 Tài liệu Liên quan

-   [Cấu trúc thư mục](./1-folder-structure.md)
-   [Quy ước đặt tên](./2-naming-convention.md)
-   [Hướng dẫn viết docs](./3-how-to-document.md)
-   [Từ điển thuật ngữ](./4-glossary.md)

---

## 📚 Tham khảo

-   [Semantic Versioning 2.0.0](https://semver.org/)
-   [Keep a Changelog](https://keepachangelog.com/)
-   [Conventional Commits](https://www.conventionalcommits.org/)

---

_Cập nhật: 2025-12-26_
