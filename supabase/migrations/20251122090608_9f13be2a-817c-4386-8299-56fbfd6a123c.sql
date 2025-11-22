-- Secure categories and category_rules tables for shared reference data
-- Make them read-only for regular users

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view categories
CREATE POLICY "Categories are viewable by all authenticated users"
ON categories
FOR SELECT
USING (auth.role() = 'authenticated');

-- Enable RLS on category_rules table
ALTER TABLE category_rules ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view category rules
CREATE POLICY "Category rules are viewable by all authenticated users"
ON category_rules
FOR SELECT
USING (auth.role() = 'authenticated');

-- Note: No INSERT/UPDATE/DELETE policies for regular users
-- These tables should only be managed through migrations or by database admins