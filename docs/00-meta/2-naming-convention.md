# 📝 Quy ước Đặt tên - Vaultrs

> **Mục tiêu:** Đảm bảo code nhất quán, dễ đọc và dễ maintain bằng cách tuân thủ naming conventions chuẩn.

---

## 📋 TL;DR - Bảng Tóm tắt

| Loại                 | Convention                      | Ví dụ                                       |
| -------------------- | ------------------------------- | ------------------------------------------- |
| **Rust**             |                                 |                                             |
| Module               | `snake_case`                    | `crypto_utils`, `vault_manager`             |
| Struct/Enum          | `PascalCase`                    | `VaultEntry`, `EncryptionAlgorithm`         |
| Function/Method      | `snake_case`                    | `encrypt_password()`, `get_vault_entries()` |
| Constant             | `SCREAMING_SNAKE_CASE`          | `MAX_PASSWORD_LENGTH`, `DEFAULT_ITERATIONS` |
| Variable             | `snake_case`                    | `master_password`, `vault_data`             |
| **React/TypeScript** |                                 |                                             |
| Component            | `PascalCase`                    | `PasswordList`, `VaultHeader`               |
| Hook                 | `camelCase` với prefix `use`    | `useVault()`, `useEncryption()`             |
| Function             | `camelCase`                     | `handleSubmit()`, `validatePassword()`      |
| Variable             | `camelCase`                     | `masterPassword`, `vaultEntries`            |
| Constant             | `SCREAMING_SNAKE_CASE`          | `API_BASE_URL`, `MAX_RETRIES`               |
| Interface/Type       | `PascalCase`                    | `VaultEntry`, `EncryptionConfig`            |
| **Files**            |                                 |                                             |
| Rust file            | `snake_case.rs`                 | `vault_manager.rs`, `crypto_utils.rs`       |
| React component      | `PascalCase.tsx`                | `PasswordList.tsx`, `VaultHeader.tsx`       |
| Hook                 | `camelCase.ts` với prefix `use` | `useVault.ts`, `useAuth.ts`                 |
| Utility              | `camelCase.ts`                  | `encryption.ts`, `validation.ts`            |

---

## 1. 🦀 Rust Backend Naming

### 1.1 Modules

**Quy tắc:** `snake_case`, tên ngắn gọn, mô tả chức năng

```rust
// ✅ ĐÚNG
mod crypto_utils;
mod vault_manager;
mod password_generator;

// ❌ SAI
mod CryptoUtils;      // Không dùng PascalCase
mod vault-manager;    // Không dùng kebab-case
mod pwdgen;           // Quá ngắn, không rõ nghĩa
```

### 1.2 Structs & Enums

**Quy tắc:** `PascalCase`, tên rõ nghĩa

```rust
// ✅ ĐÚNG
struct VaultEntry {
    id: String,
    title: String,
    username: String,
    encrypted_password: Vec<u8>,
}

enum EncryptionAlgorithm {
    Aes256Gcm,
    ChaCha20Poly1305,
}

// ❌ SAI
struct vault_entry { }     // Không dùng snake_case
struct VE { }              // Quá ngắn
enum encryption_algo { }   // Không dùng snake_case
```

### 1.3 Functions & Methods

**Quy tắc:** `snake_case`, động từ + danh từ

```rust
// ✅ ĐÚNG
fn encrypt_password(password: &str, key: &[u8]) -> Vec<u8> { }
fn get_vault_entries() -> Vec<VaultEntry> { }
fn validate_master_password(password: &str) -> bool { }

// ❌ SAI
fn EncryptPassword() { }        // Không dùng PascalCase
fn getVaultEntries() { }        // Không dùng camelCase
fn pwd_encrypt() { }            // Tên không rõ nghĩa
```

### 1.4 Constants

**Quy tắc:** `SCREAMING_SNAKE_CASE`

```rust
// ✅ ĐÚNG
const MAX_PASSWORD_LENGTH: usize = 128;
const DEFAULT_ARGON2_ITERATIONS: u32 = 100_000;
const VAULT_FILE_EXTENSION: &str = ".vault";

// ❌ SAI
const maxPasswordLength: usize = 128;    // Không dùng camelCase
const Max_Password_Length: usize = 128;  // Không nhất quán
```

### 1.5 Variables

**Quy tắc:** `snake_case`, tên mô tả rõ ràng

