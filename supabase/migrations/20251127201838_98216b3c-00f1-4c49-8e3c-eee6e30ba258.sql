-- Create budget_items table
CREATE TABLE public.budget_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('Monthly', 'Weekly', 'Bi-weekly', 'Daily', 'Once-off')),
  amount NUMERIC(12,2) NOT NULL,
  days_per_week INTEGER CHECK (days_per_week >= 1 AND days_per_week <= 7),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own budget items"
ON public.budget_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget items"
ON public.budget_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget items"
ON public.budget_items
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget items"
ON public.budget_items
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_budget_items_updated_at
BEFORE UPDATE ON public.budget_items
FOR EACH ROW
EXECUTE FUNCTION public.update_calendar_updated_at();