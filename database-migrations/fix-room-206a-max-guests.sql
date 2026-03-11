-- Fix Room 206-A max_guests capacity
-- Issue: Room 206-A was set to max_guests=4, but should be 2
-- This migration updates the capacity to match the room specification

UPDATE rooms
SET max_guests = 2
WHERE room_number = '206-A';

-- Verify the update
SELECT room_number, name, max_guests FROM rooms WHERE room_number = '206-A';
