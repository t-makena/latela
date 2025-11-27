-- Add due_date column to goals table to store the actual selected date
ALTER TABLE goals ADD COLUMN due_date date;

-- Add a comment explaining the column
COMMENT ON COLUMN goals.due_date IS 'The actual due date selected by the user for this goal';