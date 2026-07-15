# Contributing Guide

> **Note:** This is a personal learning project. The content below represents development guidelines and conventions for reference purposes.

## Project Status

**Current Phase:** Planning & Design
**Development Status:** Not yet implemented
**Purpose:** Personal learning and exploration

---

## Development Philosophy

### Design Principles

1. **Simplicity First**

    - Start with minimal viable features
    - Add complexity only when needed
    - Keep APIs simple and intuitive

2. **Performance Matters**

    - Profile before optimizing
    - Benchmark critical paths
    - Design for 10M+ records from day one

3. **Type Safety**

    - Leverage Rust's type system
    - Use TypeScript strictly
    - Minimize runtime errors

4. **Documentation as Design**
    - Write docs before code
    - Use docs to clarify thinking
    - Keep documentation updated

### Code Organization

This project follows a **Modular Monolith** approach:

```
Clear module boundaries
Single deployable artifact
Explicit dependencies
Testable components
```

---

## Development Workflow

### Local Setup

```bash
# Clone repository
git clone https://github.com/huy1235588/vaultrs.git
cd vaultrs

# Install frontend dependencies
npm install

# Start the development build
cargo tauri dev
```

> **Note:** On first run, Vaultrs automatically creates the SQLite database file and applies all schema migrations via the embedded migration runner.

### Testing Strategy

**Unit Tests:**

-   Test business logic in isolation
-   Mock external dependencies
-   Fast feedback loop

**Integration Tests:**

-   Test full workflows
-   Use in-memory SQLite
-   Verify IPC communication

**Performance Tests:**

-   Benchmark critical operations
-   Test with large datasets
-   Profile memory usage

---

## Code Standards

### Rust

```rust
// Use descriptive names
pub struct CollectionService { }

// Document public APIs
/// Creates a new item in the collection.
pub async fn create_item() { }

// Handle errors explicitly
fn process() -> Result<Item, Error> { }

// Use ? operator for propagation
let item = fetch_item()?;
```

### TypeScript

```typescript
// Explicit types
function getItem(id: number): Promise<Item> {}

// Interface for shapes
interface ItemCardProps {
    item: Item;
    onClick: (id: number) => void;
}

// Functional components
export function ItemCard({ item, onClick }: ItemCardProps) {}
```

> See [Naming Conventions](docs/00-meta/2-naming-convention.md) for full naming rules across Rust, React, and file naming.

---

## Branch & Commit Conventions

### Branch Naming

```
feature/<short-description>    # New features
fix/<short-description>        # Bug fixes
docs/<short-description>       # Documentation changes
refactor/<short-description>   # Code refactoring
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Collection CRUD operations
fix: correct pagination offset for filtered queries
docs: update database schema documentation
refactor: extract FTS5 indexing into search module
perf: optimize virtual scrolling for 1M+ items
```

---

## Pull Request Process

1. Create a feature branch from `main`
2. Make changes and write tests
3. Update relevant documentation
4. Submit PR using the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
5. Address review feedback
6. Merge after approval

---

## Related Documentation

-   [Architecture Overview](docs/01-architecture/1-overview.md) — System design
-   [Database Schema](docs/02-database/2-schema.md) — Data structure
-   [Naming Conventions](docs/00-meta/2-naming-convention.md) — Code style
-   [Versioning](docs/00-meta/5-versioning.md) — Release process

---

**Last Updated:** 2026-07
