-- Add parent_category_id column to budget_items table for category limit validation
ALTER TABLE public.budget_items 
ADD COLUMN IF NOT EXISTS parent_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_budget_items_parent_category ON public.budget_items(parent_category_id);