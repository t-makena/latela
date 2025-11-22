-- Enable RLS on goals table
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for goals table
CREATE POLICY "Users can view their own goals"
ON goals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
ON goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
ON goals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
ON goals
FOR DELETE
USING (auth.uid() = user_id);

-- Add missing DELETE policy for merchants table
CREATE POLICY "Users can delete their own merchant categories"
ON merchants
FOR DELETE
USING (auth.uid() = user_id);