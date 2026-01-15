// Image storage utilities for Vercel Blob Storage
// This provides future-proofing for migrating from public folder to Vercel Blob
// Uses database to store URLs to avoid Vercel Blob Storage list() operations

import { put, list, del } from '@vercel/blob'
import { getRoomFolder } from './room-folder-map'
import { sql } from './db'

/**
 * Check if a URL is from Vercel Blob Storage
 */
export function isBlobStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('blob.vercel-storage.com')
  } catch {
    return false
  }
}

/**
 * Convert a blob storage URL to a public folder path
 * @param blobUrl - The blob storage URL
 * @param roomSlug - The room slug (optional, will be extracted from URL if not provided)
 * @returns Public folder path or original URL if conversion fails
 */
function convertBlobUrlToPublicPath(blobUrl: string, roomSlug?: string): string {
  try {
    // Extract room slug and filename from blob URL
    // Format: https://*.public.blob.vercel-storage.com/rooms/{roomSlug}/{filename}
    const urlMatch = blobUrl.match(/\/rooms\/([^\/]+)\/(.+)$/)
    if (!urlMatch) {
      return blobUrl // Return original if pattern doesn't match
    }

    const extractedRoomSlug = roomSlug || urlMatch[1]
    const filename = decodeURIComponent(urlMatch[2])

    // Get the folder name for this room
    const folderName = getRoomFolder(extractedRoomSlug)
    if (!folderName) {
      return blobUrl // Return original if no folder mapping
    }

    // Convert to public folder path
    return `/Pictures/${folderName}/${filename}`
  } catch (error) {
    console.warn('Error converting blob URL to public path:', error)
    return blobUrl // Return original on error
  }
}

