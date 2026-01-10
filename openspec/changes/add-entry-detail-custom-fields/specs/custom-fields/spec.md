## ADDED Requirements

### Requirement: Field Definition Management
The system SHALL allow users to define custom fields for each vault.

#### Scenario: Create field definition
- **WHEN** user adds a new field definition to a vault
- **THEN** the field is created with the specified name, type, and options
- **AND** the field appears in the vault's field list
- **AND** the field is available for all entries in that vault

#### Scenario: Field name uniqueness
- **WHEN** user tries to create a field with a name that already exists in the vault
- **THEN** the system rejects the creation
- **AND** shows an error message about duplicate field name

#### Scenario: Update field definition
- **WHEN** user updates a field definition's properties
- **THEN** the field definition is updated
- **AND** existing entry values remain unchanged

#### Scenario: Delete field definition
- **WHEN** user deletes a field definition
- **THEN** the field is removed from the vault
- **AND** existing entry metadata with that field key remains in database (orphaned but harmless)

#### Scenario: Reorder field definitions
- **WHEN** user changes the order of field definitions
- **THEN** the new order is saved
- **AND** fields display in the new order in entry detail views

### Requirement: Supported Field Types
The system SHALL support the following field types for custom fields.

#### Scenario: Text field type
- **WHEN** a field is defined as type "text"
- **THEN** it accepts free-form text input
- **AND** validates maximum length if specified in options

#### Scenario: Number field type
- **WHEN** a field is defined as type "number"
- **THEN** it accepts numeric input (integer or decimal)
- **AND** validates min/max range if specified in options

#### Scenario: Date field type
- **WHEN** a field is defined as type "date"
- **THEN** it displays a date picker
- **AND** stores the value in ISO 8601 format

#### Scenario: URL field type
- **WHEN** a field is defined as type "url"
- **THEN** it validates the value is a valid URL format
- **AND** displays as a clickable link in view mode

#### Scenario: Boolean field type
- **WHEN** a field is defined as type "boolean"
- **THEN** it displays as a toggle or checkbox
- **AND** stores true/false value

#### Scenario: Select field type
- **WHEN** a field is defined as type "select" with choices option
- **THEN** it displays as a dropdown with the defined choices
- **AND** only allows selection from the predefined options

### Requirement: Field Options Configuration
The system SHALL allow type-specific options for field definitions.

#### Scenario: Text field max length option
- **WHEN** a text field has maxLength option set to 500
- **THEN** values longer than 500 characters are rejected with validation error

#### Scenario: Number field range options
- **WHEN** a number field has min=0 and max=100 options
- **THEN** values outside the range are rejected with validation error

#### Scenario: Select field choices option
- **WHEN** a select field has choices=["A", "B", "C"]
- **THEN** only these values are accepted
- **AND** other values are rejected with validation error

### Requirement: Field Definition API
The system SHALL provide API endpoints for field definition management.

#### Scenario: List field definitions
- **WHEN** frontend requests field definitions for a vault
- **THEN** the API returns all field definitions ordered by position
- **AND** includes field id, name, type, options, required flag

#### Scenario: Create field definition via API
- **WHEN** frontend sends create request with valid parameters
- **THEN** the field is created and returned
- **AND** position is set to the next available position

#### Scenario: Bulk reorder via API
- **WHEN** frontend sends reorder request with array of field IDs
- **THEN** fields are reordered according to the array order
- **AND** position values are updated accordingly
