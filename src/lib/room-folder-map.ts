// Room slug to folder name mapping for dynamic image loading
export const roomFolderMap: Record<string, string> = {
  // Suites
  'victoria-suite': 'Victoria-Suite',
  'alexander-suite': 'Alexander-Suite',
  'renee-suite': 'Renee-Suite',

  // Standard Rooms
  'room-106': '106-JW',
  'room-107-cf': 'Room 107-CF',
  'room-108': '108-JA',
  'room-109-ls': '109-LS',
  'room-207-a': '207-A',
  'room-208a': '208-A',
  'room-208ab': '208-B', // Note: Room 208AB maps to 208-B folder
  'room-209-jf': '209-JF',
  'room-206-a': '206-A',
  'room-206-b': 'Room 206-B',
  'room-207-b': '207-B',
  'room-208-b': '208-B',
}

/**
 * Get the folder name for a given room slug
 * @param slug - The room slug (e.g., 'room-106')
 * @returns The corresponding folder name or null if not found
 */
export function getRoomFolder(slug: string): string | null {
  return roomFolderMap[slug] || null
}

/**
 * Get all room slugs that have folder mappings
 * @returns Array of room slugs
 */
export function getMappedRoomSlugs(): string[] {
  return Object.keys(roomFolderMap)
}

/**
 * Check if a room slug has a folder mapping
 * @param slug - The room slug to check
 * @returns True if the slug has a folder mapping
 */
export function hasRoomFolder(slug: string): boolean {
  return slug in roomFolderMap
}