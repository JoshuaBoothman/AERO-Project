# Fix Campsite Map Display Scaling

## User Review Required
> [!NOTE]
> This change will allow the campsite map image to display at its full natural resolution, adding scrollbars if it exceeds the viewport. This aligns the public experience with variables in the admin interface.

## Proposed Changes

### Client
#### [MODIFY] [CampingPage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/camping/CampingPage.jsx)
- Update the map container and image styles to match `AdminMapTool.jsx`.
- Change image style from `width: '100%'` to `maxWidth: 'none'`.
- Change image wrapper from `width: '100%'` to `display: 'inline-block'`.

## Verification Plan

### Manual Verification
1.  Open the public camping page: `http://localhost:5173/camping` (or specific event camping page).
2.  Select a campground.
3.  Verify that the map image is displayed at full size (not shrunk to fit).
4.  Verify that horizontal and vertical scrollbars appear if the image is larger than the container.
5.  Verify that pins are still correctly positioned (they use percentage-based positioning, so they should scale with the image).
