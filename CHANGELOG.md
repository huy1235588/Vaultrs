# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

-   📋 Initial project planning and design
-   📐 Architecture documentation (Modular Monolith, EAV + JSON hybrid)
-   🗄️ Database schema design (Collections, Items, Attributes)
-   📊 Performance targets and optimization strategies (10M+ records)
-   📚 Comprehensive documentation suite

### Designed

-   System architecture (Modular Monolith with Tauri + React)
-   Collection/Item/Attribute data model (EAV + JSON hybrid)
-   Virtual scrolling implementation plan (TanStack Virtual)
-   Background worker pattern for metadata crawlers
-   SQLite optimization strategies (WAL mode, FTS5, indexes)
-   Image storage architecture (file system + lazy thumbnails)

---

## Planned Releases

### Version 0.1.0 (Target: TBD)

**Focus:** Core Foundation

-   [ ] Basic Tauri v2 + React 19 setup
-   [ ] SQLite database integration with SeaORM
-   [ ] Collection CRUD operations
-   [ ] Basic Item management
-   [ ] UI with shadcn/ui components

### Version 0.2.0 (Target: TBD)

**Focus:** Custom Fields & Data

-   [ ] Attribute system implementation (EAV)
-   [ ] Dynamic schema per Collection
-   [ ] Item properties (JSON)
-   [ ] Basic search functionality (FTS5)
-   [ ] Import/Export (JSON)

### Version 0.3.0 (Target: TBD)

**Focus:** Performance at Scale

-   [ ] Virtual scrolling implementation (TanStack Virtual)
-   [ ] Database indexing optimization
-   [ ] Cursor-based pagination
-   [ ] Query performance tuning
-   [ ] Handle 100K+ records smoothly

### Version 0.5.0 (Target: TBD)

**Focus:** Advanced Features

-   [ ] Background metadata crawler service
-   [ ] Cross-collection Item linking (Relations)
-   [ ] Advanced filtering & sorting
-   [ ] Bulk operations
-   [ ] Cover image management

### Version 1.0.0 (Target: TBD)

**Focus:** Stable Release

-   [ ] Handle 10M+ records
-   [ ] Complete UI/UX polish
-   [ ] Comprehensive testing
-   [ ] Documentation completion
-   [ ] First stable release

---

**Project Status:** Planning & Design Phase
**Last Updated:** 2026-07-16

[Unreleased]: https://github.com/huy1235588/vaultrs/tree/main
