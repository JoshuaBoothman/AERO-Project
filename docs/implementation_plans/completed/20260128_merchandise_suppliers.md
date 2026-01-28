# Merchandise Suppliers Feature

## Goal
Enable the tracking of suppliers for merchandise items. This includes a new management interface for suppliers and the ability to link products to specific suppliers.

## User Review Required
> [!IMPORTANT]
> **Database Changes Required**: A T-SQL script is provided below. You MUST run this in SSMS before I can proceed with the code implementation.

> [!NOTE]
> I will add a "Suppliers" button to the Merchandise List page which will navigate to a new Supplier management page.

## Proposed Changes

### Database Schema
**Script to run in SSMS:**
```sql
-- 1. Create Suppliers Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'merchandise_suppliers')
BEGIN
    CREATE TABLE merchandise_suppliers (
        supplier_id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        contact_name NVARCHAR(255),
        phone NVARCHAR(50),
        email NVARCHAR(255),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- 2. Add supplier_id to products if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'supplier_id')
BEGIN
    ALTER TABLE products
    ADD supplier_id INT NULL;

    ALTER TABLE products
    ADD CONSTRAINT FK_Products_Suppliers FOREIGN KEY (supplier_id) REFERENCES merchandise_suppliers(supplier_id);
END
GO
```

### API Layer (`api/src/functions/`)
#### [NEW] `suppliers.js`
*   `GET /suppliers`: List all active suppliers.
*   `POST /suppliers`: Create a new supplier.
*   `PUT /suppliers/{id}`: Update supplier details.

#### [MODIFY] `products.js` (and related functions)
*   Update `getProducts` / `getProductDetails` to include `supplier_id` and supplier name.
*   Update `createProduct` / `updateProduct` to accept and save `supplier_id`.

### Frontend Layer (`client/src/pages/admin/`)

#### [NEW] `SupplierList.jsx`
*   A new page to list, add, and edit suppliers.
*   Columns: Name, Phone, Email, Actions (Edit).
*   Modal for Add/Edit Supplier.

#### [MODIFY] `MerchandiseList.jsx`
*   Add a "Suppliers" button in the header area (next to "New Product").
*   Links to `/admin/suppliers`.

#### [MODIFY] `ProductEditor.jsx`
*   **Info Tab**:
    *   Add a dropdown for "Supplier".
    *   Fetch list of suppliers on component mount.
    *   Add a small "+" button next to the dropdown to open a "Quick Add Supplier" modal (reusing the logic from `SupplierList` or a simplified version).

#### [MODIFY] `client/src/App.jsx`
*   Add route for `/admin/suppliers`.

## Verification Plan

### Manual Verification
1.  **Database**: Run the SQL script and confirm `merchandise_suppliers` table exists and `products` has `supplier_id`.
2.  **Suppliers Page**:
    *   Navigate to Merchandise List. Click "Suppliers".
    *   Create a new supplier "Acme Corp".
    *   Verify it appears in the list.
    *   Edit it to "Acme Corp Inc". Save.
3.  **Product Linking**:
    *   Go to a Product Edit page.
    *   Select "Acme Corp Inc" from the new Supplier dropdown.
    *   Save.
    *   Refresh page to ensure persistence.
4.  **Quick Add**:
    *   In Product Edit, click "+" next to supplier.
    *   Add "Beta Supply".
    *   Verify it is immediately selected in the dropdown.
