# 2. Rust Basics

> ⏱️ **Thời gian đọc**: 30 phút

---

## 📋 Quick Reference

| Concept   | Ví dụ            | Ghi nhớ                   |
| --------- | ---------------- | ------------------------- |
| Immutable | `let x = 5;`     | Mặc định không đổi        |
| Mutable   | `let mut x = 5;` | Thêm `mut` để thay đổi    |
| Ownership | `let s2 = s1;`   | s1 không còn hợp lệ       |
| Borrowing | `let s2 = &s1;`  | Mượn, s1 vẫn hợp lệ       |
| Result    | `Result<T, E>`   | Ok(value) hoặc Err(error) |
| Option    | `Option<T>`      | Some(value) hoặc None     |

---

## 2.1 Cài đặt Rust

```bash
# Windows: Cài từ https://rustup.rs/
# Hoặc nếu đã cài rustup, update:
rustup update stable
rustup show  # Xem version hiện tại
```

---

## 2.2 Variables & Types

### Immutable vs Mutable

```rust
// Immutable (không thay đổi) - MẶC ĐỊNH
let name: String = "Rust".to_string();
// name = "Go".to_string();  // ❌ Lỗi compile!

// Mutable (có thể thay đổi) - phải dùng `mut`
let mut age: i32 = 25;
age = 26;  // ✅ OK
```

### Các kiểu dữ liệu phổ biến

```rust
// Numbers
let int_num: i32 = 42;          // 32-bit signed integer
let unsigned: u32 = 100;        // 32-bit unsigned integer
let big_num: i64 = 1_000_000;   // 64-bit (dấu _ để dễ đọc)
let float: f64 = 3.14;          // 64-bit floating point

// Strings
let static_str: &str = "Hello"; // String literal (stack, read-only)
let owned_str: String = "World".to_string();  // Owned string (heap)

// Boolean
let is_active: bool = true;

// Type inference - Rust tự suy luận
let count = 5;   // → i32
let pi = 3.14;   // → f64
```

> [!TIP]
> Dùng `String` khi cần sở hữu và thay đổi. Dùng `&str` cho string literals và tham chiếu.

---

## 2.3 Ownership & Borrowing

> ⚠️ **Đây là concept quan trọng nhất trong Rust!**

### Ownership Rules

1. Mỗi giá trị có một **owner** duy nhất
2. Khi owner ra khỏi scope, giá trị bị drop (giải phóng)
3. Ownership có thể **move** sang biến khác

```rust
// Move ownership
let s1 = String::from("Hello");
let s2 = s1;  // Ownership move từ s1 → s2

// println!("{}", s1);  // ❌ Lỗi! s1 không còn hợp lệ
println!("{}", s2);     // ✅ OK
```

### Borrowing (Mượn)

```rust
// Immutable borrow (&)
let s1 = String::from("Hello");
let s2 = &s1;  // Mượn s1 (không lấy ownership)

println!("{}", s1);  // ✅ OK! s1 vẫn hợp lệ
println!("{}", s2);  // ✅ OK!

// Mutable borrow (&mut)
let mut s = String::from("Hello");
let reference = &mut s;  // Mượn mutable
reference.push_str(" World");

println!("{}", s);  // "Hello World"
```

### Borrow Rules

| Rule                   | Giải thích                      |
| ---------------------- | ------------------------------- |
| Nhiều `&` cùng lúc     | ✅ OK - nhiều immutable borrows |
| Một `&mut` duy nhất    | ✅ OK - chỉ 1 mutable borrow    |
| `&` và `&mut` cùng lúc | ❌ Không được                   |

---

## 2.4 Pattern Matching

### Match Expression

```rust
let number = 5;

match number {
    1 => println!("One"),
    2 | 3 => println!("Two or Three"),  // Nhiều giá trị
    4..=10 => println!("4 đến 10"),     // Range
    _ => println!("Khác"),              // Default
}
```

### Option & Result

```rust
// Option<T> = Some(value) hoặc None
let value: Option<i32> = Some(5);

match value {
    Some(v) => println!("Got: {}", v),
    None => println!("Got nothing"),
}

// Result<T, E> = Ok(value) hoặc Err(error)
let result: Result<i32, String> = Ok(42);

match result {
    Ok(v) => println!("Success: {}", v),
    Err(e) => println!("Error: {}", e),
}
```

---

## 2.5 Error Handling

### Result và ? Operator

```rust
// Hàm trả về Result
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("Division by zero".to_string())
    } else {
        Ok(a / b)
    }
}

// Cách 1: Pattern matching
match divide(10, 2) {
    Ok(result) => println!("Result: {}", result),
    Err(e) => println!("Error: {}", e),
}

// Cách 2: ? operator (propagate error lên trên)
fn process() -> Result<i32, String> {
    let result = divide(10, 2)?;  // Return Err nếu có lỗi
    Ok(result * 2)
}

// Cách 3: unwrap (❌ TRÁNH trong production)
let result = divide(10, 2).unwrap();  // Panic nếu Err
```

> [!WARNING]
> Không dùng `.unwrap()` trong production code! Nó sẽ crash chương trình nếu có lỗi.

---

## 2.6 Async/Await

> 💡 **Quan trọng cho Backend** - Tất cả database operations là async.

```rust
// Async function trả về Future
async fn fetch_data() -> String {
    "Data".to_string()
}

// Gọi async function PHẢI dùng .await
async fn main() {
    let data = fetch_data().await;
    println!("{}", data);
}

// Async với error handling
async fn get_user(id: i32) -> Result<User, String> {
    let user = find_user_in_db(id).await?;  // ? vẫn hoạt động
    Ok(user)
}
```

---

## 2.7 Closures & Iterators

```rust
// Closure - anonymous function
let add = |x, y| x + y;
println!("{}", add(3, 5));  // 8

// Closure với môi trường bên ngoài
let multiplier = 3;
let multiply = |x| x * multiplier;
println!("{}", multiply(5));  // 15

// Iterator chains
let numbers = vec![1, 2, 3, 4, 5];
let result: Vec<i32> = numbers
    .iter()
    .map(|x| x * 2)      // [2, 4, 6, 8, 10]
    .filter(|x| *x > 4)  // [6, 8, 10]
    .collect();

println!("{:?}", result);  // [6, 8, 10]
```

---

## 📝 Bài tập Thực hành

1. Tạo project mới và chạy thử các ví dụ trên:

    ```bash
    cargo new rust_practice
    cd rust_practice
    # Sửa src/main.rs
    cargo run
    ```

2. Viết hàm tính factorial với error handling:
    ```rust
    fn factorial(n: u32) -> Result<u32, String> {
        // TODO: Implement
    }
    ```

---

## Tiếp theo

➡️ [Cấu trúc Dự án](./03-project-structure.md) - Tìm hiểu folder structure của Vaultrs
