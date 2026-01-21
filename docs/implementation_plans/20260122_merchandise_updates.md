# Merchandise Updates (Cost Price & Renaming)

## Goal Description
Implement "Cost Price" tracking for merchandise SKUs, add a "Bulk Apply" feature for pricing, and rename the "Size" variant category to "Mens Size".

## User Review Required
> [!IMPORTANT]
> **Schema Change**: Adding `cost_price` (decimal) to `product_skus`.

## Proposed Changes

### Backend (API)
#### [MODIFY] [getProductDetails.js](file:///c:/laragon/www/AERO-Project/api/src/functions/getProductDetails.js)
- Return `cost_price` in the SKU list.

#### [MODIFY] [updateProduct.js](file:///c:/laragon/www/AERO-Project/api/src/functions/updateProduct.js)
- Handle `cost_price` update.

#### [NEW] [manageVariantCategory.js](file:///c:/laragon/www/AERO-Project/api/src/functions/manageVariantCategory.js)
- Implement `PUT /api/variant-categories/{id}` to allow renaming (e.g., "Size" -> "Mens Size").
- Ensure it checks if the new name already exists to avoid duplicates (merge logic? or just error).

### Frontend (Client)
#### [MODIFY] [ProductEditor.jsx](file:///c:/laragon/www/AERO-Project/client/src/components/admin/ProductEditor.jsx)
- **SKU Table**: Add "Cost Price" column (Editable).
- **Bulk Actions**: Add ability to "Autofill" **Cost** and **Sell** price.
    - Add "Apply to All" buttons next to the first SKU's Cost and Sell price inputs.
    - Clicking "Apply to All" copies that value to all other SKUs in the list.
- **Variant Rename**: Allow editing the "Category Name" (e.g., clicking the header "Size" to rename it to "Mens Size").
    - Use the new `manageVariantCategory` API.

## Verification Plan
### Manual Verification
1.  **Renaming**: Verify "Size" is now "Mens Size" in the dropdowns.
2.  **Cost Price**: Enter a cost price for a shirt. Save. Refresh. Verify persistence.
3.  **Autofill**: specific test: Enter $25.00 in one SKU. Click "Apply to all". Verify all SKUs update. Save.
