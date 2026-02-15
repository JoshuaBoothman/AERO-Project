# Refactor Audit: OrderDetail & MyPlanes

**Date:** 2026-02-15
**Files Analyzed:**
- `client/src/pages/OrderDetail.jsx` (~650 lines)
- `client/src/pages/MyPlanes.jsx` (~544 lines)

---

## 1. `OrderDetail.jsx` Analysis

### Current State
This file acts as a "God Component" for the order view. It handles fetching data, displaying the order summary, managing edits for attendees, handling refunds, and formatting complex item details (campsites, merchandise, events) all in one render cycle.

**Complexity Drivers:**
1.  **Mixed Concerns:** It handles **Viewing** (read-only data), **Editing** (forms and updates), and **Admin Actions** (refunds/restorations).
2.  **Inline Styles:** The file is heavily polluted with React `style={{ ... }}` objects, making the JSX verbose and hard to maintain.
3.  **State Leaks:** The parent component manages the edit state (`editingAttendeeId`, `editFormData`) for *every* child item. This causes the entire page to re-render when typing in a single input field.

### Identified Features (The "Big 3")
These three distinct features are currently entangled:

1.  **Order Presentation (Read-Only):**
    *   Displaying order totals, status, invoices, and payment history.
    *   Rendering the "Order Summary" table with conditional logic for 5+ item types (Ticket, Merchandise, Campsite, Asset, Subevent).
    *   *Recommendation:* Extract to `OrderSummary.jsx` and `PaymentHistory.jsx`.

2.  **Ticket & Role Management (Interactive):**
    *   The "Ticket Management" section.
    *   Allows users to assign names/emails.
    *   Displays role-specific metadata (Pilot license, Heavy Model Inspector status).
    *   *Recommendation:* Extract to `TicketManager.jsx` (container) and `AttendeeCard.jsx` (individual item).

3.  **Admin/Financial Actions:**
    *   Refund logic (`handleRefundAction`) and associated UI toggles.
    *   Status badges and "Undo Refund" controls.
    *   *Recommendation:* Encapsulate in `RefundControls.jsx` or specialized hooks.

### Inline Styles Audit
The file uses inline styles extensively (e.g., `style={{ padding: '2rem' }}`, `style={{ marginBottom: '2rem' }}`).
**Action Plan:**
- Convert standard spacing to Tailwind: `p-8`, `mb-8`.
- Convert colors to Tailwind: `text-gray-600`, `bg-blue-50`.
- Convert flexbox styles: `flex`, `justify-between`, `items-center`.
- **Goal:** Remove 95% of `style` props.

### Refactoring Plan (Target: < 200 Lines)

1.  **Create `AttendeeCard.jsx`**:
    *   Move the logic for one single ticket item here.
    *   **State Move:** Move `editing`, `editFormData`, `saving` state *inside* this component. This isolates re-renders to just the card being edited.
    *   **Props:** `item`, `onUpdate` (callback to refresh parent data).

2.  **Create `OrderSummaryTable.jsx`**:
    *   Extract the large table that renders all item types.
    *   Create small helpers or sub-components for the cell variations (e.g., `MerchDetails`, `CampsiteDetails`).

3.  **Create `PaymentHistory.jsx`**:
    *   Extract the transactions table.

4.  **Tailwind Conversion**:
    *   As components are extracted, rewrite their JSX to use Tailwind classes instead of inline styles.

---

## 2. `MyPlanes.jsx` Analysis

### Current State
This file is cleaner visually (uses Tailwind) but suffers from "State Bloat". It acts as both a data fetcher and a UI wizard manager.

### State Management Analysis
The component manages:
- **Data State:** `planes`, `loading`.
- **UI State:** `isModalOpen`, `modalStep`, `editingPlane`.
- **Wizard Data:** `pilotEvents`, `selectedEventSlug`, `eligiblePilots`, `selectedPersonId`.
- **Form State:** `formData`.

This is too much activity for the view layer.

### Custom Hook Suggestion: `usePilotManagement`
We can extract the business logic into a custom hook.

**Proposed `usePlaneManagement.js`:**
```javascript
export function usePlaneManagement(token) {
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);

    // CRUD
    const fetchPlanes = async () => { ... }
    const savePlane = async (planeData, isEdit) => { ... }
    const deletePlane = async (id) => { ... }
    
    // Certificate Upload
    const uploadCertificate = async (file) => { ... }

    return { 
        planes, loading, fetchPlanes, savePlane, deletePlane, uploadCertificate 
    };
}
```

**Proposed `usePilotEligibility.js`:**
*   Handles the logic for "Can I add a plane?":
    *   Fetching `pilot-events`.
    *   Fetching `attendees` for a selected event.

### Refactoring Plan
1.  Extract **`PlaneFormModal.jsx`**:
    *   Move the entire Modal (including the 3-step wizard logic) into a separate component.
    *   The parent `MyPlanes` just passes `isOpen`, `onClose`, and `onSave` props.
2.  Implement **`usePlaneManagement`**:
    *   Cleanup the API calls in the main component.

---

## Summary of Recommendations

| File | Primary Issue | Top Priority Fix | Est. Effort |
| :--- | :--- | :--- | :--- |
| `OrderDetail.jsx` | Inline Styles & God Component | Extract `AttendeeCard` & `OrderSummaryTable` | High |
| `MyPlanes.jsx` | Complex State (Wizard) | Extract `PlaneFormModal` & create Hooks | Medium |

### Next Steps
1.  User to approve this plan.
2.  Developer to begin with `OrderDetail.jsx` extraction (as it's the largest technical debt).
3.  Simultaneous conversion to Tailwind during extraction.
