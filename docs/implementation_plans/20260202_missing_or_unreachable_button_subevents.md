# Subevent Modal 'Add to Cart' Button Visibility Fix

## Goal Description
Users on certain devices (likely mobile or small screens) are unable to access the "Add to Cart" button in the Subevents modal. This is due to a layout issue where the modal content does not correctly adapt to limited vertical space, causing the footer (containing the button) to be pushed out of the viewable area or clipped.

## User Review Required
> [!IMPORTANT]
> No database changes are required for this fix. The provided solution is purely a frontend CSS/Layout update.

## Proposed Changes

### Client
#### [MODIFY] [SubeventModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/SubeventModal.jsx)
- **Update Modal Container Height**: Switch from `max-h-[90vh]` to `max-h-[90dvh]` to better handle mobile browser address bars.
- **Enforce Flex Layout**: Add `flex-1` to the scrollable content area (`div` with `overflow-y-auto`). This ensures it takes up *only* the available space between the header and footer, rather than pushing the footer out.
- **Min-Height Adjustment**: Change `min-h-[300px]` to `min-h-0` (or a much smaller responsive value) to prevent the content from forcing the modal to be taller than the viewport on extremely small screens, while maintaining a reasonable default for larger screens using `h-auto` or keeping `min-h` but allowing shrink. *Refined Decision*: We will use `min-h-0` combined with `flex-1` on the content wrapper to ensure flex behavior works correctly, and possibly apply a `min-h` on the *modal container* itself if a minimum size is desired, rather than the content.

**Detailed Interface Description**:
The visual design will remain identical to the user, but the behavior will change:
1.  **Header**: Stays at the top.
2.  **Footer**: Stays pinned to the bottom.
3.  **Content**: Occupies the middle. If the screen is short, this area shrinks, and the internal scrollbar becomes active. The footer will **never** be pushed off-screen.

### Proposed SQL Script
N/A - No database changes required.

## Verification Plan

### Automated Tests
- N/A (Visual/Layout changes are best tested manually or with visual regression tools which are not currently set up).

### Manual Verification
1.  **Mobile Simulation**:
    - Open the application in a desktop browser (Chrome/Edge).
    - Open DevTools (F12) and toggle Device Toolbar.
    - Select a "landscape" phone view (e.g., iPhone SE or Pixel rotated) or manually resize the viewport height to be small (e.g., 400px - 500px).
    - Open a Subevent modal.
    - **Verify**: The "Add to Cart" button is fully visible at the bottom.
    - **Verify**: The content area (middle) scrolls if the list of forms/options is long.
    - **Verify**: The Header is visible at the top.
2.  **Regular Usage**:
    - Open on a standard desktop view.
    - **Verify**: The modal still looks substantial and hasn't collapsed into a tiny box (due to `min-h` adjustments). It should still look good with empty or minimal content.
