# Implementation Plan: Image Gallery

This plan outlines the creation of an "Image Gallery" section within System Settings. This will allow admin users to upload images and videos to Azure Blob Storage and manage them (view as thumbnails, delete). These media items will eventually be displayed in a carousel on the Home Page.

## User Review Required

> [!IMPORTANT]
> **Database Changes**: You will need to run the provided SQL script in SSMS to create the `gallery_items` table before I can implement the backend logic.

> [!NOTE]
> **Azure Storage**: I will use the existing `/api/upload` function which points to the `uploads` container. If you prefer a separate container for the gallery, please let me know.

## Proposed SQL Script

Please run the following script in SSMS:

```sql
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'gallery_items')
BEGIN
    CREATE TABLE gallery_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        url NVARCHAR(MAX) NOT NULL,
        filename NVARCHAR(MAX) NOT NULL,
        media_type NVARCHAR(50) NOT NULL, -- 'image' or 'video'
        caption NVARCHAR(MAX) NULL,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        is_active BIT DEFAULT 1
    );
END
```

## Proposed Changes

### Database Layer
- [NEW] `gallery_items` table to store media metadata.

### Backend (Azure Functions)
#### [NEW] [getGalleryItems.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getGalleryItems.js)
- Fetches all items from `gallery_items` table where `is_active = 1`.
- Route: `GET /api/gallery`

#### [NEW] [createGalleryItem.js](file:///c:/laragon/www/AERO-Project/api/src/functions/createGalleryItem.js)
- Inserts a new record into `gallery_items`.
- Expects `url`, `filename`, and `media_type`.
- Route: `POST /api/gallery`

#### [NEW] [deleteGalleryItem.js](file:///c:/laragon/www/AERO-Project/api/src/functions/deleteGalleryItem.js)
- Deletes a record (or sets `is_active = 0`) from `gallery_items`.
- Route: `DELETE /api/gallery/:id`

---

### Frontend (Client)
#### [MODIFY] [AdminSettings.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/AdminSettings.jsx)
- Add "Image Gallery" tab to the settings navigation.
- Render `GalleryManager` component when the tab is active.

#### [NEW] [GalleryManager.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/settings/GalleryManager.jsx)
- **Interface**:
    - **Header**: "Image Gallery" with an "Upload Media" button.
    - **Upload Logic**: 
        1. User selects a file.
        2. UI shows a loading state.
        3. Calls `/api/upload` (Azure Storage).
        4. On success, calls `/api/gallery` (POST) to save metadata.
        5. Refreshes the gallery grid.
    - **Grid View**:
        - Displays square-cropped thumbnails of all images and videos.
        - Videos will have a visual "Play" icon overlay to distinguish them.
        - Each item has a delete button (X or trash can icon) that appears on hover.
    - **Deletion**: Prompts for confirmation before calling `DELETE /api/gallery/:id`.

---

### Home Page (Stage 2 - Draft)
#### [MODIFY] [Home.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Home.jsx)
- Replace the `{/* 3. ALSM's Premier Event Section */}` placeholder with a carousel component.
- Fetch media from `GET /api/gallery`.
- Implement a simple auto-scrolling carousel logic.

## Logic Overview

1. **Upload Flow**: 
   React (File Input) -> `POST /api/upload` (Azure Blob) -> Returns URL -> `POST /api/gallery` (SQL) -> Done.
2. **Display Flow**:
   React `useEffect` -> `GET /api/gallery` -> Maps over array to render thumbnails.
3. **MIME Logic**:
   Determine `media_type` ('image' or 'video') in the frontend based on the file's MIME type before saving to the database.

## Verification Plan

### Automated Tests
- N/A (Manual verification is more appropriate for UI and Azure integration).

### Manual Verification
1. **Database Set-up**: Confirm SQL script runs successfully.
2. **Admin Gallery**:
    - Navigate to System Settings -> Image Gallery.
    - Upload an image: Verify it appears in the grid.
    - Upload a video: Verify it appears with a "play" icon.
    - Delete an item: Verify it is removed from the grid.
3. **Database Check**: Query `gallery_items` table to ensure URLs and types are stored correctly.
4. **Home Page (Future)**: Verify images appear in the carousel area (placeholder replacement).
