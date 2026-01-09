# Project Context

## Purpose

**Vaultrs** is a high-performance desktop application for managing large-scale personal collections (media, books, photos, scientific records, inventory, etc.). The goal is to build a system that can handle **10+ million records** smoothly without requiring servers, Docker containers, or complex infrastructure.

### Goals

- 🚀 **Native Performance**: Direct system access via Tauri, no browser overhead
- 💾 **Embedded Database**: SQLite with WAL mode - zero configuration needed
- ⚡ **Virtual Scrolling**: Handle millions of rows without UI lag
- 🔄 **Auto-Crawling**: Automated metadata fetching with background workers
- 🎨 **Dynamic Schema**: Flexible EAV + JSON architecture for custom fields
- 🔒 **Privacy-First**: All data stored locally, complete offline capability

### Personal Learning Goals

- Master Rust systems programming
- Explore Tauri for desktop app development
- Learn advanced React patterns (virtual scrolling, etc.)
- Practice database optimization at scale
- Build a real-world application from scratch

## Tech Stack

### Frontend

- **React 19** + **TypeScript** + **Vite 7** - UI framework and bundler
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn UI** + **Radix UI** - Component library
- **TanStack Table** - Data grid management
- **TanStack Virtual** - Virtual scrolling for 10M+ records
- **Zustand** - State management
- **Lucide React** - Icon library

### Backend

- **Rust 1.70+** + **Tauri v2** - Desktop framework
- **Tokio** - Async runtime
- **SeaORM 1.x** + **SQLx 0.8** - Database ORM and driver
- **SQLite (WAL Mode)** - Embedded database
- **Reqwest 0.12** - HTTP client for crawling
- **Serde** / **Serde JSON** - Serialization
- **thiserror** - Error handling
- **log** + **env_logger** - Logging

### Development Tools

- **pnpm** - Package manager (frontend)
- **Cargo** - Package manager (backend)
- **ESLint** - TypeScript/React linting
- **TypeScript 5.9** - Type checking

## Project Conventions

### Code Style

#### Rust (Backend)

| Element        | Convention              | Example                                   |
| -------------- | ----------------------- | ----------------------------------------- |
| Module         | `snake_case`            | `vault_manager`, `crypto_utils`           |
| Struct/Enum    | `PascalCase`            | `VaultEntry`, `EncryptionAlgorithm`       |
| Function       | `snake_case`            | `encrypt_password()`, `get_vault_entries()` |
| Constant       | `SCREAMING_SNAKE_CASE`  | `MAX_PASSWORD_LENGTH`, `DEFAULT_ITERATIONS` |
| Variable       | `snake_case`            | `master_password`, `vault_data`           |
| File           | `snake_case.rs`         | `vault_manager.rs`, `crypto_utils.rs`     |

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

#### TypeScript/React (Frontend)

| Element        | Convention                     | Example                           |
| -------------- | ------------------------------ | --------------------------------- |
| Component      | `PascalCase`                   | `PasswordList`, `VaultHeader`     |
| Hook           | `camelCase` with `use` prefix  | `useVault()`, `useEncryption()`   |
| Function       | `camelCase`                    | `handleSubmit()`, `validatePassword()` |
| Variable       | `camelCase`                    | `masterPassword`, `vaultEntries`  |
| Constant       | `SCREAMING_SNAKE_CASE`         | `API_BASE_URL`, `MAX_RETRIES`     |
| Interface/Type | `PascalCase`                   | `VaultEntry`, `EncryptionConfig`  |
| Component file | `PascalCase.tsx`               | `PasswordList.tsx`                |
| Hook file      | `camelCase.ts`                 | `useVault.ts`                     |

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

#### Naming Best Practices

- **Boolean variables**: Use prefixes `is`, `has`, `should`, `can`
- **Functions**: Verb + Noun (e.g., `getVaultEntry`, `createVault`)
- **Collections**: Use plural names (e.g., `vaultEntries`, `passwords`)
- **Avoid abbreviations**: Unless very common (`id`, `url`, `html`)

