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

  // Get the count of reservations for this date
  // We'll count reservations created on this date (using created_at) or with this check_in date
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  // Count existing reservations with check_in on this date
  const countResult = await sql`
    SELECT COUNT(*) as count
    FROM reservations
    WHERE DATE(check_in) = DATE(${checkInDate})
  `

  const count = parseInt(countResult[0]?.count || '0', 10)
  const sequenceNumber = String(count + 1).padStart(2, '0') // Next number, padded to 2 digits

  return `${PREFIX}-${datePart}-${sequenceNumber}`
}




