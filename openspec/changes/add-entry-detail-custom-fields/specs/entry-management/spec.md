## MODIFIED Requirements

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

### Requirement: Entry Deletion
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
