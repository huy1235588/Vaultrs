# Design: Codebase Modularization

## Context

The Vaultrs application has three main domains: Vault, Entry, and Field. The current structure organizes code by technical concern (api/, types/, stores/, components/) rather than by domain. This makes it harder to:
- Understand what a feature does (files scattered across directories)
- Add new features (unclear where new code should go)
- Maintain bounded contexts between domains

The backend is better organized with domain modules (vault/, entry/, field/, image/) but the entry service has grown too large with multiple responsibilities.

## Goals

- **Improve discoverability**: Related code lives together
- **Enforce module boundaries**: Clear interfaces between domains
- **Enable independent development**: Teams can work on different modules
- **Simplify testing**: Smaller, focused units
- **Follow project conventions**: Align with `project.md` architecture patterns

## Non-Goals

- Add new features
- Change API contracts
- Modify database schema
- Change external behavior

## Decisions

### Decision 1: Feature-based Module Structure for Frontend

**What**: Organize frontend code into `modules/<domain>/` directories

**Structure**:
```
src/
├── modules/
│   ├── vault/
│   │   ├── api.ts           # Tauri command wrappers
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── store.ts         # Zustand store
│   │   ├── components/      # Vault-specific components
│   │   │   ├── CreateVaultDialog.tsx
│   │   │   ├── VaultHeader.tsx
│   │   │   ├── VaultListItem.tsx
│   │   │   └── index.ts
│   │   └── index.ts         # Public exports
│   ├── entry/
│   │   ├── api.ts
│   │   ├── types.ts
│   │   ├── store.ts
│   │   ├── components/
│   │   │   ├── CreateEntryDialog.tsx
│   │   │   ├── EntryList.tsx
│   │   │   ├── EntryRow.tsx
│   │   │   ├── ...
│   │   │   └── index.ts
│   │   └── index.ts
│   └── field/
│       ├── api.ts
│       ├── types.ts
│       ├── store.ts
│       ├── components/
│       │   ├── FieldDefinitionManager.tsx
│       │   ├── ...
│       │   └── index.ts
│       └── index.ts
├── components/
│   ├── ui/                  # Shared UI primitives (shadcn)
│   └── layout/              # App layout components
├── lib/
│   └── utils.ts
├── App.tsx
└── main.tsx
```

**Why**: 
- Each domain is self-contained
- Clear public API via `index.ts` barrel exports
- Easy to understand scope of a feature
- Matches `project.md` Frontend Module Structure specification

**Alternatives considered**:
- Keep flat structure: Rejected - doesn't scale, violates project conventions
- Fully nested (components inside stores): Rejected - too deep nesting

### Decision 2: Split EntryService by Responsibility

**What**: Extract image and search operations into separate services

**Structure**:
```
entry/
├── mod.rs
├── model.rs           # DTOs (unchanged)
├── service.rs         # Core CRUD: create, get, list, count, update, delete
├── image_service.rs   # Image ops: set_cover_from_file, set_cover_from_url, 
│                      #            remove_cover, get_thumbnail
└── search_service.rs  # Search ops: search, build_fts_query
```

**Why**:
- Current `service.rs` is 871 lines
- CRUD, Image, and Search are distinct concerns
- Enables independent testing and modification
- Follows Single Responsibility Principle

**Alternatives considered**:
- Keep single service: Rejected - violates SRP, too large
- Separate modules entirely: Rejected - too drastic, they share Entry entity

### Decision 3: Preserve API Stability

**What**: Keep all Tauri command signatures unchanged

**Why**:
- Reduces migration risk
- No need to update frontend API calls
- Refactoring is internal only

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Import path errors | TypeScript will catch at compile time |
| Forgotten file moves | Verification step: cargo build + pnpm build |
| Circular dependencies | Module index.ts only exports public API |
| Regression bugs | Existing tests must pass after refactoring |

## Migration Plan

### Phase 1: Backend Service Split (Low Risk)
1. Create `entry/image_service.rs` with image methods
2. Create `entry/search_service.rs` with search methods
3. Update `entry/mod.rs` to export new services
4. Update `commands/entry_commands.rs` and `commands/image_commands.rs` to use new services
5. Verify: `cargo build`, `cargo test`

### Phase 2: Frontend Module Creation (Medium Risk)
1. Create `modules/` directory structure
2. Create module index files with proper exports
3. Move and adapt files one module at a time (vault → entry → field)
4. Update imports in `App.tsx` and all referencing files
5. Verify: `pnpm build`, `pnpm dev`

### Rollback
If issues arise, git revert is straightforward as this is pure refactoring with no data changes.

## Open Questions

None - this is a straightforward structural refactoring following established patterns in `project.md`.
