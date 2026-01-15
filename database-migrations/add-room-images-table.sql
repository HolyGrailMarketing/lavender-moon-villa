-- Create room_images table to store image URLs
-- This eliminates the need for Vercel Blob Storage list() operations
-- which count as Advanced Operations and have usage limits

CREATE TABLE IF NOT EXISTS room_images (
  id SERIAL PRIMARY KEY,
  room_slug VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_thumbnail BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast lookups by room_slug
CREATE INDEX IF NOT EXISTS idx_room_images_slug ON room_images(room_slug);

-- Create index for thumbnail lookups
CREATE INDEX IF NOT EXISTS idx_room_images_thumbnail ON room_images(room_slug, is_thumbnail) WHERE is_thumbnail = TRUE;

-- Create unique constraint to prevent duplicate URLs for the same room
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_images_unique_url ON room_images(room_slug, image_url);

-- Add comment to table
COMMENT ON TABLE room_images IS 'Stores image URLs for rooms to avoid Vercel Blob Storage list() operations';

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'room_images'
ORDER BY ordinal_position;
