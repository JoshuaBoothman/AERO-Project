# Homepage Banner Height Adjustment

To improve the user experience and immediate visibility of the "About ALSM" section, the hero banner at the top of the homepage will be reduced in height by approximately 50%. This involves adjusting the vertical padding, font sizes, and spacing of the hero content using Tailwind CSS classes.

## User Review Required

> [!NOTE]
> This change is purely visual and does not affect the functionality of the home page. The event details are currently hardcoded in `Home.jsx`, so no database changes or API updates are required.

## Proposed Changes

### [Component] Homepage

#### [MODIFY] [Home.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/Home.jsx)

The following Tailwind utility classes will be adjusted to condense the hero section:

- **Section Padding**:
  - `py-24` → `py-12` (Mobile padding reduced from 6rem to 3rem)
  - `md:py-32` → `md:py-16` (Desktop padding reduced from 8rem to 4rem)
- **Heading (h1)**:
  - `text-4xl` → `text-3xl`
  - `md:text-6xl` → `md:text-4xl`
  - `mb-6` → `mb-4` (Reducing bottom margin)
- **Subtext (p)**:
  - `text-xl` → `text-lg`
  - `md:text-3xl` → `md:text-xl`
  - `mb-8` → `mb-6` (Reducing bottom margin)
- **Call to Action Buttons**:
  - `px-8 py-3` → `px-6 py-2` (Condensing button size)
  - `text-lg` → `text-base`

## Logic & Interface Description

The goal is to move the "About ALSM" section higher into the viewport. Currently, on most standard monitors, the hero banner takes up the majority of the initial view (above the fold). 

By halving the vertical padding and reducing the typography scale:
1.  The content remains legible but takes up significantly less vertical space.
2.  The `container` wrapping the text will naturally shrink.
3.  The "About ALSM" section (Section 2) will start approximately 200px-300px higher on the page, ensuring its heading and first few lines are visible immediately upon landing.

## Database Changes

No database changes are required. The homepage content is currently managed within the React component logic.

---

## Verification Plan

### Manual Verification
- **Visual Check (Desktop)**:
  1. Open the homepage in a browser.
  2. Verify that the "About ALSM" header is visible below the banner without scrolling.
  3. Ensure buttons and text are well-proportioned in the new smaller banner.
- **Visual Check (Mobile)**:
  1. Use browser dev tools to inspect the homepage on a mobile-sized viewport (e.g., iPhone 12 Pro).
  2. Verify the banner is not excessively tall and that content fits comfortably.
- **Link Verification**:
  1. Click "View Events" and "Register Now" buttons to ensure they still function correctly.
