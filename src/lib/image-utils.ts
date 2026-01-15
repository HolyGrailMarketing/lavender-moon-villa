/**
 * Utility functions for handling images from Vercel Blob Storage
 */

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
 * Convert a blob storage URL to use the proxy route
 * This bypasses Next.js Image optimization issues with external URLs
 */
export function getProxiedImageUrl(url: string): string {
  if (isBlobStorageUrl(url)) {
    return `/api/image?url=${encodeURIComponent(url)}`
  }
  return url
}

/**
 * Get image props for Next.js Image component
 * Returns unoptimized for blob URLs to avoid 403 errors
 */
export function getImageProps(src: string) {
  const isBlob = isBlobStorageUrl(src)
  return {
    src: isBlob ? getProxiedImageUrl(src) : src,
    unoptimized: isBlob, // Disable optimization for blob URLs to avoid 403 errors
  }
}
