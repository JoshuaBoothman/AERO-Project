# Admin Camping Enhancements

## User Review Required
> [!NOTE]
> No database schema changes required.

## Proposed Changes

### API
#### [MODIFY] [updateCampground.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateCampground.js)
*   Accept `map_image_url` in the request body.
*   Update SQL query to set `map_image_url = @mapUrl` if provided.

#### [MODIFY] [createCampsites.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createCampsites.js)
*   Update logic to accept an optional `specific_names` array (string[]).
*   If `specific_names` is present:
    *   Iterate through names and insert exactly (ignore `count` and `prefix` logic).
*   Else:
    *   Use existing `count`/`prefix` logic.

### Frontend
#### [MODIFY] [AdminMapTool.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/AdminMapTool.jsx)
*   **Bulk Add Section**:
    *   Remove "Suffix" input (or rename to Prefix and default to empty?). User said "Suffix is not needed". I will remove the default value "Site " and maybe hide the field if they assume it's gone, OR just clear the default.
    *   *Decision*: Keep the field but label it "Prefix (Optional)" and default to empty string.
*   **Add Single Site Section** (New):
    *   Add a small form next to Bulk Add: "Add Single Site".
    *   Inputs: "Site Number" (Text, e.g. "5A"), "Price".
    *   Button: "Add Check".
    *   Calls `createCampsites` with `specific_names: ["5A"]`.
*   **Edit Campground Modal** (Was Rename):
    *   Rename `handleRenameCampground` to `handleEditCampground`.
    *   Add File Input for Map Image.
    *   If file selected: Upload -> Get URL -> Include in PUT request.

## Verification Plan
1.  **Map Update**:
    *   Select Campground. Click Edit (Pencil).
    *   Upload new Map Image. Save.
    *   Verify Map updates and existing sites remain in place (coordinates might drift if aspect ratio changes, but data is safe).
2.  **Single Site**:
    *   Enter "5A" in new Single Site input. Add.
    *   Verify site "5A" appears.
3.  **Bulk Add**:
    *   Enter Qty: 2, Prefix: "". Add.
    *   Verify sites "10", "11" (assuming starts after 9) appear (numeric).
