# Mobile Store Tab Navigation — UX Fix

## Problem

On mobile devices, the Event Store page (`StorePage.jsx`) renders its category tabs (Event Tickets, Merchandise, Hire Assets, Program / Subevents, Camping) as a horizontal row. When the screen is too narrow to display all tabs, the overflow is handled by `overflow-x-auto`, which allows horizontal scrolling. However:

1.  **No visual cue** — There is no affordance (e.g., fade, arrow, shadow) to indicate that more tabs exist off-screen to the right.
2.  **`scrollbar-hide` class has no CSS definition** — The class is applied but never defined, so the native scrollbar may or may not appear depending on the browser, providing inconsistent UX.
3.  **Users don't discover tabs** — The "Hire Assets", "Program / Subevents", and "Camping" tabs are invisible on most phones, leading to confusion about what the store offers.

---

## Design Options Considered

| # | Approach | Pros | Cons |
|---|----------|------|------|
| **A** | Fade-out gradient + scroll shadow | Universally understood visual hint; lightweight CSS-only | Obscures part of a tab label |
| **B** | Left/Right arrow buttons | Very explicit; accessible | Adds JS complexity; takes horizontal space |
| **C** | "More" overflow dropdown | Keeps UI compact | Hides content behind a click; breaks tab mental model |
| **D** | Wrap tabs onto multiple rows | All tabs visible at once | Can look cluttered with 5 tabs; breaks horizontal rhythm |
| **E** | **Combination: Fade gradient + proper scrollbar-hide + scroll snap** | Clean, modern, intuitive; minimal code | Slight reliance on CSS scroll-snap support (excellent browser support) |

### Recommended: **Option E — Fade Gradient + Scroll Snap**

This is the approach used by most modern mobile web apps (e.g., Google, Shopify, Airbnb). It is CSS-only, requires no new state or JavaScript logic, and provides a polished, "premium" feel.

---

## Proposed New Interface (Detailed Description)

### Desktop (≥768px `md:` breakpoint)
No change. Tabs continue to render in a single row with enough space for all items.

### Mobile (<768px)

The tab bar will behave as follows:

1.  **Scrollable Row (unchanged)**: Tabs remain in a horizontal row with `overflow-x-auto`.
2.  **Hidden Scrollbar**: A proper `scrollbar-hide` CSS utility will be defined to hide the native scrollbar on all browsers (webkit + Firefox + IE/Edge).
3.  **Right Fade Gradient**: When there are tabs clipped on the right, a subtle gradient will fade from transparent to the page background colour on the trailing edge. This acts as a visual signal that content continues.
    - The gradient is applied via a `::after` pseudo-element on a **wrapper div**, so it overlays the tab container.
    - The gradient is only visible on mobile (`md:hidden`).
4.  **Scroll Snap**: Each tab will snap into a clean position when the user flicks left/right, using `scroll-snap-type: x mandatory` on the container and `scroll-snap-align: start` on each tab. This gives the scrolling a "carousel" feel rather than a freeform slide.

> **Visual Result**: The user sees the first 2–3 tabs clearly, with the rightmost visible tab gently fading out. This universally communicates "swipe for more". Once they scroll to the end, the full set of tabs is visible.

---

## Proposed Changes

### File Changes

No database changes are required.

#### [MODIFY] [StorePage.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/StorePage.jsx)

**Lines 308–339** — The `{/* Tabs */}` section.

Changes:
1.  **Wrap** the existing tab `<div>` in a new `<div>` with `relative` positioning (needed for the fade pseudo-element).
2.  **Add Tailwind classes** for scroll snap to the tab container: `snap-x snap-mandatory`.
3.  **Add `snap-start`** to each tab button.
4.  **Remove** the undefined `scrollbar-hide` class (we'll define it in CSS instead, applied to the same element via a utility class).
5.  **Add** the `scrollbar-hide` class back — but this time it will have a real CSS definition (see below).

#### [MODIFY] [index.css](file:///c:/laragon/www/AERO-Project/client/src/index.css)

Add a small utility block:

```css
/* Utility: Hide scrollbar across browsers */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE/Edge */
  scrollbar-width: none;     /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;             /* Chrome, Safari, Opera */
}

/* Mobile tab fade-out indicator */
.tab-scroll-fade {
  position: relative;
}
.tab-scroll-fade::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 3rem;
  background: linear-gradient(to right, transparent, white);
  pointer-events: none;
}
@media (min-width: 768px) {
  .tab-scroll-fade::after {
    display: none;
  }
}
```

---

## Logic Summary

| Change | What it does |
|--------|-------------|
| `scrollbar-hide` CSS utility | Actually hides the scrollbar (currently the class is used but never defined) |
| `tab-scroll-fade` wrapper with `::after` | Renders a white-to-transparent gradient on the right edge of the tab bar on mobile, signaling more content |
| `snap-x snap-mandatory` on container | Makes the tab bar "snap" to tab boundaries when scrolling |
| `snap-start` on each button | Each tab acts as a snap point |
| `md:` breakpoint guard | The fade gradient is hidden on desktop where all tabs fit |

---

## SQL Script

No database changes are required for this fix.

---

## Verification Plan

### Manual Verification (Browser DevTools)
1. Run the dev server (`npm run dev` in `client/`).
2. Open the Event Store page in Chrome.
3. Open DevTools → Toggle Device Toolbar → Select a mobile viewport (e.g., iPhone 14, 390px wide).
4. **Verify**: The tab bar shows 2–3 tabs with a subtle white fade on the right edge.
5. **Verify**: Swiping/scrolling the tab bar reveals the remaining tabs and they snap into position.
6. **Verify**: No native scrollbar is visible.
7. Switch to a desktop viewport (≥768px).
8. **Verify**: All tabs are visible, no fade gradient is present.
