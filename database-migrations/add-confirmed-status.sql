-- Migration: Add 'confirmed' to the reservations_status_check constraint
-- Used for bookings made while online payment is disabled (PAYMENTS_ENABLED = false):
-- the reservation is confirmed and holds the room, with payment collected at check-in.
--
-- IMPORTANT: run this against the database BEFORE deploying the pay-on-arrival changes,
-- otherwise every public booking fails with constraint violation 23514.

-- Step 1: Drop the existing constraint
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Step 2: Add the updated constraint with all valid statuses
ALTER TABLE reservations
ADD CONSTRAINT reservations_status_check
CHECK (status IN ('pending', 'confirmed', 'deposit_paid', 'paid_in_full', 'checked_in', 'checked_out', 'cancelled'));

-- Verify the constraint was created
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'reservations_status_check'
AND conrelid = 'reservations'::regclass;
