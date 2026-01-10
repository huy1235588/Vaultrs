# entry-management Specification Deltas

## MODIFIED Requirements

### Requirement: View Entry Details

The system SHALL allow users to view detailed information about an entry, including cover image thumbnail if present.

#### Scenario: View entry in list

- **GIVEN** vault "Movies" contains entry "Inception"
- **WHEN** the user views the entry list
- **THEN** each entry row displays the title and description preview
- **AND** the created date is shown
- **AND** if the entry has a cover image, the thumbnail is displayed

#### Scenario: View entry without cover image

- **GIVEN** vault "Movies" contains entry "Inception" without a cover image
- **WHEN** the user views the entry list
- **THEN** the entry row displays the title and description preview
- **AND** a placeholder is shown where the thumbnail would appear

---

### Requirement: Entry Detail View

The system SHALL provide a detail view for entries allowing users to see all entry information including cover image.

#### Scenario: Open entry detail

- **WHEN** user clicks on an entry in the list
- **THEN** a detail dialog opens showing full entry information
- **AND** the dialog displays title, description, creation date, and last updated date
- **AND** if the entry has a cover image, it is displayed at the top of the dialog

#### Scenario: Close entry detail

- **WHEN** user clicks outside the dialog or presses Escape
- **THEN** the dialog closes
- **AND** the entry list scroll position is preserved

#### Scenario: View entry detail without cover image

- **WHEN** user opens an entry without a cover image
- **THEN** the detail dialog displays all entry information normally
- **AND** no cover image section is shown or a placeholder is displayed

---

### Requirement: Entry Editing

The system SHALL allow users to edit entry information from the detail view, including cover image management.

#### Scenario: Enter edit mode

- **WHEN** user clicks the Edit button in the detail dialog
- **THEN** the dialog switches to edit mode
- **AND** all editable fields become input controls
- **AND** cover image management controls are displayed (upload, URL input, remove)

#### Scenario: Save entry changes

- **WHEN** user modifies entry fields and clicks Save
- **THEN** the entry is updated in the database
- **AND** the entry list reflects the changes immediately
- **AND** the dialog shows the updated entry in view mode
- **AND** if cover image was changed, the new thumbnail is displayed in the list

#### Scenario: Cancel edit

- **WHEN** user clicks Cancel during edit mode
- **THEN** unsaved changes are discarded
- **AND** the dialog returns to view mode with original values
- **AND** any uploaded but not saved cover images are not persisted

#### Scenario: Validation error

- **WHEN** user submits invalid data (empty title)
- **THEN** the form displays validation errors
- **AND** the entry is not saved

---

### Requirement: Delete Entry

The system SHALL allow users to delete an entry from a vault, including its cover image.

#### Scenario: Delete single entry

- **GIVEN** entry "Inception" exists in vault "Movies"
- **WHEN** the user deletes the entry
- **THEN** the entry is removed from the database
- **AND** the entry disappears from the list
- **AND** the vault entry count is decremented
- **AND** if the entry had a cover image, the image file is deleted from the file system

#### Scenario: Delete entry with cover image

- **GIVEN** entry "Inception" has a cover image at path `<app_data>/images/1/42.jpg`
- **WHEN** the user deletes the entry
- **THEN** the entry is removed from the database
- **AND** the cover image file is deleted from the file system
- **AND** the entry disappears from the list
