# Hybrid EAV-JSON Model for Collection Schema

Vaultrs enables users to define custom schemas per Collection with arbitrary user-defined fields without requiring database migrations. We decided on a hybrid storage model: a relational `attributes` table stores field definitions (key, type, options, order), while dynamic item values are stored as a structured JSON object in the `properties` TEXT column on the `items` table. This provides instant schema evolution with zero DDL migrations, avoids the multi-join overhead of traditional EAV at 10M rows, and allows fast single-row item retrieval.

## Considered Options

- **Pure EAV (Normalized `attribute_values` table)**: Storing one row per property value requires dozens of joins to assemble a single item and degrades severely when querying large collections.
- **Dynamic DDL (`ALTER TABLE ADD COLUMN`)**: Creating actual SQLite columns per attribute causes schema locking issues, complex rollback logic, and limits flexibility across dynamic collections.
- **Hybrid Relational Schema + JSON Properties**: Chosen for zero-migration schema updates, O(1) single-row item hydration, and the ability to index specific properties via SQLite generated columns or JSON functions when needed.
