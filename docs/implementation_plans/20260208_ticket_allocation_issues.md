# Implementation Plan - Ticket Allocation & Bingo Mix-up Fix

## Problem Description
The user is experiencing issues where tickets in the cart are being assigned to the wrong players in the backend, specifically described as "randomly assigns them to wrong players". This often resolves to the Main User's profile being overwritten with a guest's details (e.g., "Dog" overwriting "Owner").

Additionally, when purchasing multiple similar tickets (e.g., Day Passes for different dates), the interface for selecting a ticket for a subevent (like Bingo) is ambiguous, leading to potential "mix-ups" where a subevent is linked to the wrong day's ticket.

## Diagnosis
After analyzing `Checkout.jsx`, `createOrder.js`, `AttendeeModal.jsx`, and `SubeventModal.jsx`, three key issues have been identified:

## Step 0: Hypothesis Verification
**Before applying any changes, we must verify that the "Mystery Guest" issue is indeed caused by accidental profile merging.** We will run SQL queries to identify if multiple attendees (with different intended identities) are linked to a single `person_id`.

**Action:** Run the following SQL script to detect anomalies where a single user profile describes multiple conflicting identities (e.g., "Josh" and "Bingo").

```sql
-- Hypthosis Verification Script
-- 1. Check for users who have "changed names" recently (Implicit check via multiple attendees)
-- Look for a Person who has Attendees with drastically different inferred names.
-- Since we don't store historical names, we check if one Person ID is linked to attendees that SHOULD be different people.

SELECT 
    p.person_id,
    p.first_name + ' ' + p.last_name as Current_Person_Name,
    p.email,
    COUNT(a.attendee_id) as Ticket_Count,
    -- Check if this person has tickets where they act as different roles that implies different people?
    -- Hard to tell purely from DB unless we see weird patterns.
    STUFF((
        SELECT ', ' + tt.name 
        FROM attendees a2
        JOIN event_ticket_types tt ON a2.ticket_type_id = tt.ticket_type_id
        WHERE a2.person_id = p.person_id
        FOR XML PATH('')
    ), 1, 2, '') as Tickets_Held
FROM persons p
JOIN attendees a ON p.person_id = a.person_id
GROUP BY p.person_id, p.first_name, p.last_name, p.email
HAVING COUNT(a.attendee_id) > 1

-- 2. Check for the specific "Bingo" case if known (or similar patterns)
-- If the user "Josh" became "Bingo", his email remains "josh@example.com" but name is "Bingo".
-- We can check if the name "Bingo" is associated with an email that looks like a human's name (Josh).
-- (Subjective, but we can list them).

SELECT * FROM persons 
WHERE (first_name = 'Bingo' OR last_name = 'Bingo') -- Replace with known mismatched names if any
```

If we find records where a single Person ID holds both a "Pilot" ticket and a "Junior Pilot" ticket (for example), and the Person's name is "Bingo", it strongly confirms the overwrite.

1.  **Implicit Profile Merging (The "Dog" Issue)**:
    -   **Cause**: `AttendeeModal.jsx` defaults the email field for *new* attendees to the Current User's email.
    -   **Effect**: If a user enters a guest's name (e.g., "Bingo") but leaves the email as their own, `createOrder.js` identifies the attendee by email, matches it to the Main User, and **updates the Main User's Person record** with the new name. Both the Main User and the new Attendee are then linked to this single (renamed) Person record.
    -   **Result**: The user suddenly "becomes" the guest (Bingo) in the system, and all tickets appear to belong to that one person.

