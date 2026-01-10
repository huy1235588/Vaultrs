# virtual-scrolling Specification

## Purpose

High-performance virtual scrolling implementation using TanStack Virtual. Enables smooth 60 FPS scrolling through large datasets (10,000+ entries) by only rendering visible items.

## Requirements
### Requirement: Windowed Rendering

The system SHALL render only visible entries plus a small overscan buffer, regardless of total entry count.

#### Scenario: Render limited DOM nodes

- **GIVEN** vault "Movies" contains 100,000 entries
- **WHEN** the entry list is displayed
- **THEN** only entries visible in the viewport are rendered to DOM
- **AND** a small buffer of entries above and below viewport are rendered for smooth scrolling
- **AND** total DOM nodes for entries does not exceed 50 regardless of dataset size

#### Scenario: Dynamic height estimation

- **GIVEN** entries have varying content lengths
- **WHEN** the list is scrolled
- **THEN** the scroll position accurately reflects the virtual position in the full dataset
- **AND** the scrollbar size represents the full list height

---

### Requirement: 60 FPS Scroll Performance

The system SHALL maintain 60 FPS frame rate during scrolling operations on datasets up to 10 million entries.

#### Scenario: Smooth scrolling with large dataset

- **GIVEN** vault "Movies" contains 10,000 entries loaded in memory
- **WHEN** the user scrolls through the list continuously
- **THEN** the frame rate remains at or above 60 FPS
- **AND** no visible lag or jank occurs

#### Scenario: Fast scroll (scroll bar drag)

- **GIVEN** vault "Movies" contains 10,000 entries
- **WHEN** the user drags the scrollbar from top to bottom quickly
- **THEN** the list updates smoothly
- **AND** entries are rendered correctly at the target position

---

### Requirement: Scroll Position Preservation

The system SHALL preserve scroll position during data updates and UI interactions.

#### Scenario: Preserve position on entry creation

- **GIVEN** the user is scrolled to position 5000 in the entry list
- **WHEN** a new entry is created
- **THEN** the scroll position remains at approximately the same visual location
- **AND** the new entry appears at the top of the list

#### Scenario: Preserve position on window resize

- **GIVEN** the user is scrolled to position 5000 in the entry list
- **WHEN** the application window is resized
- **THEN** the scroll position is preserved
- **AND** the visible entries remain consistent

---

### Requirement: Loading States

The system SHALL display appropriate loading states during data fetching operations.

#### Scenario: Initial load skeleton

- **GIVEN** the user selects a vault with many entries
- **WHEN** entries are being fetched from database
- **THEN** skeleton placeholder rows are displayed
- **AND** the skeleton count matches expected visible rows

#### Scenario: Load more indicator

- **GIVEN** the user scrolls to the bottom of loaded entries
- **AND** more entries exist in the database
- **WHEN** additional entries are being fetched
- **THEN** a loading indicator is displayed at the bottom of the list
- **AND** the indicator disappears when new entries are loaded

