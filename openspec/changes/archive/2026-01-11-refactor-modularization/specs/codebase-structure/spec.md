## ADDED Requirements

### Requirement: Backend Service Separation
The backend MUST organize service logic according to Single Responsibility Principle, with each service file handling one cohesive set of operations.

#### Scenario: Entry module structure
- **GIVEN** the entry module in `src-tauri/src/entry/`
- **WHEN** reviewing the module structure
- **THEN** it SHALL contain:
  - `service.rs` for core CRUD operations (create, get, list, count, update, delete)
  - `image_service.rs` for image operations (set_cover_from_file, set_cover_from_url, remove_cover, get_thumbnail)
  - `search_service.rs` for search operations (search, build_fts_query)
  - `model.rs` for data transfer objects
  - `mod.rs` for module exports

#### Scenario: Service file size constraint
- **GIVEN** any service file in the backend
- **WHEN** measuring file complexity
- **THEN** each service file SHOULD have a single cohesive responsibility
- **AND** related operations SHOULD be grouped together

### Requirement: Frontend Module Organization
The frontend MUST organize code by domain modules rather than by technical concern, following the modular monolith pattern.

#### Scenario: Module directory structure
- **GIVEN** the frontend source directory `src/`
- **WHEN** reviewing the directory structure
- **THEN** it SHALL contain a `modules/` directory with subdirectories for each domain:
  - `modules/vault/` for vault-related code
  - `modules/entry/` for entry-related code
  - `modules/field/` for field definition-related code

#### Scenario: Module contents
- **GIVEN** any domain module in `src/modules/<domain>/`
- **WHEN** reviewing its contents
- **THEN** it SHALL contain:
  - `api.ts` for Tauri command wrappers
  - `types.ts` for TypeScript interfaces
  - `store.ts` for Zustand state management
  - `components/` directory for domain-specific React components
  - `index.ts` for public exports (barrel file)

#### Scenario: Shared components remain separate
- **GIVEN** the shared UI components
- **WHEN** reviewing their location
- **THEN** they SHALL remain in:
  - `src/components/ui/` for reusable UI primitives
  - `src/components/layout/` for layout components

### Requirement: Module Encapsulation
Each module MUST expose a clean public API through its `index.ts` barrel file, hiding internal implementation details.

#### Scenario: Importing from a module
- **GIVEN** a component that needs to use vault functionality
- **WHEN** importing vault-related code
- **THEN** it SHALL import from `@/modules/vault` (or relative path to index)
- **AND** it SHALL NOT import directly from internal module files

#### Scenario: Module barrel exports
- **GIVEN** a module's `index.ts` file
- **WHEN** reviewing its exports
- **THEN** it SHALL export:
  - The API object (e.g., `vaultApi`)
  - Type definitions used externally
  - The store hook (e.g., `useVaultStore`)
  - Component exports from `./components`
