-- Add new columns to accounts table to match the required schema
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS account_name text,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ZAR',
ADD COLUMN IF NOT EXISTS current_balance bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update existing records to use current_balance if they have balance
UPDATE accounts SET current_balance = balance WHERE current_balance = 0 AND balance IS NOT NULL;

-- Create merchant_categories table for caching AI categorization
CREATE TABLE IF NOT EXISTS merchant_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_name text NOT NULL,
  category text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  frequency integer DEFAULT 1,
  confidence numeric(3,2) DEFAULT 0.8,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster merchant lookups
CREATE INDEX IF NOT EXISTS idx_merchant_categories_merchant ON merchant_categories(merchant_name);
CREATE INDEX IF NOT EXISTS idx_merchant_categories_user ON merchant_categories(user_id);

-- Add RLS policies for accounts table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for merchant_categories
ALTER TABLE merchant_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own merchant categories" ON merchant_categories
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own merchant categories" ON merchant_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant categories" ON merchant_categories
  FOR UPDATE USING (auth.uid() = user_id);

-- Update transactions table to have user_id
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add RLS policies for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);