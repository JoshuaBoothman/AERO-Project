-- Add quantity column to order_items, defaulting to 1 for existing records
-- Task: Merchandise Quantity Selection (20260202_order_items_qty)

IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'order_items' AND COLUMN_NAME = 'quantity'
)
BEGIN
    ALTER TABLE order_items
    ADD quantity INT NOT NULL DEFAULT 1;
    PRINT 'Column [quantity] added to [order_items]';
END
ELSE
BEGIN
    PRINT 'Column [quantity] already exists on [order_items]';
END
