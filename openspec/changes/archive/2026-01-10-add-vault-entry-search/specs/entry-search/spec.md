# Capability: Entry Search

Full-text search for entries within a vault.

## ADDED Requirements

### Requirement: Full-Text Search in Vault

The system SHALL provide full-text search capability to find entries within a selected vault based on title and description content.

#### Scenario: Search finds matching entries

- **GIVEN** a vault with entries titled "My Movie Collection", "Book Notes", "Travel Photos"
- **WHEN** user enters search query "movie"
- **THEN** the entry list shows only "My Movie Collection"
- **AND** the result count displays "Found 1 entry"

#### Scenario: Search with no results

- **GIVEN** a vault with entries
- **WHEN** user enters search query "xyz123nonexistent"
- **THEN** the entry list shows empty state
- **AND** the message displays "No entries found for 'xyz123nonexistent'"

#### Scenario: Clear search restores full list

- **GIVEN** an active search with filtered results
- **WHEN** user clears the search input
- **THEN** the entry list shows all entries in the vault
- **AND** the result count is removed

### Requirement: Real-Time Search Filtering

The system SHALL filter entry results in real-time as the user types, with appropriate debouncing to optimize performance.

#### Scenario: Debounced search input

- **GIVEN** user is typing in search input
- **WHEN** user types "app" and pauses for 300ms
- **THEN** the search executes and results are filtered
- **AND** no search occurs while user is actively typing within 300ms intervals

#### Scenario: Search performance

- **GIVEN** a vault with 10,000 entries
- **WHEN** user executes a search query
- **THEN** results are displayed within 100ms
- **AND** the UI remains responsive (no freezing)

### Requirement: Search Input Component

The system SHALL provide a search input component in the vault header with appropriate controls and feedback.

#### Scenario: Search input visibility

- **GIVEN** a vault is selected
- **WHEN** the vault content area is displayed
- **THEN** a search input is visible in the vault header
- **AND** the input has a placeholder text "Search entries..."

#### Scenario: Clear button visibility

- **GIVEN** the search input contains text
- **WHEN** viewing the search input
- **THEN** a clear (X) button is visible
- **AND** clicking the button clears the search and restores full entry list

#### Scenario: Loading indicator

- **GIVEN** a search is in progress
- **WHEN** waiting for results
- **THEN** a loading indicator is displayed
- **AND** the indicator disappears when results are ready

### Requirement: Prefix Search Support

The system SHALL support prefix matching to find entries that start with the search query.

#### Scenario: Prefix matching

- **GIVEN** entries titled "Application Settings", "Apple Products", "Banana Recipes"
- **WHEN** user searches for "app"
- **THEN** results include "Application Settings" and "Apple Products"
- **AND** results do not include "Banana Recipes"

### Requirement: Case-Insensitive Search

The system SHALL perform case-insensitive search matching.

#### Scenario: Case insensitivity

- **GIVEN** an entry titled "JavaScript Tutorial"
- **WHEN** user searches for "javascript" (lowercase)
- **THEN** the entry "JavaScript Tutorial" is included in results

#### Scenario: Mixed case query

- **GIVEN** an entry titled "React Native Guide"
- **WHEN** user searches for "REACT native"
- **THEN** the entry "React Native Guide" is included in results
