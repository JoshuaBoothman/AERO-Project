# FAQ Section Implementation Plan

## User Review Required
> [!IMPORTANT]
> **Database Schema Update**: A new table `faqs` is required. Please run the provided script `docs/updates/add_faq_table.sql` on your database before proceeding with the application logic.

## Proposed Changes

### Database
#### [NEW] [add_faq_table.sql](file:///c:/laragon/www/AERO-Project/docs/updates/add_faq_table.sql)
- Creates `faqs` table with columns: `id`, `event_id`, `question`, `answer`, `image_url`, `display_order`, `is_active`, `created_at`, `updated_at`.

### API (Backend - Azure Functions)
#### [NEW] [faqs.js](file:///c:/laragon/www/AERO-Project/api/src/functions/faqs.js)
- **GET /api/public/faqs**: Retrieve active FAQs (public access).
- **GET /api/manage/faqs**: Retrieve all FAQs (admin access).
- **POST /api/manage/faqs**: Create a new FAQ.
- **PUT /api/manage/faqs/{id}**: Update an existing FAQ.
- **DELETE /api/manage/faqs/{id}**: Delete a FAQ.

### Client (Frontend - React)
#### [NEW] [FAQ.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/FAQ.jsx)
- Public page to display the list of FAQs.
- Supports expanding/collapsing questions (accordion style) or simple list.
- Displays attached images if present.

#### [NEW] [FAQManager.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/settings/FAQManager.jsx)
- Admin component to manage FAQs.
- List view with Edit/Delete actions.
- Form to add/edit Question, Answer, and upload Image.
- Drag-and-drop or simple up/down sorting for `display_order`.

#### [MODIFY] [AdminSettings.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AdminSettings.jsx)
- Add "FAQ" tab to the System Settings page.
- Render `FAQManager` when the tab is active.

#### [MODIFY] [Layout.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/Layout.jsx)
- Update the "Information" dropdown in the navbar to link "FAQ" to `/faq`.

#### [MODIFY] [App.jsx](file:///c:/laragon/www/AERO-Project/client/src/App.jsx)
- Add route: `<Route path="faq" element={<FAQ />} />`.

## Verification Plan

### Automated Tests
- None planned for this feature iteration.

### Manual Verification
1.  **Database**: Verify table creation using SSMS or Azure Data Studio.
2.  **Admin UI**:
    - Go to Admin -> Settings -> FAQ.
    - Create a new FAQ with text and an image.
    - Edit the FAQ.
    - Delete the FAQ.
    - Verify data persistence in DB.
3.  **Public UI**:
    - Go to `/faq` (via Nav -> Information -> FAQ).
    - detailed list matches what was created in Admin.
    - Verify image loads correctly.
    - Verify formatting (newlines in answer).
