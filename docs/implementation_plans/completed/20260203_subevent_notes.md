# Implementation Plan - Subevent Notes

## Goal
Add functionality for users to provide a note (e.g., dietary requirements, seating preference) when purchasing subevent tickets. The label for this note field (e.g., "Dietary Requirements") should be configurable by the admin per subevent.

## User Review Required
> [!IMPORTANT]
> **Database Changes Required**
> Please execute the following SQL script in your database before we proceed with the code changes.
> This script adds the necessary columns to store the note title configuration and the user's notes.

### Proposed SQL Script
```sql
-- 1. Add 'note_title' to 'subevents' table to allow admins to define the input label
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[subevents]') AND name = 'note_title')
BEGIN
    ALTER TABLE [dbo].[subevents] ADD [note_title] NVARCHAR(255) NULL;
END
GO

-- 2. Add 'attendee_note' to 'subevent_registrations' table to store the user's input
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[subevent_registrations]') AND name = 'attendee_note')
BEGIN
    ALTER TABLE [dbo].[subevent_registrations] ADD [attendee_note] NVARCHAR(MAX) NULL;
END
GO
```

## Proposed Changes

### Database
- **`subevents`**: Add `note_title` column.
- **`subevent_registrations`**: Add `attendee_note` column.

### API (Backend)
- **`functions/createSubevent.js`**:
    - Update `INSERT` statement to include `note_title`.
    - Validate `note_title` (optional).
- **`functions/updateSubevent.js`**:
    - Update `UPDATE` statement to include `note_title`.
- **`functions/createOrder.js`**:
    - When processing `subevents` in the payload, extract the `note` field from the request item.
    - Insert this value into the `attendee_note` column of `subevent_registrations`.
- **`functions/getOrderDetail.js`**:
    - Update the subquery for subevents to select `attendee_note` so it can be displayed in the Order Detail view.
    - Add it to the returned object logic.

### Frontend (Client)
- **`components/admin/SubeventForm.jsx`**:
    - Add a text input field for "Note Title (e.g., Dietary Requirements)" below the Description or Cost fields.
    - Pass this value to the `onSubmit` handler.
- **`components/SubeventModal.jsx`**:
    - Check if `subevent.note_title` is present.
    - If present, render a Text Area (or Input) with the label set to `subevent.note_title`.
    - Capture this input in the `selections` state or a new state variable.
    - Pass the note value to `onAddToCart`.
- **`pages/StorePage.jsx` (or `CartContext`)**:
    - Ensure the `note` property is preserved when adding the item to the global cart state.
- **`pages/OrderDetail.jsx`**:
    - Update the rendering of subevent items to display the "Note" (e.g., "Dietary Requirements: Gluten Free") if it exists.

## Verification Plan

### Automated Tests
- None available for this specific UI/DB flow.

### Manual Verification
1.  **Database Setup**:
    - Run the provided SQL script in SSMS.
2.  **Admin Configuration**:
    - Log in as Admin.
    - Go to **Manage Events** > **Subevents**.
    - Edit an existing subevent (e.g., "Gala Dinner").
    - Enter "Dietary Requirements" into the new "Note Title" field.
    - Save and verify it persists (refresh page).
3.  **User Purchase**:
    - Log in as a User.
    - Go to the **Store**.
    - Click "Add to Cart" on the "Gala Dinner" subevent.
    - Verify a text box appears with the label "Dietary Requirements".
    - Select an attendee and enter "Vegetarian" in the note field.
    - Add to Cart.
    - Complete the checkout process (pay or simulate payment).
4.  **Order Review**:
    - Go to **My Orders**.
    - Open the new order.
    - Verify that the line item for the subevent displays: "Dietary Requirements: Vegetarian" (or similar format).
