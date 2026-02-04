-- Add auto_detected and source_merchant_pattern columns to budget_items
ALTER TABLE budget_items 
ADD COLUMN IF NOT EXISTS auto_detected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source_merchant_pattern TEXT;