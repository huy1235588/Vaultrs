# Vaultrs

> **A privacy-first, offline-capable desktop knowledge base for organizing personal metadata at scale.**

[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri%20v2-FFC131?style=flat&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Backend-Rust-000000?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20WAL-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

> ⚠️ **Disclaimer:** Vaultrs is a personal, non-commercial project built for learning purposes. It is **not** production-ready and comes with **no guarantees** of stability, data integrity, or long-term maintenance. Use at your own discretion.

---

## Overview

Vaultrs is a native desktop application that acts as a **personal metadata vault** — a structured, offline knowledge base for tracking anything you care about. Users define **Collections** (e.g., films, characters, games, bookmarks) and populate them with **Items**, each carrying a fully customizable set of fields.

The core design goal is **performance without compromise**: Vaultrs is engineered to remain responsive with **10 million+ records**, running entirely on an embedded database with zero cloud dependency.

---

## Key Features

- **Collection-based Architecture** — Organize data into typed, user-defined Collections. Each Collection has its own schema, independent of others.

- **Cross-Collection Item Linking (Relational Metadata)** — Link Items across Collections to form a personal **Knowledge Graph**. For example, a _Film_ Item can reference multiple _Actor_ Items from a separate Collection, capturing rich relational context without a server-side graph database.

- **Virtual Scrolling for 10M+ Records** — The UI renders only visible rows via `TanStack Virtual`, keeping memory footprint flat regardless of dataset size.

- **Full-Text Search (FTS5)** — SQLite's FTS5 extension powers fast, ranked full-text search across all Item fields.

- **Infinite Custom Fields via EAV Model** — Each Item supports an arbitrary number of user-defined fields (text, number, date, boolean, reference) through a flexible Entity–Attribute–Value schema.

- **Privacy-First & Fully Offline** — No accounts, no telemetry, no network calls. All data lives in a single SQLite file on your machine. You own it entirely.

---

## Architecture

### Why Tauri + Embedded SQLite?

Tauri's Rust backend gives Vaultrs a **minimal binary footprint** and direct, low-overhead access to the filesystem and SQLite — without the Electron overhead of shipping a full Chromium runtime. SQLite in **WAL (Write-Ahead Logging) mode** enables high-throughput concurrent reads alongside writes, which is critical for smooth virtual scrolling and background indexing at scale.

The frontend (React 19 + TypeScript 7) communicates with the Rust core exclusively via **Tauri IPC commands**, maintaining a clean boundary between the UI layer and domain logic.

### Backend Domain Structure

The Rust backend follows a **feature-module (Domain-Driven) layout**, with clearly separated domains:

```
src-tauri/src/
├── collections/      # Collection CRUD, schema management
├── items/            # Item lifecycle, bulk operations
├── custom_fields/    # EAV engine — field definitions & typed values
├── relations/        # Cross-collection Item link resolution
└── search/           # FTS5 indexing and query coordination
```

### EAV with Reference Support

The EAV model is extended beyond primitive types to support a `reference` field type, which stores the ID of a target Item in another Collection. The `relations` domain resolves these references at query time, enabling the Cross-Collection Linking feature without schema coupling between Collections.

### Database Schema

![ERD Diagram](./docs/database-erd.png)

> _Entity-Relationship Diagram — see [`docs/02-database/2-schema.md`](docs/02-database/2-schema.md) for a full schema walkthrough with a text-based ERD._

---

## Prerequisites

| Dependency                            | Version         | Notes                                    |
| ------------------------------------- | --------------- | ---------------------------------------- |
| [Rust](https://rustup.rs/)            | stable (≥ 1.80) | Install via `rustup`                     |
| [Node.js](https://nodejs.org/)        | ≥ 20.19 LTS     | Vite 8 requires ≥ 20.19 or ≥ 22.12       |
| [Tauri CLI](https://tauri.app/start/) | v2 (≥ 2.11)     | `cargo install tauri-cli --version "^2"` |

> 📌 Minimum versions reviewed July 2026 — see detailed rationale (Vite 8 uses Rolldown, requires newer Node) at [Tech Stack](docs/01-architecture/3-tech-stack.md).

Platform-specific Tauri prerequisites (WebView2 on Windows, webkit2gtk on Linux) are documented in the [official Tauri setup guide](https://tauri.app/start/prerequisites/).

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/huy1235588/vaultrs.git
cd vaultrs

# 2. Install frontend dependencies
npm install

# 3. Start the development build
cargo tauri dev
```

> **Note:** On first run, Vaultrs automatically creates the SQLite database file and applies all schema migrations via the embedded migration runner. No manual setup required.

To produce an optimized production build:

```bash
cargo tauri build
```

---

## Tech Stack

| Layer                  | Technology                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Desktop Shell          | [Tauri v2](https://tauri.app) (2.11.x)                                                                  |
| Backend                | [Rust](https://www.rust-lang.org) + Tokio                                                               |
| Database               | [SQLite](https://www.sqlite.org) 3.53.x (WAL mode, FTS5) + [SeaORM](https://www.sea-ql.org/SeaORM/) 2.0 |
| Frontend               | [React 19](https://react.dev) + [TypeScript 7](https://www.typescriptlang.org)                          |
| Build Tool             | [Vite](https://vitejs.dev) 8.x (Rolldown/Oxc)                                                           |
| UI Components          | [shadcn/ui](https://ui.shadcn.com) (CLI v4) + [Tailwind CSS](https://tailwindcss.com) 4.x               |
| Table / Virtualization | [TanStack Table](https://tanstack.com/table) v9 + [TanStack Virtual](https://tanstack.com/virtual)      |

> See upgrade notes for each version change (especially Tailwind v3→v4 and TypeScript 7) at [docs/01-architecture/3-tech-stack.md](docs/01-architecture/3-tech-stack.md#5--ghi-chú-nâng-cấp-upgrade-notes).

---

## Further Documentation

| Document                                                    | Description                                                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [Architecture Overview](docs/01-architecture/1-overview.md) | Domain design, module layout, layer responsibilities                                                |
| [System Design](docs/01-architecture/2-system-design.md)    | Component breakdown, state management, image storage                                                |
| [Tech Stack](docs/01-architecture/3-tech-stack.md)          | Full technology list with current versions and upgrade notes                                        |
| [Database Docs](docs/02-database/)                          | Schema, indexes, queries, migrations, backup, ERD walkthrough                                       |
| API & IPC Commands                                          | ⚠️ Not written yet — full Tauri command reference is still a TODO in `docs/00-meta/6-docs-index.md` |
| [Contributing Guidelines](CONTRIBUTING.md)                  | Development workflow, code standards, branch strategy                                              |

---

## License

Distributed under the [MIT License](LICENSE).