// In-memory cache for blob listings to reduce Advanced Operations usage
// Cache expires after 5 minutes
const imageCache = new Map<string, { images: string[], timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Check if Vercel Blob is configured
// Can be disabled by setting BLOB_DISABLED=true to avoid hitting usage limits
export function isBlobStorageEnabled(): boolean {
  if (process.env.BLOB_DISABLED === 'true') {
    return false
  }
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

/**
 * Upload an image to Vercel Blob Storage and save URL to database
 * @param file - The file to upload
 * @param roomSlug - The room slug for organizing images
 * @param filename - Optional custom filename
 * @returns Promise with the blob result
 */
export async function uploadRoomImage(
  file: File,
  roomSlug: string,
  filename?: string
) {
  if (!isBlobStorageEnabled()) {
    throw new Error('Vercel Blob Storage is not configured')
  }

  const folderName = getRoomFolder(roomSlug)
  if (!folderName) {
    throw new Error(`No folder mapping found for room: ${roomSlug}`)
  }

  const finalFilename = filename || file.name
  const blobPath = `rooms/${roomSlug}/${finalFilename}`

  // Upload to Vercel Blob Storage
  const result = await put(blobPath, file, {
    access: 'public',
  })

  // Save URL to database to avoid future list() operations
  try {
    await sql`
      INSERT INTO room_images (room_slug, image_url, filename, display_order)
      VALUES (${roomSlug}, ${result.url}, ${finalFilename}, 
        (SELECT COALESCE(MAX(display_order), 0) + 1 FROM room_images WHERE room_slug = ${roomSlug}))
      ON CONFLICT (room_slug, image_url) DO NOTHING
    `
  } catch (error) {
    console.warn('Error saving image URL to database:', error)
    // Continue even if database save fails - the image is still uploaded
  }

  // Clear cache for this room after upload
  clearImageCache(roomSlug)

  return result
}

/**
 * List all images for a room from database (avoids Vercel Blob list() operations)
 * Falls back to blob storage list() if database is empty
 * @param roomSlug - The room slug
 * @returns Promise with array of image URLs
 */
export async function listRoomImages(roomSlug: string): Promise<string[]> {
  // Check cache first
  const cacheKey = `room:${roomSlug}`
  const cached = imageCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.images
  }

  // Try database first (no Advanced Operations)
  try {
    const dbImages = await sql`
      SELECT image_url 
      FROM room_images 
      WHERE room_slug = ${roomSlug}
      ORDER BY display_order ASC, created_at ASC
    `

    if (dbImages.length > 0) {
      let images = dbImages.map(row => row.image_url as string)
      
      // If blob storage is disabled, convert blob URLs to public folder paths
      if (!isBlobStorageEnabled()) {
        images = images.map(url => {
          if (isBlobStorageUrl(url)) {
            return convertBlobUrlToPublicPath(url, roomSlug)
          }
          return url
        })
      }
      
      // Cache the result
      imageCache.set(cacheKey, {
        images,
        timestamp: Date.now()
      })

      return images
    }
  } catch (error) {
    console.warn('Error querying room images from database:', error)
    // Fall through to public folder fallback
  }

  // Fallback to public folder if database is empty
  // This is handled in the API route, not here to avoid circular dependencies

  // Fallback to blob storage list() if database is empty (only for migration)
  // This will only work if blob storage is enabled and not blocked
  if (isBlobStorageEnabled()) {
    try {
      const { blobs } = await list({
        prefix: `rooms/${roomSlug}/`,
      })

      let images = blobs.map(blob => blob.url).sort()
      
      // If blob storage is disabled, convert blob URLs to public folder paths
      if (!isBlobStorageEnabled()) {
        images = images.map(url => convertBlobUrlToPublicPath(url, roomSlug))
      }
      
      // Save to database for future queries (one-time migration)
      // Save original blob URLs to database, conversion happens on read
      if (images.length > 0 && isBlobStorageEnabled()) {
        try {
          const originalBlobUrls = blobs.map(blob => blob.url)
          for (let i = 0; i < originalBlobUrls.length; i++) {
            const url = originalBlobUrls[i]
            const filename = url.split('/').pop() || `image-${i}`
            await sql`
              INSERT INTO room_images (room_slug, image_url, filename, display_order)
              VALUES (${roomSlug}, ${url}, ${filename}, ${i})
              ON CONFLICT (room_slug, image_url) DO NOTHING
            `
          }
        } catch (migrationError) {
          console.warn('Error migrating images to database:', migrationError)
        }
      }
      
      // Cache the result
      imageCache.set(cacheKey, {
        images,
        timestamp: Date.now()
      })

      return images
    } catch (error) {
      console.warn('Error listing room images from blob storage:', error)
    }
  }

  // Return cached data if available, even if expired
  if (cached) {
    return cached.images
  }

  return []
}

/**
 * Delete a room image from Vercel Blob Storage and database
 * @param roomSlug - The room slug
 * @param imageUrl - The image URL to delete (can be full URL or filename)
 * @returns Promise with the delete result
 */
export async function deleteRoomImage(roomSlug: string, imageUrl: string) {
  // Delete from database first
  try {
    await sql`
      DELETE FROM room_images 
      WHERE room_slug = ${roomSlug} 
      AND (image_url = ${imageUrl} OR image_url LIKE ${`%/${imageUrl}`} OR filename = ${imageUrl})
    `
  } catch (error) {
    console.warn('Error deleting image from database:', error)
  }

  // Delete from blob storage if enabled
  if (isBlobStorageEnabled()) {
    try {
      // Extract filename from URL if needed
      const filename = imageUrl.includes('/') 
        ? imageUrl.split('/').pop() || imageUrl
        : imageUrl
      const blobPath = `rooms/${roomSlug}/${filename}`
      await del(blobPath)
    } catch (error) {
      console.warn('Error deleting image from blob storage:', error)
      // Continue even if blob delete fails - at least database is updated
    }
  }
  
  // Clear cache for this room after delete
  clearImageCache(roomSlug)
  
  return { success: true }
}

/**
 * List all images for a room with detailed information from database
 * Avoids Vercel Blob Storage list() operations
 * @param roomSlug - The room slug
 * @returns Promise with array of image objects with metadata
 */
export async function listAllRoomImages(roomSlug: string) {
  // Check cache first
  const cacheKey = `room-detail:${roomSlug}`
  const cached = imageCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.images as any[]
  }

  // Query database (no Advanced Operations)
  try {
    const dbImages = await sql`
      SELECT 
        id,
        image_url as url,
        filename,
        display_order,
        is_thumbnail,
        created_at as uploadedAt
      FROM room_images 
      WHERE room_slug = ${roomSlug}
      ORDER BY display_order ASC, created_at ASC
    `

    if (dbImages.length > 0) {
      const images = dbImages.map(row => ({
        url: row.url as string,
        pathname: (row.url as string).split('/').slice(-2).join('/'),
        filename: row.filename as string,
        size: null, // Size not stored in database
        uploadedAt: row.uploadedAt as Date,
        is_thumbnail: row.is_thumbnail as boolean,
        display_order: row.display_order as number
      }))

      // Cache the result
      imageCache.set(cacheKey, {
        images: images as any,
        timestamp: Date.now()
      })

      return images
    }
  } catch (error) {
    console.warn('Error querying room images from database:', error)
  }

  // Fallback to blob storage list() if database is empty (migration)
  if (isBlobStorageEnabled()) {
    try {
      const { blobs } = await list({
        prefix: `rooms/${roomSlug}/`,
      })

      const images = blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        filename: blob.pathname.split('/').pop() || 'unknown',
        size: blob.size,
        uploadedAt: blob.uploadedAt
      })).sort((a, b) => a.filename.localeCompare(b.filename))

      // Migrate to database
      if (images.length > 0) {
        try {
          for (const img of images) {
            await sql`
              INSERT INTO room_images (room_slug, image_url, filename, display_order)
              VALUES (${roomSlug}, ${img.url}, ${img.filename}, 0)
              ON CONFLICT (room_slug, image_url) DO NOTHING
            `
          }
        } catch (migrationError) {
          console.warn('Error migrating images to database:', migrationError)
        }
      }

      // Cache the result
      imageCache.set(cacheKey, {
        images: images as any,
        timestamp: Date.now()
      })

      return images
    } catch (error) {
      console.warn('Error listing room images from blob storage:', error)
    }
  }

  // Return cached data if available, even if expired
  if (cached) {
    return cached.images as any[]
  }

  return []
}

