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

## Step 1: The "No Email" Strategy (Simplified)

**The Problem:**
Currently, when you add a guest (e.g., a child), the system automatically fills in *your* email address.
The backend sees "Same Email" -> "Same Person".
So, instead of creating a new "Bingo" profile, it renames *you* to "Bingo".

**The Cause:**
1.  **Frontend**: Forces you to have an email (even for kids).
2.  **Frontend**: Pre-fills *your* email by default.
3.  **Backend**: Trusts that "Same Email" means "Same User" and overwrites your name.

**The Solution:**
We will allow guests to have **No Email**.
1.  **Database Check**: We confirmed the database *does* allow people to have no email (NULL).
2.  **Frontend Change**: We will stop pre-filling your email for new guests.
3.  **Frontend Change**: We will remove the "Email is required" error for guests.

**Result:**
*   **You**: Have an email.
*   **Guest (Bingo)**: Has NO email.
*   **Backend**: Sees they are different. Creates a new profile for Bingo linked to you. **No overwrite.**

## Step 2: Implementation Details

### 1. Frontend (`AttendeeModal.jsx`)
*   **Stop Defaulting Email**: Change `email: user?.email || ''` to `email: ''`.
*   **Remove Validation**: Update `handleSubmit` to only require Email *if* it is the Main User (or self-registration). For added guests, Email is optional.

### 2. Frontend (`SubeventModal.jsx`) - The "Mix-up" Fix
*   **Fix the Loop**: Currently, it only looks at the first person in a ticket bundle. We will change it to loop through `ticket.attendees` so *everyone* appears in the dropdown.

### 3. Backend (`createOrder.js`) - Safety Net
*   **Mismatch Start**: If an email *is* provided and matches the User, but the Names are totally different (e.g. "Josh" vs "Bingo"), we will **block the order** with an error: *"You cannot use your own email for another person. Please leave email blank for guests."*
*   **Handle Empty Emails**: Ensure the database insert handles `''` (empty string) as `NULL` to keep the database clean.

## Step 3: Verification
1.  **Run SQL Check**: Ensure `persons` table has no constraints blocking NULL emails (Completed: Confirmed).
2.  **Test Purchase**: Buy a ticket for a "Child" with NO email.
3.  **Verify**: Check DB to see 2 separate Person IDs (You + Child).
## Step 4: Manual Data Repair Guide (For existing corrupted records)

**Objective**: Fix users who have already been overwritten (e.g., "Josh" became "Bingo").

**Procedure**:
1.  **Identify the User**:
    *   Find the `person_id` associated with the user's email (`SELECT * FROM persons WHERE email = 'josh@example.com'`).
    *   Observe that the `first_name` / `last_name` are incorrect (e.g., "Bingo").

2.  **Create a New Identity for the Guest**:
    *   Insert a **new** row into `persons` for the Guest (Bingo).
    *   **Important**: Leave `email` as `NULL`. Set `user_id` to the Main User's ID (so Josh manages Bingo).

3.  **Re-link the Guest's Ticket**:
    *   Find the `attendee` record for the Guest's ticket (e.g., "Junior Pilot").
    *   Update its `person_id` to the **NEW** Person ID created in Step 2.

4.  **Restore the Main User**:
    *   Update the **ORIGINAL** `person` record (Josh's ID).
    *   Change `first_name`, `last_name`, and `date_of_birth` back to Josh's correct details.

**Outcome**:
*   Josh is Josh again (Person A).
*   Bingo is his own person (Person B).
*   The "Pilot" ticket points to Person A.
*   The "Junior Pilot" ticket points to Person B.
*   Josh manages both via his User Account.
