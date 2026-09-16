# Keyset (Cursor-based) Pagination for Item Browsing at Scale

Vaultrs is designed to support smooth virtual scrolling across Collections containing up to 10M+ items. We decided to implement keyset (cursor-based) pagination using index-backed predicates (`WHERE id < after_id` and compound sort keys) rather than offset-based pagination (`LIMIT ... OFFSET ...`). Offset queries degrade to O(N) at deep pages because the database must scan and discard thousands or millions of prior rows, whereas keyset pagination guarantees O(1) indexed seeks regardless of collection depth.

## Consequences

- Direct navigation to an arbitrary page number (e.g., "jump to page 4,200") is not supported; navigation is strictly sequential or infinite-scroll driven.
- Sorting by non-unique fields requires a deterministic tie-breaker (compound cursor: `sort_field_value` + `item_id`).
- Keyset pagination aligns directly with TanStack Virtual in the UI for constant-memory infinite scrolling.
