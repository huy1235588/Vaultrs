# 📖 Từ điển Thuật ngữ - Vaultrs

> **Mục tiêu:** Định nghĩa các thuật ngữ chuyên ngành sử dụng trong dự án, giúp developer mới nhanh chóng hiểu các khái niệm quan trọng.

---

## 📋 TL;DR - Thuật ngữ Quan trọng Nhất

| Thuật ngữ         | Định nghĩa ngắn                                        |
| ----------------- | ------------------------------------------------------ |
| **Vault**         | Kho lưu trữ mã hóa chứa tất cả entries                 |
| **Entry**         | Một bản ghi thông tin đăng nhập (username, password)   |
| **Master Password** | Mật khẩu chính duy nhất để mở vault                  |
| **Encryption Key** | Khóa được derive từ master password để mã hóa dữ liệu |

---

## 🔐 Thuật ngữ Mật mã học (Cryptography)

### AES-256-GCM

**Advanced Encryption Standard - 256 bit - Galois/Counter Mode**

- **Định nghĩa:** Thuật toán mã hóa đối xứng 256-bit với chế độ authenticated encryption
- **Đặc điểm:** Vừa mã hóa vừa xác thực tính toàn vẹn dữ liệu
- **Sử dụng trong Vaultrs:** Mã hóa vault data và entries

```
Plaintext + Key + Nonce → AES-256-GCM → Ciphertext + Auth Tag
```

### Argon2

- **Định nghĩa:** Thuật toán Key Derivation Function (KDF) thắng cuộc thi Password Hashing Competition 2015
- **Đặc điểm:** Memory-hard, chống GPU/ASIC attack
- **Sử dụng trong Vaultrs:** Derive encryption key từ master password

```
Master Password + Salt → Argon2id → Encryption Key (256-bit)
```

### Ciphertext

- **Định nghĩa:** Dữ liệu đã được mã hóa, không thể đọc được nếu không có key
- **Ngược lại:** Plaintext (dữ liệu chưa mã hóa)

### Encryption Key

- **Định nghĩa:** Khóa bí mật dùng để mã hóa/giải mã dữ liệu
- **Trong Vaultrs:** Được derive từ Master Password qua Argon2
- **Lưu ý:** Không bao giờ lưu trực tiếp, chỉ tồn tại trong memory

### Hash

- **Định nghĩa:** Hàm một chiều chuyển đổi input thành output có độ dài cố định
- **Đặc điểm:** Không thể reverse, input khác nhau tạo hash khác nhau
- **Thuật toán phổ biến:** SHA-256, BLAKE3

### IV (Initialization Vector) / Nonce

- **Định nghĩa:** Giá trị ngẫu nhiên được dùng một lần cho mỗi lần mã hóa
- **Mục đích:** Đảm bảo cùng plaintext + key tạo ra ciphertext khác nhau
- **Kích thước:** Thường 12-16 bytes

### KDF (Key Derivation Function)

- **Định nghĩa:** Hàm tạo khóa mã hóa từ password hoặc secret khác
- **Đặc điểm:** Chậm có chủ đích để chống brute-force
- **Ví dụ:** Argon2, PBKDF2, scrypt

### Plaintext

- **Định nghĩa:** Dữ liệu chưa mã hóa, có thể đọc được
- **Ngược lại:** Ciphertext (dữ liệu đã mã hóa)

### Salt

- **Định nghĩa:** Giá trị ngẫu nhiên được thêm vào password trước khi hash/derive key
- **Mục đích:** Chống rainbow table attack, đảm bảo cùng password tạo ra key khác nhau
- **Kích thước:** Thường 16-32 bytes

---

## 🗄️ Thuật ngữ Ứng dụng (Application)

### Category

- **Định nghĩa:** Danh mục để phân loại entries (Login, Credit Card, Note, Identity)
- **Mục đích:** Tổ chức và tìm kiếm entries dễ dàng hơn

### Entry

- **Định nghĩa:** Một bản ghi trong vault, chứa thông tin đăng nhập hoặc dữ liệu nhạy cảm
- **Thành phần:**
  - Title (tên hiển thị)
  - Username
  - Password (encrypted)
  - URL
  - Notes
  - Custom fields

### Favorite

- **Định nghĩa:** Entry được đánh dấu yêu thích để truy cập nhanh
- **Hiển thị:** Danh sách riêng ở đầu giao diện

### Master Password

- **Định nghĩa:** Mật khẩu chính duy nhất mà user phải nhớ
- **Đặc điểm:**
  - Dùng để derive encryption key
  - Không được lưu trữ ở bất kỳ đâu
  - Nếu mất = mất toàn bộ dữ liệu

### Password Generator

- **Định nghĩa:** Tính năng tạo mật khẩu ngẫu nhiên mạnh
- **Options:** Độ dài, uppercase, lowercase, numbers, symbols

### Vault

- **Định nghĩa:** Container chính chứa tất cả entries của user
- **Cấu trúc file:**
  - Header (metadata, salt, IV)
  - Encrypted body (entries)
