-- Add budget method columns to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS budget_method text NOT NULL DEFAULT 'percentage_based',
ADD COLUMN IF NOT EXISTS needs_percentage integer NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS wants_percentage integer NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS savings_percentage integer NOT NULL DEFAULT 20;

-- Add check constraint to ensure percentages sum to 100
ALTER TABLE public.user_settings
ADD CONSTRAINT budget_percentages_sum_100 CHECK (needs_percentage + wants_percentage + savings_percentage = 100);

-- Add check constraint for valid budget method values
ALTER TABLE public.user_settings
ADD CONSTRAINT valid_budget_method CHECK (budget_method IN ('zero_based', 'percentage_based'));