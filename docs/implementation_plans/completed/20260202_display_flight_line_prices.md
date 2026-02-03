# Flight Line Duties Interface Update

This plan outlines the changes required to improve the visibility and clarity of the Flight Line Duties selection during ticket purchase.

## Goal Description
The goal is to make the "Flight Line Duties" agreement more prominent and transparent by:
1.  Moving the section above the "Pilot & Aircraft Registration" block.
2.  Replacing the single checkbox with two distinct "Agree" vs. "Don't Agree" options.
3.  Clearly displaying the price associated with each option using the existing color scheme (Green for standard/agreed, Amber for surcharge/disagreed).

## User Review Required
> [!NOTE]
> This change mainly affects the UI presentation. The underlying logic for price calculation and data submission (`flightLineDuties` boolean) remains unchanged.

## Proposed Changes

### Client Interface

#### [MODIFY] [AttendeeModal.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/AttendeeModal.jsx)
-   **Move Logic:** Extract the Flight Line Duties rendering logic (currently inside the Pilot & Aircraft Registration block) and place it immediately *before* the "Pilot & Aircraft Registration" section.
-   **Section Heading:** Wrap the extracted logic in a new container with the heading "**Flight Line Duties**".
-   **UI Refactor:**
    -   Replace the single checkbox `<input type="checkbox">` with a radio button group or selectable cards.
    -   **Option 1: "I agree"**
        -   Sets `flightLineDuties = true`.
        -   Displays `Price: $X.XX` (Standard Price) in **Green**.
    -   **Option 2: "I don't agree"**
        -   Sets `flightLineDuties = false`.
        -   Displays `Price: $Y.YY` (No Duties Surcharge Price) in **Amber**.
-   **Logic Preservation:**
    -   Retain the specific visibility check for Day Passes (only show if duration >= 3 days).
    -   Retain the "Day Pass tickets have fixed per-day pricing" note for day passes where the price might not change.

**Detailed Interface Mockup (Pseudo-code):**

```jsx
// New "Flight Line Duties" Section (placed before Pilot & Aircraft Registration)
{ticket.system_role === 'pilot' && showFlightLine && (
    <div className="mb-6 p-4 bg-white border border-gray-200 rounded shadow-sm">
        <h5 className="font-bold mb-3 text-lg border-b pb-2">Flight Line Duties</h5>
        
        <p className="text-sm text-gray-600 mb-4">
            Please select your preference regarding flight line duties.
        </p>

        <div className="space-y-3">
            {/* Option 1: Agree */}
            <label className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${data.flightLineDuties ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'border-gray-300 hover:border-green-300'}`}>
                <div className="flex items-center gap-3">
                    <input 
                        type="radio" 
                        name={`fld_${key}`} 
                        checked={data.flightLineDuties === true} 
                        onChange={() => handleChange(key, 'flightLineDuties', true)}
                        className="w-5 h-5 text-green-600"
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800">I agree to perform flight line duties</span>
                        <span className="text-xs text-gray-500">I will simulate 2 hours of duty during the event.</span>
                    </div>
                </div>
                <div className="text-right">
                     <span className="block font-bold text-green-600 text-lg">
                        ${Number(ticket.price).toFixed(2)}
                     </span>
                     <span className="text-xs text-gray-400">Standard Price</span>
                </div>
            </label>

            {/* Option 2: Disagree */}
            {/* Only show price difference if not a day pass (or if day pass implies no surcharge, handle accordingly) */}
            <label className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${!data.flightLineDuties ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' : 'border-gray-300 hover:border-amber-300'}`}>
                <div className="flex items-center gap-3">
                    <input 
                        type="radio" 
                        name={`fld_${key}`} 
                        checked={data.flightLineDuties === false} 
                        onChange={() => handleChange(key, 'flightLineDuties', false)}
                        className="w-5 h-5 text-amber-600"
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800">I DO NOT agree</span>
                        <span className="text-xs text-gray-500">I prefer not to perform duties.</span>
                    </div>
                </div>
                <div className="text-right">
                     <span className="block font-bold text-amber-600 text-lg">
                        ${Number(ticket.price_no_flight_line || ticket.price).toFixed(2)}
                     </span>
                     {ticket.price_no_flight_line && (
                        <span className="text-xs text-gray-400">Includes Surcharge</span>
                     )}
                </div>
            </label>
        </div>
        
        {ticket.is_day_pass && (
            <div className="mt-2 text-xs text-gray-500 italic">
                * Day Pass tickets have fixed per-day pricing.
            </div>
        )}
    </div>
)}
```

## SQL Script
No database changes are required for this update. The data structure submitted to the backend (`flightLineDuties` boolean) remains consistent.

## Verification Plan

### Manual Verification
1.  **Open the Application** and go to the Ticket Page.
2.  **Add a Pilot Ticket** to the cart.
3.  **Proceed to Checkout** to open the Attendee Modal.
4.  **Verify Position**: Confirm "Flight Line Duties" appears *above* "Pilot & Aircraft Registration".
5.  **Verify UI**: 
    -   Check that two large options ("Agree" and "Do Not Agree") are displayed.
    -   Verify the prices match the ticket configuration (Green for standard, Amber for surcharge).
6.  **Verify Interaction**:
    -   Click "I agree" -> Check green styling active.
    -   Click "I leave" -> Check amber styling active.
    -   Ensure validation still passes.
7.  **Edge Case - Day Pass**:
    -   Add a Day Pass.
    -   Select dates < 3 days -> Verify section is HIDDEN.
    -   Select dates >= 3 days -> Verify section is VISIBLE.
