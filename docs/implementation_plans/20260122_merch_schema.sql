/*
    Schema Update Script for Merchandise Updates
    Reference: docs/implementation_plans/20260122_merchandise_updates.md
    Date: 2026-01-22
*/

-- 1. Add cost_price to product_skus
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'product_skus' AND COLUMN_NAME = 'cost_price')
BEGIN
    PRINT 'Adding cost_price column to product_skus table...';
    ALTER TABLE product_skus 
    ADD cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
END
ELSE
BEGIN
    PRINT 'Column cost_price already exists in product_skus.';
END
GO
