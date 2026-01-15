-- Update thumbnail for room-109-ls
-- Changes from the toilet image to PHOTO-2026-01-03-15-47-21.jpg

-- Update or insert thumbnail
INSERT INTO room_thumbnails (room_slug, thumbnail_url, updated_at)
VALUES ('room-109-ls', '/Pictures/109-LS/PHOTO-2026-01-03-15-47-21.jpg', NOW())
ON CONFLICT (room_slug) 
DO UPDATE SET 
  thumbnail_url = EXCLUDED.thumbnail_url,
  updated_at = NOW();

-- Also update room_images table if it exists (mark this image as thumbnail)
UPDATE room_images 
SET is_thumbnail = (image_url = '/Pictures/109-LS/PHOTO-2026-01-03-15-47-21.jpg')
WHERE room_slug = 'room-109-ls';

-- Verify the update
SELECT 
  room_slug,
  thumbnail_url,
  updated_at
FROM room_thumbnails
WHERE room_slug = 'room-109-ls';
