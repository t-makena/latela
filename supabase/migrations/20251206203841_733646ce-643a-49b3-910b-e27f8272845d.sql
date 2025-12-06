-- Add monthly_allocation column to goals table for user-specified allocations
ALTER TABLE goals ADD COLUMN IF NOT EXISTS monthly_allocation DECIMAL(12,2) DEFAULT 0;