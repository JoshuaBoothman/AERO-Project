# Bug Fix: Merchandise Deletion

## Goal Description
Fix the reported issue where deleting a merchandise item (e.g., "sweatshirts") fails.

## Investigation Required
- **Error Logs**: Check Azure Function logs for `deleteProduct` or `deleteSKU` errors.
- **Constraints**: Likely a Foreign Key constraint violation (e.g., product is in `order_items` or `carts`).
- **Logic**: Verify if the deletion logic correctly cascades or checks for dependencies.

## Proposed Changes


### Backend [API]
#### [MODIFY] `deleteProduct.js`
- **Standardization**: Replace all `body: JSON.stringify(...)` usages with `jsonBody: { ... }` to ensure consistent `Content-Type: application/json` headers.
- **Error Handling**: Verify `catch` block returns a proper JSON error response.

### Frontend [Client]
#### [MODIFY] `ProductEditor.jsx`
- **Error Handling**:
    - Wrap `const data = await res.json()` in a try/catch block.
    - Check if `res.headers.get('content-length') > 0` or similar before parsing, if possible (though `res.json()` fails if empty).
    - If parsing fails, fall back to reading `res.text()` and displaying a generic error or the raw text (if safe).

## Verification Plan

### Automated Tests
- None planned for this quick fix.

### Manual Verification
1.  **Reproduction (Pre-Fix)**:
    - Attempt to delete a product that might cause an error (or mock 500/404).
2.  **Fix Verification**:
    - Apply backend changes.
    - Apply frontend changes.
    - Attempt to delete a product again.
    - **Success case**: Product deleted.
    - **Error case**: Proper error notification is displayed (e.g. "Unauthorized" or "Internal Server Error"), not "Unexpected end of JSON input".
