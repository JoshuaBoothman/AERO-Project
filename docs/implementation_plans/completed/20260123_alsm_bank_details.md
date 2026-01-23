# ALSM Bank Details in System Settings

## Goal Description
Add a section in "System Settings" -> "Organization" to store ALSM Bank Details (Account Name, BSB, Account Number, Bank Name). These details will be used for displaying on Invoices.

## Proposed Changes

### Database
#### [MODIFY] `20260123_add_bank_details.sql` (New Script)
- Add columns to `organization_settings` table:
    - `bank_name` (NVARCHAR(100))
    - `bank_account_name` (NVARCHAR(100))
    - `bank_bsb` (NVARCHAR(20))
    - `bank_account_number` (NVARCHAR(50))

### Backend [API]
#### [MODIFY] `getOrganization.js`
- Ensure new columns are returned.

#### [MODIFY] `updateOrganization.js` (or `manageOrganization.js`)
- validation and update logic for new columns.

### Frontend [Client]
#### [MODIFY] `OrgSettings.jsx`
- Add a new "Bank Details" fieldset/section.
- Add inputs for Bank Name, Account Name, BSB, Account Number.
- Bind to form state and update API call.

## Verification Plan

### Manual Verification
1.  **Admin Settings**:
    - Navigate to `/admin/settings`.
    - Enter Bank Details.
    - Save.
    - Refresh page -> Verify details persist.
2.  **Database Check**:
    - Query `organization_settings` to confirm values.
