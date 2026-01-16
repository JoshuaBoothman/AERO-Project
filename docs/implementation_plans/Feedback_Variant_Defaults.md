# Variant Templates Implementation

## User Review Required
> [!IMPORTANT]
> **User Action Required:** Run the following SQL commands on **BOTH** Dev and Live databases.

```sql
-- 1. Create Variant Templates table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'variant_templates')
BEGIN
    CREATE TABLE variant_templates (
        template_id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL, -- e.g., "Mens T-Shirt Sizes"
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
END

-- 2. Create Variant Template Options table
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'variant_template_options')
BEGIN
    CREATE TABLE variant_template_options (
        option_id INT IDENTITY(1,1) PRIMARY KEY,
        template_id INT NOT NULL,
        category_name NVARCHAR(100) NOT NULL, -- e.g., "Size", "Color"
        option_name NVARCHAR(100) NOT NULL, -- e.g., "Small", "Red"
        price_adjustment DECIMAL(10, 2) DEFAULT 0,
        CONSTRAINT FK_TemplateOptions_Templates FOREIGN KEY (template_id) REFERENCES variant_templates(template_id) ON DELETE CASCADE
    );
END
```

## Proposed Changes

### Frontend
#### [MODIFY] [ProductForm.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/ProductForm.jsx)
*   **"Apply Template" Button**:
    *   Added near the "Variants" section.
    *   Opens a modal to select a generic template (e.g., "Standard Shirts").
*   **Template Logic**:
    *   Fetching a template retrieves its options.
    *   Populates the `variants` state of the form with these options.

#### [NEW] [VariantTemplates.jsx](file:///c:/laragon/www/AERO-Project/client/src/pages/admin/VariantTemplates.jsx)
*   **List View**: Manage existing templates.
*   **Create/Edit**: Define specific templates (e.g., "Mens Sizes", "Womens Sizes").
    *   Inputs: Template Name.
    *   Inputs: List of Options (Category: "Size", Value: "S").

### API
#### [NEW] [variantTemplates.js](file:///c:/laragon/www/AERO-Project/api/src/functions/variantTemplates.js)
*   **GET /admin/variant-templates**: List all templates.
*   **POST /admin/variant-templates**: Create a new template with options.
*   **GET /admin/variant-templates/{id}**: Get details.
*   **DELETE /admin/variant-templates/{id}**: Delete a template.

## Verification Plan
1.  **DB**: Run SQL scripts.
2.  **Admin Flow**:
    *   Create Template "Standard Shirt Basics" (Sizes S-XL).
    *   Create New Product "2026 Event Tee".
    *   Click "Apply Template" -> Select "Standard Shirt Basics".
    *   Verify Size variants are auto-filled.
    *   Save Product.
    *   Verify `product_variants` are created correctly. 