/**
 * Get image counts for all rooms from database
 * Avoids Vercel Blob Storage list() operations
 * @returns Promise with room image counts
 */
export async function getAllRoomsImageCounts() {
  const roomImageCounts: Record<string, number> = {}

  // Check cache first
  const cacheKey = 'all-rooms-counts'
  const cached = imageCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.images as any
  }

  // Query database (no Advanced Operations)
  try {
    const counts = await sql`
      SELECT room_slug, COUNT(*) as count
      FROM room_images
      GROUP BY room_slug
    `

    counts.forEach(row => {
      roomImageCounts[row.room_slug as string] = parseInt(row.count as string, 10)
    })

    // Cache the result
    imageCache.set(cacheKey, {
      images: roomImageCounts as any,
      timestamp: Date.now()
    })

  } catch (error) {
    console.warn('Error getting room image counts from database:', error)
    // Return cached data if available, even if expired
    if (cached) {
      return cached.images as any
    }
  }

  return roomImageCounts
}

/**
 * Clear the image cache (useful after uploads/deletes)
 */
export function clearImageCache(roomSlug?: string) {
  if (roomSlug) {
    imageCache.delete(`room:${roomSlug}`)
    imageCache.delete(`room-detail:${roomSlug}`)
    imageCache.delete('all-rooms-counts')
  } else {
    imageCache.clear()
  }
}

/**
 * Get image URLs for a room, with fallback to public folder
 * This provides a unified interface that works with both storage methods
 * @param roomSlug - The room slug
 * @returns Promise with array of image URLs
 */
export async function getRoomImageUrls(roomSlug: string): Promise<string[]> {
  // Try Vercel Blob first if enabled
  if (isBlobStorageEnabled()) {
    const blobImages = await listRoomImages(roomSlug)
    if (blobImages.length > 0) {
      return blobImages
    }
  }

  // Fallback to API route (which reads from public folder)
  try {
    const response = await fetch(`/api/rooms/${roomSlug}/images`)
    if (response.ok) {
      const data = await response.json()
      return data.images || []
    }
  } catch (error) {
    console.warn('Error fetching room images:', error)
  }

  return []
}