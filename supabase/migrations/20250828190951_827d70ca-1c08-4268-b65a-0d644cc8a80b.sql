-- Enable Row Level Security on user_balance_summary table
ALTER TABLE public.user_balance_summary ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own balance summary
CREATE POLICY "Users can view their own balance summary" 
ON public.user_balance_summary 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own balance summary
CREATE POLICY "Users can insert their own balance summary" 
ON public.user_balance_summary 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own balance summary
CREATE POLICY "Users can update their own balance summary" 
ON public.user_balance_summary 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own balance summary
CREATE POLICY "Users can delete their own balance summary" 
ON public.user_balance_summary 
FOR DELETE 
USING (auth.uid() = user_id);