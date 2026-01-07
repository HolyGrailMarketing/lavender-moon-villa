-- Migration: Add guest name columns to reservations table
-- This allows each reservation to preserve the name entered at booking time
-- even if the same email is used with different names

-- Step 1: Add guest name columns to reservations table
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS guest_first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS guest_last_name VARCHAR(255);

-- Step 2: Backfill existing reservations with guest names from guests table
UPDATE reservations r
SET 
  guest_first_name = g.first_name,
  guest_last_name = g.last_name
FROM guests g
WHERE r.guest_id = g.id
  AND (r.guest_first_name IS NULL OR r.guest_last_name IS NULL);

-- Step 3: Verify the columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'reservations'
  AND column_name IN ('guest_first_name', 'guest_last_name')
ORDER BY column_name;

