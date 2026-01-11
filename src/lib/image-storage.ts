// Image storage utilities for Vercel Blob Storage
// This provides future-proofing for migrating from public folder to Vercel Blob

import { put, list, del } from '@vercel/blob'
import { getRoomFolder } from './room-folder-map'

// Check if Vercel Blob is configured
export function isBlobStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

/**
 * Upload an image to Vercel Blob Storage
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

  const result = await put(blobPath, file, {
    access: 'public',
  })

  return result
}

/**
 * List all images for a room from Vercel Blob Storage
 * @param roomSlug - The room slug
 * @returns Promise with array of image URLs
 */
export async function listRoomImages(roomSlug: string): Promise<string[]> {
  if (!isBlobStorageEnabled()) {
    return []
  }

  try {
    const { blobs } = await list({
      prefix: `rooms/${roomSlug}/`,
    })

    return blobs.map(blob => blob.url).sort()
  } catch (error) {
    console.warn('Error listing room images from blob storage:', error)
    return []
  }
}

/**
 * Delete a room image from Vercel Blob Storage
 * @param roomSlug - The room slug
 * @param filename - The filename to delete
 * @returns Promise with the delete result
 */
export async function deleteRoomImage(roomSlug: string, filename: string) {
  if (!isBlobStorageEnabled()) {
    throw new Error('Vercel Blob Storage is not configured')
  }

  const blobPath = `rooms/${roomSlug}/${filename}`
  return await del(blobPath)
}

/**
 * List all images for a room with detailed blob information
 * @param roomSlug - The room slug
 * @returns Promise with array of blob objects with metadata
 */
export async function listAllRoomImages(roomSlug: string) {
  if (!isBlobStorageEnabled()) {
    return []
  }

  try {
    const { blobs } = await list({
      prefix: `rooms/${roomSlug}/`,
    })

    return blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      filename: blob.pathname.split('/').pop() || 'unknown',
      size: blob.size,
      uploadedAt: blob.uploadedAt
    })).sort((a, b) => a.filename.localeCompare(b.filename))
  } catch (error) {
    console.warn('Error listing room images from blob storage:', error)
    return []
  }
}

/**
 * Get image counts for all rooms
 * @returns Promise with room image counts
 */
export async function getAllRoomsImageCounts() {
  const roomImageCounts: Record<string, number> = {}

  if (!isBlobStorageEnabled()) {
    return roomImageCounts
  }

  try {
    const { blobs } = await list({
      prefix: 'rooms/',
    })

    // Count images per room
    blobs.forEach(blob => {
      const pathParts = blob.pathname.split('/')
      if (pathParts.length >= 3 && pathParts[1] === 'rooms') {
        const roomSlug = pathParts[2]
        roomImageCounts[roomSlug] = (roomImageCounts[roomSlug] || 0) + 1
      }
    })

  } catch (error) {
    console.warn('Error getting room image counts:', error)
  }

  return roomImageCounts
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