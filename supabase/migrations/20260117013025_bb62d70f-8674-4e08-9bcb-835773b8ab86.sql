-- Create budget_scores table for storing score history
CREATE TABLE budget_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Overall score
  total_score NUMERIC(5,2) NOT NULL,
  
  -- Individual pillar scores (0-1 scale)
  budget_compliance_score NUMERIC(4,3),
  spending_consistency_score NUMERIC(4,3),
  savings_health_score NUMERIC(4,3),
  cash_survival_risk_score NUMERIC(4,3),
  
  -- Supporting metrics (stored in cents)
  remaining_balance BIGINT,
  days_until_payday INTEGER,
  avg_daily_spend BIGINT,
  expected_spend_to_payday BIGINT,
  risk_ratio NUMERIC(6,3),
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_budget_scores_user_date ON budget_scores(user_id, calculated_at DESC);

-- RLS Policies
ALTER TABLE budget_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget scores" ON budget_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget scores" ON budget_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget scores" ON budget_scores
  FOR DELETE USING (auth.uid() = user_id);

-- Add payday settings to user_settings if not exists
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS payday_date INTEGER DEFAULT 25;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS income_frequency TEXT DEFAULT 'monthly';