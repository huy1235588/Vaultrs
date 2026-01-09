# Capability: Vault Management

Vaults are containers for organizing entries. Users can create multiple vaults to categorize their collections (e.g., Movies, Books, Photos).

## ADDED Requirements

### Requirement: Create Vault

The system SHALL allow users to create a new vault with a name and optional description.

#### Scenario: Successful vault creation

- **GIVEN** the user is on the main application screen
- **WHEN** the user creates a vault with name "Movies" and description "My movie collection"
- **THEN** the vault is persisted to the database
- **AND** the vault appears in the sidebar vault list
- **AND** the vault is automatically selected as active

#### Scenario: Vault creation with empty name

- **GIVEN** the user opens the create vault dialog
- **WHEN** the user submits without entering a name
- **THEN** the system displays a validation error "Name is required"
- **AND** the vault is not created

---

### Requirement: List Vaults

The system SHALL display all vaults in a sidebar list, ordered by creation date (newest first).

#### Scenario: Display vault list

- **GIVEN** the user has created vaults "Movies", "Books", and "Photos"
- **WHEN** the application loads
- **THEN** all three vaults are displayed in the sidebar
- **AND** vaults are ordered by creation date descending

#### Scenario: Empty vault list

- **GIVEN** no vaults exist in the database
- **WHEN** the application loads
- **THEN** the sidebar displays an empty state message prompting user to create their first vault

---

### Requirement: Select Vault

The system SHALL allow users to select a vault to view its entries.

#### Scenario: Select vault from sidebar

- **GIVEN** vaults "Movies" and "Books" exist
- **WHEN** the user clicks on "Books" in the sidebar
- **THEN** "Books" is marked as the active vault
- **AND** the content area displays entries for "Books"
- **AND** the vault header shows "Books" information

---

### Requirement: Update Vault

The system SHALL allow users to update a vault's name and description.

#### Scenario: Rename vault

- **GIVEN** a vault named "Movies" exists
- **WHEN** the user updates the vault name to "Films"
- **THEN** the vault name is updated in the database
- **AND** the sidebar reflects the new name "Films"
- **AND** the vault header shows "Films"

---

### Requirement: Delete Vault

The system SHALL allow users to delete a vault and all its entries.

#### Scenario: Delete vault with entries

- **GIVEN** a vault "Movies" with 100 entries exists
- **WHEN** the user deletes the vault
- **THEN** the vault is removed from the database
- **AND** all 100 entries are cascade deleted
- **AND** the vault disappears from the sidebar
- **AND** another vault becomes active (or empty state if no vaults remain)

#### Scenario: Delete confirmation

- **GIVEN** a vault "Movies" with entries exists
- **WHEN** the user initiates vault deletion
- **THEN** a confirmation dialog is displayed warning about data loss
- **AND** deletion only proceeds if user confirms
