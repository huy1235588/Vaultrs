# entry-management Specification

## Purpose

Complete entry lifecycle management including CRUD operations, detail views, editing, and custom field support for entries within vaults.

## Requirements
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

### Requirement: Entry Detail View

The system SHALL provide a detail view for entries allowing users to see all entry information.

#### Scenario: Open entry detail

- **WHEN** user clicks on an entry in the list
- **THEN** a detail dialog opens showing full entry information
- **AND** the dialog displays title, description, creation date, and last updated date

#### Scenario: Close entry detail

- **WHEN** user clicks outside the dialog or presses Escape
- **THEN** the dialog closes
- **AND** the entry list scroll position is preserved

---

### Requirement: Entry Editing

The system SHALL allow users to edit entry information from the detail view.

#### Scenario: Enter edit mode

- **WHEN** user clicks the Edit button in the detail dialog
- **THEN** the dialog switches to edit mode
- **AND** all editable fields become input controls

#### Scenario: Save entry changes

- **WHEN** user modifies entry fields and clicks Save
- **THEN** the entry is updated in the database
- **AND** the entry list reflects the changes immediately
- **AND** the dialog shows the updated entry in view mode

#### Scenario: Cancel edit

- **WHEN** user clicks Cancel during edit mode
- **THEN** unsaved changes are discarded
- **AND** the dialog returns to view mode with original values

#### Scenario: Validation error

- **WHEN** user submits invalid data (empty title)
- **THEN** the form displays validation errors
- **AND** the entry is not saved

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

### Requirement: Entry Deletion with Confirmation

The system SHALL allow users to delete entries with confirmation.

#### Scenario: Delete entry with confirmation

- **WHEN** user clicks Delete button in the detail dialog
- **THEN** a confirmation dialog appears asking "Delete this entry?"
- **AND** the dialog warns that deletion cannot be undone

#### Scenario: Confirm deletion

- **WHEN** user confirms the deletion
- **THEN** the entry is removed from the database
- **AND** the entry list updates immediately
- **AND** the detail dialog closes
- **AND** the vault entry count decreases

#### Scenario: Cancel deletion

- **WHEN** user cancels the deletion confirmation
- **THEN** the entry remains unchanged
- **AND** the confirmation dialog closes

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

---

### Requirement: Custom Field Values

The system SHALL display and allow editing of custom field values for entries.

#### Scenario: Display custom fields

- **WHEN** the detail view opens for an entry
- **THEN** all defined custom fields for the vault are displayed
- **AND** fields show their current values or "Not set" if empty

#### Scenario: Edit custom field value

- **WHEN** user edits a custom field value in edit mode
- **THEN** the value is validated against the field type definition
- **AND** the value is saved with the entry metadata

#### Scenario: Required field validation

- **WHEN** user tries to save an entry with empty required custom fields
- **THEN** a validation error is shown for the required field
- **AND** the entry is not saved until the field is filled