```rust
// ✅ ĐÚNG
let master_password = "secret123";
let vault_entries = vec![];
let encrypted_data = encrypt(&data, &key);

// ❌ SAI
let MasterPassword = "secret123";  // Không dùng PascalCase
let mp = "secret123";              // Quá ngắn
let data1 = vec![];                // Tên không có nghĩa
```

---

## 2. ⚛️ React/TypeScript Frontend Naming

### 2.1 Components

**Quy tắc:** `PascalCase`, tên rõ nghĩa, file cùng tên

```tsx
// ✅ ĐÚNG
// File: PasswordList.tsx
export function PasswordList() {
    return <div>...</div>;
}

// File: VaultHeader.tsx
export function VaultHeader() {
    return <header>...</header>;
}

// ❌ SAI
// File: passwordList.tsx
export function password_list() {} // Không dùng snake_case

// File: PwdList.tsx
export function PL() {} // Tên quá ngắn
```

### 2.2 Custom Hooks

**Quy tắc:** `camelCase`, prefix `use`, file cùng tên

```tsx
// ✅ ĐÚNG
// File: useVault.ts
export function useVault() {
    const [vault, setVault] = useState<Vault | null>(null);
    // ...
    return { vault, setVault };
}

// File: useEncryption.ts
export function useEncryption() {
    // ...
}

// ❌ SAI
// File: vault.ts
export function vaultHook() {} // Thiếu prefix 'use'

// File: UseVault.ts
export function UseVault() {} // Không dùng PascalCase cho hook
```

### 2.3 Functions

**Quy tắc:** `camelCase`, động từ + danh từ

```tsx
// ✅ ĐÚNG
function handleSubmit(event: FormEvent) {}
function validatePassword(password: string): boolean {}
function formatDate(date: Date): string {}

// ❌ SAI
function HandleSubmit() {} // Không dùng PascalCase
function validate_password() {} // Không dùng snake_case
function submit() {} // Tên quá chung chung
```

### 2.4 Variables & State

**Quy tắc:** `camelCase`

```tsx
// ✅ ĐÚNG
const [masterPassword, setMasterPassword] = useState("");
const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
const isLoading = false;

// ❌ SAI
const [MasterPassword, setMasterPassword] = useState(""); // PascalCase
const [master_password, set_master_password] = useState(""); // snake_case
const [mp, setMp] = useState(""); // Quá ngắn
```

### 2.5 Interfaces & Types

**Quy tắc:** `PascalCase`, prefix `I` cho interface (optional)

```tsx
// ✅ ĐÚNG
interface VaultEntry {
    id: string;
    title: string;
    username: string;
    encryptedPassword: string;
}

type EncryptionConfig = {
    algorithm: "AES-256-GCM" | "ChaCha20-Poly1305";
    iterations: number;
};

// ❌ SAI
interface vaultEntry {} // Không dùng snake_case
type encryption_config = {}; // Không dùng snake_case
```

### 2.6 Constants

**Quy tắc:** `SCREAMING_SNAKE_CASE`

```tsx
// ✅ ĐÚNG
const API_BASE_URL = "http://localhost:8080";
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 5000;

// ❌ SAI
const apiBaseUrl = "http://localhost:8080"; // camelCase
const MaxRetries = 3; // PascalCase
```

---

## 3. 📁 File & Folder Naming

### 3.1 Rust Files

**Quy tắc:** `snake_case.rs`

```
✅ ĐÚNG
src/
├── main.rs
├── vault_manager.rs
├── crypto_utils.rs
├── password_generator.rs
└── models/
    ├── mod.rs
    ├── vault_entry.rs
    └── encryption_config.rs

❌ SAI
src/
├── VaultManager.rs      // PascalCase
├── crypto-utils.rs      // kebab-case
└── pwdgen.rs            // Tên không rõ nghĩa
```

### 3.2 React/TypeScript Files

**Quy tắc:**

-   Components: `PascalCase.tsx`
-   Hooks: `camelCase.ts` với prefix `use`
-   Utils: `camelCase.ts`

