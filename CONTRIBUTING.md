# Development Notes

> **Note:** This is a personal learning project. The content below represents planned development guidelines and architectural decisions for reference purposes.

## Project Status

**Current Phase:** Planning & Design  
**Development Status:** Not yet implemented  
**Purpose:** Personal learning and exploration

---

## Learning Objectives

### Technical Skills

-   Master Rust for systems programming
-   Explore Tauri framework for desktop applications
-   Advanced React patterns and performance optimization
-   Database design and optimization at scale
-   Async programming with Tokio

### Architecture Patterns

-   Repository pattern in Rust
-   Service layer design
-   IPC communication (Tauri commands)
-   Virtual scrolling implementation
-   Background worker patterns

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

## Planned Technology Decisions

### Why Rust + Tauri?

**Advantages:**

-   Native performance
-   Memory safety without GC
-   Small binary size (~8MB vs Electron's ~150MB)
-   Security through sandboxing
-   Cross-platform support

**Trade-offs:**

-   Steeper learning curve
-   Longer compile times
-   Smaller ecosystem than Node.js

### Why SQLite?

**Advantages:**

-   Zero configuration
-   Single file storage
-   Excellent read performance
-   ACID compliance
-   Portable

**Trade-offs:**

-   Limited concurrent writes
-   No network access
-   Single-user only (perfect for this use case)

### Why EAV + JSON Schema?

**Advantages:**

-   Flexible schema changes
-   No migrations for new fields
-   Fast indexed queries on common fields
-   JSON for custom attributes

**Trade-offs:**

-   More complex queries
-   Larger database size
-   Need to validate JSON data

---

## Development Workflow (Planned)

### Local Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/vaultrs.git
cd vaultrs

# Install dependencies
cd src-ui && npm install
cd ../src-tauri && cargo build

# Run development server
npm run tauri dev
```

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

### Code Standards

**Rust:**

```rust
// Use descriptive names
pub struct ItemService { }

// Document public APIs
/// Creates a new item in the collection.
pub async fn create_item() { }

// Handle errors explicitly
fn process() -> Result<Item, Error> { }

// Use ? operator for propagation
let item = fetch_item()?;
```

**TypeScript:**

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

---

## Architecture Decisions

### ADR 001: Use SQLite Instead of PostgreSQL

**Status:** Accepted

**Context:**
Need embedded database for single-user desktop app.

**Decision:**
Use SQLite with WAL mode.

**Consequences:**

-   ✅ Zero configuration
-   ✅ Single file backup
-   ✅ Fast local reads
-   ❌ No concurrent writes
-   ❌ No network access

### ADR 002: Hybrid EAV + JSON Schema

**Status:** Accepted

**Context:**
Need flexible schema for custom fields while maintaining query performance.

**Decision:**
Store common fields (title, created_at) as columns, custom fields in JSON.

**Consequences:**

-   ✅ Flexible custom fields
-   ✅ Fast queries on indexed columns
-   ✅ No migrations for new attributes
-   ❌ More complex queries
-   ❌ Larger database size

### ADR 003: Virtual Scrolling for UI

**Status:** Accepted

**Context:**
Need to display 10M+ rows without performance issues.

**Decision:**
Use TanStack Virtual for row virtualization.

**Consequences:**

-   ✅ Constant memory usage
-   ✅ Smooth 60 FPS scrolling
-   ✅ Handles infinite data
-   ❌ Complexity in row rendering
-   ❌ Requires fixed row heights

---

## Learning Resources

### Rust

-   [The Rust Book](https://doc.rust-lang.org/book/)
-   [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
-   [Async Rust](https://rust-lang.github.io/async-book/)

### Tauri

-   [Tauri Documentation](https://tauri.app/v1/guides/)
-   [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)

### Performance

-   [SQLite Performance Tuning](https://www.sqlite.org/optoverview.html)
-   [React Performance](https://react.dev/learn/render-and-commit)

---

## Development Log

### 2024-11 - Initial Planning

-   ✅ Defined project scope
-   ✅ Designed architecture
-   ✅ Documented database schema
-   ✅ Planned API structure
-   ✅ Created comprehensive documentation

### Next Steps

-   [ ] Setup development environment
-   [ ] Create project scaffolding
-   [ ] Implement basic database layer
-   [ ] Build minimal UI

---

## Personal Notes

**What I Want to Learn:**

-   Rust ownership and lifetimes in practice
-   Async programming patterns
-   Performance optimization techniques
-   Desktop app distribution

**Challenges Expected:**

-   Handling 10M+ records efficiently
-   Managing complex async operations
-   Virtual scrolling edge cases
-   Cross-platform compatibility

**Success Criteria:**

-   Can manage 10M records smoothly
-   60 FPS scrolling
-   Sub-100ms search queries
-   Clean, maintainable code

---

## Related Documentation

-   [Architecture Overview](.docs/ARCHITECTURE.md) - System design
-   [Database Schema](.docs/DATABASE.md) - Data structure
-   [API Reference](.docs/API.md) - Planned commands
-   [Performance Guide](.docs/PERFORMANCE.md) - Optimization strategies

---

**Remember:** This is a learning journey. Take time to understand concepts deeply rather than rushing to implementation.
