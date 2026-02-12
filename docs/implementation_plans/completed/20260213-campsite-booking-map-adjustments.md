# Campsite Booking Map Adjustments

Adjust the campsite pins on the user-side booking page to be smaller and include labels displaying the campsite number, matching the style used in the Admin Map section.

## User Review Required

> [!NOTE]
> The pins will be reduced from `20px` to `16px`. Labels will be added above each pin. 
> To prevent labels from being cut off at the top/sides of the map, I will add a `25px` padding buffer to the scrollable map container. This ensures even pins at the very edge have room for their labels.

## Proposed Changes

### Camping Module

#### [MODIFY] [CampingPage.jsx](file:///c:/laragon\www\AERO-Project\client\src\pages\camping\CampingPage.jsx)

- Update pin styling to reduce size.
- Add label `<span>` inside the pin container to show `site_number`.
- Add `padding: '25px 0'` to the scrollable map container to prevent label clipping.

```diff
- <div style={{ position: 'relative', border: '1px solid #ddd', background: '#ccc', overflow: 'auto', maxHeight: '75vh', borderRadius: '8px' }}>
+ <div style={{ position: 'relative', border: '1px solid #ddd', background: '#ccc', overflow: 'auto', maxHeight: '75vh', borderRadius: '8px', padding: '25px 0' }}>
```

#### [MODIFY] [AdminMapTool.jsx](file:///c:/laragon\www\AERO-Project\client\src\pages\camping\AdminMapTool.jsx)

- Add `padding: '25px 0'` to the scrollable map container for consistency and to fix potential clipping in admin view.

```diff
- <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'auto' }}
+ <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'auto', padding: '25px 0' }}
```

## Database Changes

**No SQL changes required.** All requested adjustments are frontend styling changes.

## Verification Plan

### Automated Tests
- Run `npm run lint` in `client/` to ensure no linting errors are introduced.

### Manual Verification
1. Navigate to the campsite booking page as a user.
2. Select an event with a map view.
3. Verify that:
   - Pins are smaller than before.
   - Each pin has a dark label above it displaying the correct site number.
   - Hover and selection behavior still works correctly (pins turn blue when selected, gold/pink when available/partial).
   - Tooltips still display on hover.