2.  **Subevent Selection Ambiguity**:
    -   **Cause**: `SubeventModal.jsx` lists new tickets from the cart using only `FirstName LastName (TicketName)`.
    -   **Effect**: If a user buys multiple identical tickets (e.g., "Junior Pilot Day Pass" for Monday and Tuesday), they appear as identical entries in the dropdown. Selecting the "wrong" one (e.g., Monday's ticket for a Wednesday Subevent) is easy and leads to logical mix-ups, even if the backend links IDs correctly.

3.  **Cart Iteration Bug in Subevent Modal**:
    -   **Cause**: `SubeventModal.jsx` iterates through cart items but strictly selects `ticket.attendees[0]`, ignoring any subsequent attendees if a cart item were to contain multiple (quantity > 1).
    -   **Effect**: While `StorePage` currently adds items individually (Qty 1), this logic is brittle. If any workflow adds grouped tickets, the 2nd+ driver cannot be selected for subevents.

## Proposed Changes

### 1. Frontend: Prevent Accidental Profile Merging (`AttendeeModal.jsx`)
We will minimize the risk of users accidentally merging a guest profile into their own by ensuring email uniqueness or intentionality.

*   **Remove Default Email**: Initialize the `email` field to an empty string `""` instead of `user.email`.
*   **Optional Email for Guests**: Update validation logic to **allow empty emails**. If an email is empty, the backend will create a "Managed Person" (linked to the user but with no email login), which preserves the guest's separate identity.
*   **"Use My Email" Action**: Add a button/checkbox "This ticket is for me" that populates the fields with the user's data, ensuring intentional linking.

### 2. Frontend: Enhanced Selection Logic (`SubeventModal.jsx`)
We will make the Subevent allocation dropdown precise and robust.

*   **Fix Iteration Logic**: Refactor the dropdown generation to iterate through **all** attendees in a cart item (`ticket.attendees.forEach`), not just index 0.
*   **Show Dates**: Update the dropdown label to include arrival/departure dates if available.
    *   *Current*: `Bingo Garle (Junior Pilot Day Pass)`
    *   *New*: `Bingo Garle (Junior Pilot Day Pass: 12/07 - 12/07)`
*   **Show TempID Debug (Optional)**: Can add a hash or ID snippet if ambiguity persists, but Dates should suffice.

### 3. Backend: Merge Safeguard (`createOrder.js`)
We will add a "Safety Lock" to the backend to prevent profile overwrites even if the frontend validation is bypassed.

*   **Name Mismatch Check**: In the logic that matches an incoming email to an existing Person:
    *   Check if the Existing Person's `first_name` / `last_name` matches the incoming Name (fuzzy match or exact).
    *   **Logic**:
        *   If Email Matches + Name Matches (approx): Update details (safe).
        *   If Email Matches + Name SIGNIFICANTLY Differs (e.g., "Josh" vs "Bingo"): **Throw Error**.
        *   *Error Message*: "The email [x] belongs to [Name], but you entered [NewName]. Please use a different email for this guest or leave it blank."

## Detailed Implementation Steps

### Step 1: Update `AttendeeModal.jsx`
*   Modify `useEffect` initialization to set `email: ''`.
*   Add a "Is this you?" button/checkbox near the top.
    *   `onClick`: Fills Name, Email, Phone, Address from `user`.
*   Update `handleSubmit` validation:
    *   Remove `emailRegex` check if email is empty.
    *   Allow submission with empty email (creates Managed Person).

### Step 2: Update `SubeventModal.jsx`
*   Refactor the Cart loop:
    ```javascript
    cart.filter(item => item.type === 'TICKET').forEach(ticket => {
        if (ticket.attendees) {
            ticket.attendees.forEach((att, idx) => {
                 // Create option using att.tempId
                 // Append Date Range to label
            });
        }
    });
    ```

### Step 3: Update `createOrder.js`
*   Locate the "Main User Person ID" logic (Lines 152-178).
*   Insert a Name Guard check before performing the `UPDATE persons` query.
*   If safeguard fails, return `400 Bad Request` with specific instruction.

## Implementation Trace: Ticket Batch IDs
To clarify how the system links these items:
1.  **Cart Creation**: When a ticket is added to cart, `StorePage` assigns it a unique `tempId` (e.g., `TEMP-[Timestamp]-[Random]`). This ID exists only in the Frontend Cart.
2.  **Subevent Linking**: When you select a person in `SubeventModal`, it stores that `tempId` in the Subevent Cart Item as `attendeeTempId`.
3.  **Checkout Payload**: The Frontend sends both the Ticket (with its `tempId` in the `attendees` array) and the Subevent (referencing that `attendeeTempId`).
4.  **Backend Resolution (`createOrder.js`)**:
    *   The backend processes Tickets first. It creates the permanent `Attendee` record in the database.
    *   It stores a mapping in memory: `tempIdMap[Ticket_TempId] = New_Attendee_DB_ID`.
    *   It then processes Subevents. It looks up `tempIdMap[Subevent_Reference_TempId]` to find the correct `New_Attendee_DB_ID`.
    *   This link is robust *provided that* the `tempId` is unique and the user selected the intended ticket in the modal. The proposed interface changes (Dates) ensure the user can distinguish which "Batch ID" (Ticket) they are selecting.

## SQL Script
No database schema changes are required for this fix. The logic changes are purely code-based (validation and safety checks).

To inspect potential existing "Overwritten" users, you could run this (informational only):
```sql
-- Check for Persons who have attendees with names different from the Person's current name
-- This might identify profiles that were overwritten "Bingo-style"
SELECT 
    p.person_id,
    p.first_name as P_First,
    p.last_name as P_Last,
    a.pilot_name as A_Pilot_Name_If_Crewing
FROM persons p
JOIN attendees a ON p.person_id = a.person_id
-- Note: There is no historical name record, so we can't definitively "undo" overwrites via SQL.
-- The fix prevents future occurrences.
```
