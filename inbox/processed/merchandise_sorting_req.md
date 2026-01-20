# Merchandise Item Ordering

**Source**: Dave's Call (2026-01-20)

**Requirement**:
- Dave wants a way to control the display order of merchandise items in the public-facing store.
- **Goal**: Ensure products appear in a "predefined order" rather than random or alphabetical.
- **Preferred Interface**: Drag and drop reordering.
- **Fallback Interface**: Manual numbering system (e.g., "Sort Order" field).

**Context**:
- Currently, items likely sort by ID or Name.
- Needs a new column in `products` (e.g., `sort_order` INT).
- Needs Admin UI update to handle the sorting.
