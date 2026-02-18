
-- Part A: Add "Transfers" subcategory under Discretionary
INSERT INTO categories (name, parent_id, color, description)
SELECT 
  'Transfers',
  id,
  '#64748B',
  'Bank transfers, virtual card loads, inter-account movements'
FROM categories 
WHERE name = 'Discretionary' AND parent_id IS NULL
LIMIT 1
ON CONFLICT DO NOTHING;

-- Part B: Bulk re-categorize stuck Miscellaneous transactions that match transfer patterns
UPDATE transactions
SET 
  category_id = (SELECT id FROM categories WHERE name = 'Transfers' LIMIT 1),
  subcategory_id = NULL,
  auto_categorized = true,
  categorization_confidence = 1.0,
  is_categorized = true
WHERE 
  category_id = (SELECT id FROM categories WHERE name = 'Miscellaneous' LIMIT 1)
  AND (
    description ILIKE '%VALUE LOADED TO VIRTUAL CARD%'
    OR description ILIKE '%IB TRANSFER TO%'
    OR description ILIKE '%IB PAYMENT TO%'
    OR description ILIKE '%INSTANT MONEY%'
    OR description ILIKE '%INSTANTMON%'
    OR description ILIKE '%CASH WITHDRAWAL%'
    OR description ILIKE '%CASH SEND%'
    OR description ILIKE '%INTERBANK TRANSFER%'
  );
