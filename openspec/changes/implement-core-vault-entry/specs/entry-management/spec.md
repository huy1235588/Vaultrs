# Capability: Entry Management

Entries are individual records within a vault. Each entry represents a single item in the user's collection (e.g., a movie, book, or photo).

## ADDED Requirements

### Requirement: Create Entry

The system SHALL allow users to create a new entry with a title and optional description within the active vault.

#### Scenario: Successful entry creation

- **GIVEN** the user has selected vault "Movies"
- **WHEN** the user creates an entry with title "Inception" and description "A mind-bending thriller"
- **THEN** the entry is persisted to the database with vault_id referencing "Movies"
- **AND** the entry appears at the top of the entry list
- **AND** the vault entry count is incremented

#### Scenario: Entry creation with empty title

- **GIVEN** the user opens the create entry dialog
- **WHEN** the user submits without entering a title
- **THEN** the system displays a validation error "Title is required"
- **AND** the entry is not created

#### Scenario: Entry creation without active vault

- **GIVEN** no vault is currently selected
- **WHEN** the user attempts to create an entry
- **THEN** the create entry button is disabled
- **OR** a prompt asks user to select a vault first

---

### Requirement: List Entries with Pagination

The system SHALL display entries in a paginated list, loading entries on demand to support large datasets.

#### Scenario: Display first page of entries

- **GIVEN** vault "Movies" contains 10,000 entries
- **WHEN** the user selects vault "Movies"
- **THEN** the first 100 entries are loaded and displayed
- **AND** the UI shows the total count "10,000 entries"

#### Scenario: Load more entries on scroll

- **GIVEN** vault "Movies" is active with 10,000 entries
- **AND** first 100 entries are displayed
- **WHEN** the user scrolls near the bottom of the list
- **THEN** the next batch of 100 entries is loaded
- **AND** entries are appended to the existing list
- **AND** scroll position is preserved

#### Scenario: Empty entry list

- **GIVEN** vault "Movies" has no entries
- **WHEN** the vault is selected
- **THEN** the content area displays an empty state message
- **AND** a prompt encourages user to add their first entry

---

### Requirement: View Entry Details

The system SHALL allow users to view detailed information about an entry.

#### Scenario: View entry in list

- **GIVEN** vault "Movies" contains entry "Inception"
- **WHEN** the user views the entry list
- **THEN** each entry row displays the title and description preview
- **AND** the created date is shown

---

### Requirement: Update Entry

The system SHALL allow users to update an entry's title and description.

#### Scenario: Update entry title

- **GIVEN** entry "Inception" exists in vault "Movies"
- **WHEN** the user updates the entry title to "Inception (2010)"
- **THEN** the entry is updated in the database
- **AND** the entry list reflects the updated title
- **AND** the updated_at timestamp is refreshed

---

### Requirement: Delete Entry

The system SHALL allow users to delete an entry from a vault.

#### Scenario: Delete single entry

- **GIVEN** entry "Inception" exists in vault "Movies"
- **WHEN** the user deletes the entry
- **THEN** the entry is removed from the database
- **AND** the entry disappears from the list
- **AND** the vault entry count is decremented

---

### Requirement: Entry Count Display

The system SHALL display the total number of entries in the active vault.

#### Scenario: Show entry count in header

- **GIVEN** vault "Movies" contains 1,234 entries
- **WHEN** the vault is selected
- **THEN** the vault header displays "1,234 entries"

#### Scenario: Entry count updates on changes

- **GIVEN** vault "Movies" shows "100 entries"
- **WHEN** the user creates a new entry
- **THEN** the count updates to "101 entries" without page reload
