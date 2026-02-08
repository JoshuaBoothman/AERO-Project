# Fixed Date of Birth Placeholder Implementation Plan

**Goal**: Ensure the "Date of Birth" field is clearly labeled on mobile devices during ticket purchase, where native date pickers often hide placeholder text.

## Proposed Changes

### 1. Update Attendee Modal Component (`client/src/components/AttendeeModal.jsx`)

**Current State**:
The date input relies on `placeholder="Date of Birth"`.
- **Desktop**: Chrome/Firefox display `dd/mm/yyyy` (mask) or placeholder text depending on browser implementation.
- **Mobile (iOS/Android)**: Native date pickers often show a blank field or "Date" until a value is selected, completely ignoring the `placeholder` attribute. This leaves the user guessing what the field is for.

**Proposed Fix (The "Boring Solution")**:
Instead of using complex `type="text"` switching hacks (which can be buggy on mobile keyboards), we will add an explicit `<label>` above the field. This aligns with the "Arrival Date" and "Departure Date" fields which already use labels effectively in the same modal.

**Implementation Details**:
1.  Locate the DOB input in the render method (around line 311).
2.  Wrap the input in a `<div>` to manage layout within the grid cell.
3.  Add a `<label>` element above the input:
    ```jsx
    <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
            Date of Birth
        </label>
        <input
            type="date"
            // placeholder="Date of Birth" (Optional: Keep for legacy browsers, but label is primary)
            value={data.dateOfBirth || ''}
            onChange={e => handleChange(key, 'dateOfBirth', e.target.value)}
            style={inputStyle}
        />
    </div>
    ```

**Layout Considerations**:
- The grid is currently `grid-cols-1 md:grid-cols-2`.
- Adding a label to just one field in the row might cause vertical misalignment if others don't have labels.
- **Mitigation**: We will ensure the label style is compact (`text-xs`) to minimize impact. Since DOB is the last item in its row (First, Last, DOB), it won't push down a neighbor in the same row on desktop (as it wraps to a new line effectively or sits alone). We will verify the grid behavior.

## Database Changes

**Status**: No database changes required.
The field `dateOfBirth` is already handled by the backend structure.

**SQL Script**:
N/A

## Verification Plan

1.  **Mobile View**:
    - Open Chrome DevTools > Toggle Device Toolbar (Mobile View).
    - Verify "Date of Birth" label appearing above the input.
    - Verify input functions correctly.
2.  **Desktop View**:
    - Verify the layout remains clean and the new label doesn't break the grid alignment excessively.