- **Trạng thái:** Locked (đã khóa) / Unlocked (đã mở)

### Vault File

- **Định nghĩa:** File vật lý lưu trữ vault trên disk
- **Extension:** `.vault`
- **Format:** Binary (header) + Encrypted JSON (body)

---

## 🏗️ Thuật ngữ Kiến trúc (Architecture)

### Backend (Rust/Tauri)

- **Định nghĩa:** Phần xử lý logic phía server/native của ứng dụng
- **Công nghệ:** Rust + Tauri framework
- **Trách nhiệm:** Cryptography, file I/O, system calls

### Command (Tauri)

- **Định nghĩa:** Function được expose từ Rust để frontend có thể gọi
- **Syntax:** `#[tauri::command]`

```rust
#[tauri::command]
fn unlock_vault(password: String) -> Result<Vault, String> { }
```

### Frontend (React)

- **Định nghĩa:** Giao diện người dùng của ứng dụng
- **Công nghệ:** React + TypeScript + TailwindCSS
- **Trách nhiệm:** UI rendering, user interaction

### IPC (Inter-Process Communication)

- **Định nghĩa:** Cơ chế giao tiếp giữa frontend (webview) và backend (Rust)
- **Trong Tauri:** `invoke()` function

```typescript
const vault = await invoke("unlock_vault", { password: "..." });
```

### Module

- **Định nghĩa:** Đơn vị tổ chức code theo feature/domain
- **Ví dụ:** `auth/`, `vault/`, `entry/`, `generator/`

### State Management

- **Định nghĩa:** Cách quản lý và chia sẻ dữ liệu trong ứng dụng
- **Frontend:** React Context, Zustand
- **Backend:** Tauri State

---

## 🔒 Thuật ngữ Bảo mật (Security)

### Authentication

- **Định nghĩa:** Xác thực danh tính user (verify master password)
- **Khác với:** Authorization (phân quyền)

### Auto-lock

- **Định nghĩa:** Tự động khóa vault sau thời gian không hoạt động
- **Mục đích:** Bảo vệ khi user quên lock

### Clipboard Clear

- **Định nghĩa:** Tự động xóa password khỏi clipboard sau X giây
- **Mục đích:** Tránh password bị paste nhầm hoặc bị đánh cắp

### Memory Protection

- **Định nghĩa:** Kỹ thuật bảo vệ dữ liệu nhạy cảm trong RAM
- **Phương pháp:**
  - Zero memory sau khi sử dụng
  - Sử dụng secure string types
  - Tránh swap to disk

### Zero-Knowledge

- **Định nghĩa:** Kiến trúc mà server/app không biết master password
- **Đặc điểm:** Mọi encryption/decryption xảy ra locally

---

## 📁 Thuật ngữ File Format

### Header (Vault)

- **Định nghĩa:** Phần đầu của vault file chứa metadata
- **Nội dung:** Version, salt, IV, encryption algorithm

### Magic Bytes

- **Định nghĩa:** Bytes đặc biệt ở đầu file để identify file type
- **Ví dụ:** `VLTR` (0x564C5452) cho Vaultrs vault file

### Schema Version

- **Định nghĩa:** Version của vault file format
- **Mục đích:** Backward compatibility, migration

---

## 🔗 Thuật ngữ Liên quan

### CSPRNG (Cryptographically Secure Pseudo-Random Number Generator)

- **Định nghĩa:** Bộ sinh số ngẫu nhiên an toàn cho cryptography
- **Sử dụng:** Tạo salt, IV, random passwords

### TOTP (Time-based One-Time Password)

- **Định nghĩa:** Mã OTP thay đổi theo thời gian (mỗi 30 giây)
- **Ví dụ:** Google Authenticator codes
- **Tương lai:** Vaultrs có thể hỗ trợ lưu TOTP secrets

### URI (Uniform Resource Identifier)

- **Định nghĩa:** Chuỗi định danh tài nguyên (thường là URL)
- **Sử dụng:** Lưu website URL trong entry

---

## 📚 Viết tắt Thường dùng

| Viết tắt | Đầy đủ                                    |
| -------- | ----------------------------------------- |
| AES      | Advanced Encryption Standard              |
| API      | Application Programming Interface         |
| CRUD     | Create, Read, Update, Delete              |
| DTO      | Data Transfer Object                      |
| GCM      | Galois/Counter Mode                       |
| IPC      | Inter-Process Communication               |
| IV       | Initialization Vector                     |
| KDF      | Key Derivation Function                   |
| OTP      | One-Time Password                         |
| PBKDF2   | Password-Based Key Derivation Function 2  |
| TOTP     | Time-based One-Time Password              |
| UI       | User Interface                            |
| UX       | User Experience                           |

---

## 🔗 Tài liệu Liên quan

- [Cấu trúc thư mục](./1-folder-structure.md)
- [Quy ước đặt tên](./2-naming-convention.md)
- [Hướng dẫn viết docs](./3-how-to-document.md)

---

_Cập nhật: 2025-12-26_
