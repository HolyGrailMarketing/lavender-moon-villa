/**
 * Generate reservation ID in format: LMV22927-YYMMDD-NN
 * Example: LMV22927-251230-01 (first reservation on Dec 30, 2025)
 */

import { sql } from './db'

const PREFIX = 'LMV22927'

/**
 * Generate a reservation ID for a given date
 * Format: LMV22927-YYMMDD-NN where NN is the reservation count for that day
 */
export async function generateReservationId(checkInDate: string): Promise<string> {
  // Parse the check-in date
  const date = new Date(checkInDate)
  const year = date.getFullYear().toString().slice(-2) // Last 2 digits of year
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const datePart = `${year}${month}${day}` // YYMMDD format

  // Count existing reservations with the same check_in date AND existing reservation_id pattern
  // This ensures we get the correct sequence number even if some reservations don't have reservation_id yet
  const expectedPattern = `${PREFIX}-${datePart}-%`
  
  const countResult = await sql`
    SELECT COUNT(*) as count
    FROM reservations
    WHERE DATE(check_in) = DATE(${checkInDate})
      AND (reservation_id LIKE ${expectedPattern} OR reservation_id IS NULL)
  `

  const count = parseInt(countResult[0]?.count || '0', 10)
  
  // Find the highest sequence number for this date to avoid duplicates
  // This handles cases where reservations might be created concurrently
  const maxSequenceResult = await sql`
    SELECT reservation_id
    FROM reservations
    WHERE DATE(check_in) = DATE(${checkInDate})
      AND reservation_id LIKE ${expectedPattern}
    ORDER BY reservation_id DESC
    LIMIT 1
  `

  let nextSequence = count + 1
  
  // If we found an existing reservation_id, extract its sequence number
  if (maxSequenceResult.length > 0 && maxSequenceResult[0].reservation_id) {
    const existingId = maxSequenceResult[0].reservation_id as string
    // Extract the sequence number (last 2 digits after the last hyphen)
    const parts = existingId.split('-')
    if (parts.length === 3) {
      const existingSequence = parseInt(parts[2], 10)
      if (!isNaN(existingSequence)) {
        // Use the next sequence number after the highest existing one
        nextSequence = existingSequence + 1
      }
    }
  }

  const sequenceNumber = String(nextSequence).padStart(2, '0') // Pad to 2 digits

  return `${PREFIX}-${datePart}-${sequenceNumber}`
}






