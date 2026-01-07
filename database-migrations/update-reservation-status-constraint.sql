-- Migration: Update reservations_status_check constraint to include new payment statuses
-- This adds 'deposit_paid' and 'paid_in_full' to the allowed status values

-- Step 1: Drop the existing constraint
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Step 2: Add the updated constraint with all valid statuses
ALTER TABLE reservations 
ADD CONSTRAINT reservations_status_check 
CHECK (status IN ('pending', 'deposit_paid', 'paid_in_full', 'checked_in', 'checked_out', 'cancelled'));

-- Verify the constraint was created
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'reservations_status_check'
AND conrelid = 'reservations'::regclass;

