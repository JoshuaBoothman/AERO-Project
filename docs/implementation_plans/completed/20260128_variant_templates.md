# Enable Editing of Variant Templates

## Goal
Allow administrators to edit existing merchandise variant templates (e.g., "Mens Sizes", "Colors") in the System Settings. This includes renaming the template and adding/removing/modifying its options.

## User Review Required
> [!NOTE]
> No database schema changes are required for this feature. The existing tables `variant_templates` and `variant_template_options` fully support the requirements.

## Proposed Changes

### Logic Explanation
The "Variant Template" feature acts as a cookie-cutter. When a template is applied to a product, its options are copied over. Therefore, editing a template **does not** affect products that have already used that template. It only affects future applications of the template.
Because of this independence, the "Update" logic on the backend will use a "Replace" strategy for options:
1.  Update the Template Name.
2.  Delete *all* existing options for this template from `variant_template_options`.
3.  Insert the new list of options provided in the request.
This ensures the database state exactly matches the user's latest save, handling additions, removals, and reordering (if applicable) cleanly.

### Interface Changes
**Page:** `System Settings` -> `Merchandise Templates` (`VariantTemplates.jsx`)

1.  **Edit Button**: A new "Edit" button (Pencil icon) will be added to the Actions column in the template list, next to the "Delete" button.
2.  **Modal Behavior**:
    - Clicking "Edit" unlocks the existing "Create Template" modal but pre-fills it with the selected template's data (Name and Options).
    - The "Save Template" button will update to "Update Template" when in edit mode.
    - The modal title will change to "Edit Variant Template".
3.  **Data Loading**:
    - Since the list view only contains counts, clicking "Edit" will trigger a fetch (`GET /api/manage/variant-templates/:id`) to ensure the latest options are loaded before editing.

### Frontend
#### [MODIFY] [VariantTemplates.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/VariantTemplates.jsx)
- Add `Edit` icon import (from `lucide-react`).
- Add state for `editingId` (null | number).
- Create `handleEdit(template)` function:
    - Sets `loading` state.
    - Fetches full details via API.
    - Sets `newTemplate` state with fetched data.
    - Sets `editingId` to the template ID.
    - Opens modal.
- Modify `handleCreateTemplate`:
    - Check if `editingId` is set.
    - If yes, make `PUT` request to `/api/manage/variant-templates/${editingId}`.
    - If no, make `POST` request (existing logic).
    - On success, refresh list and close modal.
- Update `handleDelete` to also clear partial state if needed.

### Backend
#### [MODIFY] [variantTemplates.js](file:///c:/laragon/www/AERO-Project/api/src/functions/variantTemplates.js)
- Add new `PUT` endpoint route: `manage/variant-templates/{templateId}`.
- Implement handler:
    - Verify Admin Auth.
    - Input Validation (Name required, Options array).
    - **Transaction** (implicit or explicit depending on driver capabilities, but here likely sequential awaits are fine as strictly defined operations):
        - `UPDATE variant_templates SET name = @name WHERE template_id = @id`
        - `DELETE FROM variant_template_options WHERE template_id = @id`
        - Loop through options and `INSERT INTO variant_template_options ...`
    - Return success message.

## Database Changes
No schema changes are required. The existing structure works:
- `variant_templates` (holds the name)
- `variant_template_options` (holds the options linked by `template_id`)

## Verification Plan

### Automated Tests
- None currently exist for this feature. Verification will be manual.

### Manual Verification
1.  **Create Template**: Create a new template "Test Template" with options "Small", "Medium".
2.  **Verify Creation**: Ensure it appears in the list with Option Count = 2.
3.  **Edit Template**:
    - Click "Edit".
    - Verify modal opens with "Test Template" and options "Small", "Medium" listed.
    - Change Name to "Test Template Edited".
    - Add option "Large".
    - Remove option "Small".
    - Click "Update Template".
4.  **Verify Update**:
    - Ensure modal closes.
    - List should show "Test Template Edited" with Option Count = 2 ("Medium", "Large").
    - Click "Edit" again to confirm the options are exactly "Medium" and "Large".
5.  **Apply Template**: Go to a Product, click "Use Template", select "Test Template Edited", and verify it adds "Medium" and "Large" to the product.
