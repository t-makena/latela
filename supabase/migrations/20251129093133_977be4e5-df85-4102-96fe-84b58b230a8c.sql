-- Enable RLS on user_merchant_mappings
ALTER TABLE public.user_merchant_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_merchant_mappings
CREATE POLICY "Users can view their own merchant mappings"
ON public.user_merchant_mappings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own merchant mappings"
ON public.user_merchant_mappings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant mappings"
ON public.user_merchant_mappings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own merchant mappings"
ON public.user_merchant_mappings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable RLS on user_custom_categories
ALTER TABLE public.user_custom_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_custom_categories
CREATE POLICY "Users can view their own custom categories"
ON public.user_custom_categories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom categories"
ON public.user_custom_categories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom categories"
ON public.user_custom_categories
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories"
ON public.user_custom_categories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);