```
✅ ĐÚNG
src/
├── components/
│   ├── PasswordList.tsx
│   ├── VaultHeader.tsx
│   └── LoginForm.tsx
├── hooks/
│   ├── useVault.ts
│   ├── useAuth.ts
│   └── useEncryption.ts
├── utils/
│   ├── encryption.ts
│   ├── validation.ts
│   └── formatting.ts
└── types/
    └── vault.ts

❌ SAI
src/
├── components/
│   ├── password-list.tsx    // kebab-case
│   └── passwordList.tsx     // camelCase
└── hooks/
    └── vault.ts             // Thiếu prefix 'use'
```

### 3.3 Folders

**Quy tắc:** `kebab-case` hoặc `snake_case`, nhất quán trong dự án

```
✅ ĐÚNG (kebab-case)
docs/
├── 00-meta/
├── 01-architecture/
├── 02-database/
└── 99-dev-notes/

✅ ĐÚNG (snake_case)
src/
├── crypto_utils/
├── vault_manager/
└── password_generator/

❌ SAI
docs/
├── 00Meta/              // PascalCase
├── 01_Architecture/     // Lẫn lộn
└── 99-DevNotes/         // Không nhất quán
```

---

## 4. 🎯 Naming Best Practices

### 4.1 Tên Biến Boolean

Prefix: `is`, `has`, `should`, `can`

```rust
// ✅ ĐÚNG
let is_valid = true;
let has_permission = false;
let should_encrypt = true;
let can_decrypt = check_key();

// ❌ SAI
let valid = true;           // Không rõ là boolean
let permission = false;     // Có thể nhầm với object
```

```tsx
// ✅ ĐÚNG
const isLoading = false;
const hasError = true;
const shouldShowModal = false;

// ❌ SAI
const loading = false;
const error = true;
```

### 4.2 Tên Function

Động từ + Danh từ

```rust
// ✅ ĐÚNG
fn get_vault_entry(id: &str) -> Option<VaultEntry> { }
fn create_vault(name: &str) -> Vault { }
fn delete_password(id: &str) -> Result<(), Error> { }
fn validate_input(input: &str) -> bool { }

// ❌ SAI
fn vault_entry(id: &str) { }      // Thiếu động từ
fn entry(id: &str) { }            // Quá chung chung
fn do_stuff() { }                 // Không rõ nghĩa
```

### 4.3 Tên Collection

Dùng số nhiều

```rust
// ✅ ĐÚNG
let vault_entries = vec![];
let passwords = vec![];
let users = vec![];

// ❌ SAI
let vault_entry_list = vec![];    // Dài dòng
let password_array = vec![];      // Không cần suffix 'array'
```

```tsx
// ✅ ĐÚNG
const vaultEntries = [];
const passwords = [];

// ❌ SAI
const vaultEntryList = [];
const passwordArr = [];
```

### 4.4 Tránh Abbreviations

Trừ khi abbreviation rất phổ biến

```rust
// ✅ ĐÚNG
let configuration = Config::new();
let identifier = "abc123";
let maximum_length = 128;

// ⚠️ OK (abbreviation phổ biến)
let id = "abc123";
let url = "https://example.com";
let html = "<div></div>";

// ❌ SAI
let cfg = Config::new();          // Không rõ nghĩa
let max_len = 128;                // Dùng đầy đủ
let pwd = "secret";               // Dùng 'password'
```

---

## 5. 🔒 Security-Related Naming

Đặt tên rõ ràng cho security-sensitive data:

```rust
// ✅ ĐÚNG
let encrypted_password: Vec<u8> = encrypt(&password);
let plaintext_data: String = decrypt(&encrypted_data);
let master_key_hash: [u8; 32] = hash(&master_key);

// ❌ SAI
let password: Vec<u8> = encrypt(&password);  // Không rõ đã encrypt
let data: String = decrypt(&encrypted_data); // Không rõ là plaintext
```

```tsx
// ✅ ĐÚNG
const encryptedPassword: string = "...";
const plaintextPassword: string = "...";
const hashedMasterKey: string = "...";

// ❌ SAI
const password: string = "..."; // Không rõ trạng thái
```

---

## 6. 📚 Tài liệu Tham khảo

-   [Rust API Guidelines - Naming](https://rust-lang.github.io/api-guidelines/naming.html)
-   [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
-   [React Naming Conventions](https://github.com/airbnb/javascript/tree/master/react)

---

## 🔗 Tài liệu Liên quan

-   [Cấu trúc thư mục](./1-folder-structure.md)
-   [Hướng dẫn viết docs](./3-how-to-document.md)

---

_Cập nhật: 2025-12-21_