### Architecture Patterns

**Modular Monolith Architecture** - All components in a single application but organized by clear module boundaries.

```
┌────────────────────────────────────────────────────────────┐
│                     DESKTOP APPLICATION                    │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PRESENTATION LAYER (React)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕ IPC (Tauri)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               SERVICE LAYER (Rust)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕ ORM (SeaORM)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                DATA LAYER (SQLite)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

#### Key Patterns

1. **Repository Pattern** - Data access abstraction in Rust
2. **Service Layer** - Business logic separation
3. **Dependency Inversion** - Services depend on traits, not concrete implementations
4. **Single Responsibility** - Each module handles one concern

#### Backend Module Structure

```
src-tauri/src/
├── core/          # Utilities, errors, config
├── crypto/        # Encryption, hashing
├── auth/          # Authentication (optional)
├── vault/         # Collection/vault management
├── entry/         # Item CRUD operations
├── generator/     # ID generation, utilities
└── crawler/       # Background metadata fetching
```

#### Frontend Module Structure

```
src/modules/
├── auth/          # Login, unlock screens
├── vault/         # Collection management
├── entry/         # Item list, details, forms
└── generator/     # Utility components
```

### Testing Strategy

#### Unit Tests

- Test business logic in isolation
- Mock external dependencies
- Fast feedback loop

#### Integration Tests

- Test full workflows
- Use in-memory SQLite
- Verify IPC communication

#### Performance Tests

- Benchmark critical operations
- Test with large datasets (10M+ records)
- Profile memory usage

#### Performance Targets

| Operation         | Target   | Strategy            |
| ----------------- | -------- | ------------------- |
| Initial Load      | < 500ms  | Pagination + index  |
| Scroll Frame Rate | 60 FPS   | Virtual scrolling   |
| Search            | < 100ms  | SQLite FTS          |
| Insert            | < 10ms   | Optimized writes    |

### Git Workflow

#### Branching Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

#### Commit Conventions

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Domain Context

### Core Concepts

- **Vault**: A collection/container for organizing items
- **Entry**: An individual record within a vault (media, book, photo, etc.)
- **Collection**: User-defined grouping of entries
- **Crawler**: Background worker that fetches metadata from external sources
- **Dynamic Schema**: EAV (Entity-Attribute-Value) + JSON columns for flexible custom fields

### Use Cases

- **Media Collections**: Movies, TV series, anime, music
- **Book Library**: Books, ebooks, manga
- **Photo Archive**: Personal photo organization
- **Scientific Records**: Research data management
- **Inventory**: Equipment and item tracking

### Key Features

- Virtual scrolling for 10M+ records display
- Full-text search with indexed SQLite queries
- Custom fields without schema migrations
- Background metadata crawling
- Offline-first operation

## Important Constraints

### Technical Constraints

- **Single User Only**: Desktop app, no multi-user support needed
- **No Network Requirement**: Must work 100% offline
- **SQLite Limitations**: Limited concurrent writes (acceptable for single-user)
- **Cross-Platform**: Must support Windows, macOS, Linux

### Performance Constraints

- Must handle 10+ million records smoothly
- 60 FPS scrolling is mandatory
- Search queries under 100ms
- Startup time under 500ms

### Privacy Constraints

- All data stored locally by default
- No telemetry without explicit consent
- No cloud sync (unless user explicitly enables)

### Project Status

- **Status**: Planning & Design phase
- **Development**: Early stage
- **Purpose**: Personal learning project

## External Dependencies

### Metadata Sources (Planned)

- External APIs for media metadata (e.g., TMDB, IGDB)
- Book databases (e.g., Open Library)
- Custom crawler adapters

### Development Dependencies

- **GitHub**: Source control and CI/CD
- **GitHub Actions**: Automated testing and builds

### Runtime Dependencies

- **SQLite**: Embedded database (bundled)
- **WebView2** (Windows) / **WebKit** (macOS/Linux): UI rendering via Tauri
