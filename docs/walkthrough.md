# Walkthrough: Subevent Variations

This update enables subevents (like "Steak Night") to have configurable options (Variations) that users must select before adding to cart.

## 1. Setup Data (Admin UI)
You can now manage variations directly from the Admin Dashboard.

1.  Navigate to **Admin > Subevents**.
2.  Select the Event (e.g. `Festival of Aeromodelling 2026`).
3.  Locate "Steak Night" in the list.
4.  Click the new **Variations** button (Purple text).
5.  **Create "Cook Time"**:
    *   Name: `Cook Time`
    *   Required: `Checked`
    *   Click **Create**.
6.  **Add Options**:
    *   Add `Rare` (Price: 0)
    *   Add `Medium` (Price: 0)
    *   Add `Well Done` (Price: 0)
7.  **Create "Sauce"**:
    *   Name: `Add Sauce`
    *   Required: `Unchecked` (Optional)
    *   Click **Create**.
8.  **Add Options**:
    *   Add `Mushroom Sauce` (Price: 2.50)
    *   Add `Pepper Sauce` (Price: 2.50)

## 2. User Flow Verification

### Step 1: Browse Store
1.  Navigate to the Store Page (e.g. `/events/festival-2026`).
2.  Click the **Program / Subevents** tab.
3.  Locate "Steak Night".

### Step 2: Open Selection Modal
1.  Click **Register**.
2.  **Verify**: A modal appears titled "Steak Night".
3.  **Verify**: "Cook Time" (Rare, Medium, Well Done) options are distinct.
4.  **Verify**: "Add Sauce" shows price adjustments (+$2.50).
5.  **Verify**: The "Add to Cart" button is **Disabled** initially (since "Cook Time" is required).

### Step 3: Select Options
1.  Select "Medium" (Cook Time).
2.  Select "Mushroom Sauce (+$2.50)".
3.  **Verify**: Total Price updates to include the $2.50 sauce.
4.  Click **Add to Cart**.

### Step 4: Cart & Checkout
1.  Navigate to **Checkout**.
2.  **Verify**: The "Steak Night" item lists your choices:
    *   `Cook Time: Medium`
    *   `Add Sauce: Mushroom Sauce`
3.  **Verify**: The price matches the modal total.
4.  Click **Secure Pay Now** (Mock Payment).

### Step 5: Database Verification
1.  Check `subevent_registrations` for the new record.
2.  Check `subevent_registration_choices` to see the linked choices.
