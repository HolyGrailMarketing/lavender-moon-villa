/**
 * Email notification service for Lavender Moon Villas
 * Supports Resend API (recommended) or SMTP fallback
 */

import { RESERVATION_DISCLAIMERS } from './disclaimers'
import { PAYMENTS_ENABLED } from './config'

type EmailData = {
  to: string
  subject: string
  html: string
  text?: string
}

type ReservationEmailData = {
  guestName: string
  guestEmail: string
  reservationId: number
  reservationIdFormatted?: string // LMV22927-YYMMDD-NN format
  roomName: string
  roomNumber: string
  checkIn: string
  checkOut: string
  numGuests: number
  totalPrice: number
  amountPaid?: number
  outstandingBalance?: number
  specialRequests?: string
  status: string
  serviceCharge?: number
  additionalItems?: Array<{ description: string; amount: number }>
}

/**
 * Email error types for better error handling
 */
export class EmailError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'EmailError'
  }
}

/**
 * Send email using Resend API (recommended for Vercel)
 * Returns an object with success status and error details
 */
export async function sendEmailWithResend(data: EmailData): Promise<{ success: boolean; error?: EmailError; emailId?: string }> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.EMAIL_FROM || 'Lavender Moon Villas <noreply@lavendermoon.net>'
  const REPLY_TO = process.env.EMAIL_REPLY_TO || 'reservations@lavendermoon.net'

  if (!RESEND_API_KEY) {
    const error = new EmailError(
      'RESEND_API_KEY not configured. Email sending disabled.',
      'MISSING_API_KEY'
    )
    console.warn('[Email]', error.message)
    return { success: false, error }
  }

  // Validate email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.to)) {
    const error = new EmailError(
      `Invalid email address: ${data.to}`,
      'INVALID_EMAIL',
      { email: data.to }
    )
    console.error('[Email]', error.message)
    return { success: false, error }
  }

  try {
    // Dynamic import to avoid build-time errors if package not installed
    const { Resend } = await import('resend')
    const resend = new Resend(RESEND_API_KEY)

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      reply_to: REPLY_TO,
      subject: data.subject,
      html: data.html,
      text: data.text || data.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    if (result.error) {
      const error = new EmailError(
        `Resend API error: ${result.error.message || 'Unknown error'}`,
        'RESEND_API_ERROR',
        {
          code: result.error.name,
          message: result.error.message,
          statusCode: (result.error as any).statusCode,
        }
      )
      console.error('[Email] Failed to send:', {
        to: data.to,
        subject: data.subject,
        error: error.message,
        details: error.details,
      })
      return { success: false, error }
    }

    console.log('[Email] Sent successfully:', {
      to: data.to,
      subject: data.subject,
      emailId: result.data?.id,
    })
    return { success: true, emailId: result.data?.id }
  } catch (error: any) {
    const emailError = new EmailError(
      `Error sending email: ${error.message || 'Unknown error'}`,
      'SEND_ERROR',
      {
        message: error.message,
        stack: error.stack,
        name: error.name,
      }
    )
    console.error('[Email] Exception while sending:', {
      to: data.to,
      subject: data.subject,
      error: emailError.message,
      details: emailError.details,
    })
    return { success: false, error: emailError }
  }
}

/**
 * Generate booking confirmation email HTML
 */
function generateBookingConfirmationEmail(data: ReservationEmailData): string {
  const checkInDate = new Date(data.checkIn).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Prevent timezone offset from shifting the date
  })
  const checkOutDate = new Date(data.checkOut).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Prevent timezone offset from shifting the date
  })

  // Ensure baseUrl doesn't have trailing slash
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://lavendermoon.net').replace(/\/$/, '')
  const reservationIdDisplay = data.reservationIdFormatted || `#${data.reservationId}`
  const amountPaid = data.amountPaid || 0
  const outstandingBalance = data.outstandingBalance !== undefined ? data.outstandingBalance : (data.totalPrice - amountPaid)

  // Calculate subtotal (total minus service charge)
  const serviceChargeAmount = data.serviceCharge || 0
  const subtotal = data.totalPrice - serviceChargeAmount

  // Logo URL - ensure it's an absolute URL without trailing slash
  // Note: Email clients may block external images by default. Users may need to "Load images" or allow images from this sender.
  const logoUrl = `${baseUrl}/Pictures/Logo.png`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - Lavender Moon Villas</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <!-- Header with Logo -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6B4E8E; padding-bottom: 20px;">
          <!-- Logo image - Email clients may block external images by default -->
          <img src="${logoUrl}" alt="Lavender Moon Villas" width="150" style="max-width: 150px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto; border: 0; outline: none; text-decoration: none;" />
          <h1 style="color: #6B4E8E; font-size: 28px; margin: 10px 0 5px 0;">Lavender Moon Villas</h1>
          <p style="color: #888; font-style: italic; margin: 5px 0; font-size: 14px;">Where tranquility meets luxury</p>
          <div style="margin-top: 15px; font-size: 12px; color: #666;">
            <p style="margin: 3px 0;">📧 reservations@lavendermoon.net</p>
            <p style="margin: 3px 0;">📱 WhatsApp: +1 (876) 506-8440</p>
            <p style="margin: 3px 0;">🌐 <a href="${baseUrl}" style="color: #6B4E8E;">${baseUrl}</a></p>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h2 style="color: #6B4E8E; margin-top: 0; font-size: 24px;">Booking Confirmed!</h2>
          <p style="font-size: 16px;">Dear ${data.guestName},</p>
          <p style="font-size: 14px; color: #666;">Thank you for choosing Lavender Moon Villas. Your reservation has been confirmed!</p>
        </div>

        <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #6B4E8E; margin-top: 0; border-bottom: 2px solid #6B4E8E; padding-bottom: 10px;">Reservation Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; font-weight: bold; width: 40%; border-bottom: 1px solid #eee;">Reservation ID:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                <a href="${baseUrl}/reservations/${data.reservationId}" style="color: #6B4E8E; text-decoration: none; font-weight: bold;">${reservationIdDisplay}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; border-bottom: 1px solid #eee;">Room:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.roomName} (${data.roomNumber})</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; border-bottom: 1px solid #eee;">Check-in:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${checkInDate} at 3:00 PM</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; border-bottom: 1px solid #eee;">Check-out:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${checkOutDate} by 11:00 AM</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold; border-bottom: 1px solid #eee;">Guests:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.numGuests}</td>
            </tr>
          </table>
        </div>

        <!-- Pricing Breakdown -->
        <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #6B4E8E; margin-top: 0; border-bottom: 2px solid #6B4E8E; padding-bottom: 10px;">Payment Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; text-align: right; width: 70%;">Subtotal:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">$${subtotal.toFixed(2)}</td>
            </tr>
            ${serviceChargeAmount > 0 ? `
            <tr>
              <td style="padding: 8px 0; text-align: right;">Service Charge (15%):</td>
              <td style="padding: 8px 0; text-align: right;">$${serviceChargeAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${data.additionalItems && data.additionalItems.length > 0 ? data.additionalItems.map((item: any) => `
            <tr>
              <td style="padding: 8px 0; text-align: right;">${item.description}:</td>
              <td style="padding: 8px 0; text-align: right;">$${item.amount.toFixed(2)}</td>
            </tr>
            `).join('') : ''}
            <tr style="border-top: 2px solid #6B4E8E;">
              <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 16px;">Total Amount:</td>
              <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 18px; color: #6B4E8E;">$${data.totalPrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; text-align: right; color: #666;">Amount Paid:</td>
              <td style="padding: 8px 0; text-align: right; color: #666;">$${amountPaid.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px solid #ddd;">
              <td style="padding: 12px 0; text-align: right; font-weight: bold;">Outstanding Balance:</td>
              <td style="padding: 12px 0; text-align: right; font-weight: bold; color: ${outstandingBalance > 0 ? '#d32f2f' : '#4caf50'};">
                $${outstandingBalance.toFixed(2)}
              </td>
            </tr>
          </table>
          ${!PAYMENTS_ENABLED && outstandingBalance > 0 ? `
          <p style="margin: 15px 0 0 0; padding: 12px; background: #e8f0fe; border-radius: 4px; font-size: 14px; color: #1a4e8a;">
            <strong>No payment is required now.</strong> Your balance is due at check-in.
          </p>
          ` : ''}
        </div>

        ${data.specialRequests ? `
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
          <strong>Special Requests:</strong>
          <p style="margin: 5px 0 0 0;">${data.specialRequests}</p>
        </div>
        ` : ''}

        ${RESERVATION_DISCLAIMERS}

        <div style="background: #e8f0eb; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h3 style="color: #6B4E8E; margin-top: 0;">We Appreciate Your Feedback!</h3>
          <p style="margin: 15px 0;">If we have exceeded your expectations, kindly leave us a favorable review:</p>
          <p style="margin: 10px 0;">
            <a href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK" style="display: inline-block; background: #6B4E8E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">⭐ Review on Google</a>
            <a href="${baseUrl}/review" style="display: inline-block; background: #8B6FAF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">💬 Review on Website</a>
          </p>
          <p style="margin-top: 15px; font-size: 14px; color: #666;">Follow us on social media @lavendermoonvillas</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
          <p><strong>Lavender Moon Villas</strong></p>
          <p>Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica</p>
          <p style="margin: 8px 0;">
            📧 <a href="mailto:reservations@lavendermoon.net" style="color: #6B4E8E;">reservations@lavendermoon.net</a> | 
            📱 WhatsApp: <a href="https://wa.me/18765068440" style="color: #6B4E8E;">+1 (876) 506-8440</a>
          </p>
          <p>🌐 <a href="${baseUrl}" style="color: #6B4E8E;">${baseUrl}</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate reservation update email HTML
 */
function generateReservationUpdateEmail(data: ReservationEmailData, changes: string[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reservation Updated - Lavender Moon Villas</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6B4E8E; font-size: 28px; margin: 0;">Lavender Moon Villas</h1>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #6B4E8E; margin-top: 0;">Reservation Updated</h2>
        <p>Dear ${data.guestName},</p>
        <p>Your reservation #${data.reservationId} has been updated.</p>
      </div>

      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
        <strong>Changes Made:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          ${changes.map(change => `<li>${change}</li>`).join('')}
        </ul>
      </div>

      <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #6B4E8E; margin-top: 0;">Updated Reservation Details</h3>
        <p><strong>Room:</strong> ${data.roomName} (${data.roomNumber})</p>
        <p><strong>Check-in:</strong> ${new Date(data.checkIn).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
        <p><strong>Check-out:</strong> ${new Date(data.checkOut).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
        <p><strong>Total Amount:</strong> $${data.totalPrice.toFixed(2)}</p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
        <p>If you have any questions, please contact us at reservations@lavendermoon.net</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate cancellation email HTML
 */
function generateCancellationEmail(data: ReservationEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reservation Cancelled - Lavender Moon Villas</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6B4E8E; font-size: 28px; margin: 0;">Lavender Moon Villas</h1>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #6B4E8E; margin-top: 0;">Reservation Cancelled</h2>
        <p>Dear ${data.guestName},</p>
        <p>Your reservation #${data.reservationId} has been cancelled.</p>
      </div>

      <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <p><strong>Cancelled Reservation:</strong></p>
        <p>Room: ${data.roomName} (${data.roomNumber})</p>
        <p>Dates: ${new Date(data.checkIn).toLocaleDateString('en-US', { timeZone: 'UTC' })} - ${new Date(data.checkOut).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
        <p>We hope to welcome you in the future. If you have any questions, please contact us at reservations@lavendermoon.net</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Send booking confirmation email
 * Returns success status and error details if failed
 */
export async function sendBookingConfirmation(data: ReservationEmailData): Promise<{ success: boolean; error?: EmailError; emailId?: string }> {
  try {
    const html = generateBookingConfirmationEmail(data)
    const subject = `Booking Confirmation ${data.reservationIdFormatted || `#${data.reservationId}`} - Lavender Moon Villas`

    const result = await sendEmailWithResend({
      to: data.guestEmail,
      subject,
      html,
    })

    if (!result.success && result.error) {
      console.error(`[Email] Failed to send booking confirmation for reservation ${data.reservationId}:`, {
        guestEmail: data.guestEmail,
        error: result.error.message,
        code: result.error.code,
      })
    }

    return result
  } catch (error: any) {
    const emailError = new EmailError(
      `Unexpected error generating booking confirmation: ${error.message}`,
      'GENERATION_ERROR',
      { originalError: error.message, stack: error.stack }
    )
    console.error('[Email] Exception in sendBookingConfirmation:', emailError.message)
    return { success: false, error: emailError }
  }
}

/**
 * Send reservation update email
 * Returns success status and error details if failed
 */
export async function sendReservationUpdate(
  data: ReservationEmailData,
  changes: string[]
): Promise<{ success: boolean; error?: EmailError; emailId?: string }> {
  try {
    if (!changes || changes.length === 0) {
      console.warn('[Email] No changes provided for reservation update email')
      return { success: false, error: new EmailError('No changes provided', 'NO_CHANGES') }
    }

    const html = generateReservationUpdateEmail(data, changes)
    const subject = `Reservation Updated ${data.reservationIdFormatted || `#${data.reservationId}`} - Lavender Moon Villas`

    const result = await sendEmailWithResend({
      to: data.guestEmail,
      subject,
      html,
    })

    if (!result.success && result.error) {
      console.error(`[Email] Failed to send reservation update for reservation ${data.reservationId}:`, {
        guestEmail: data.guestEmail,
        error: result.error.message,
        code: result.error.code,
      })
    }

    return result
  } catch (error: any) {
    const emailError = new EmailError(
      `Unexpected error generating reservation update: ${error.message}`,
      'GENERATION_ERROR',
      { originalError: error.message, stack: error.stack }
    )
    console.error('[Email] Exception in sendReservationUpdate:', emailError.message)
    return { success: false, error: emailError }
  }
}

/**
 * Send cancellation email
 * Returns success status and error details if failed
 */
export async function sendCancellationEmail(data: ReservationEmailData): Promise<{ success: boolean; error?: EmailError; emailId?: string }> {
  try {
    const html = generateCancellationEmail(data)
    const subject = `Reservation Cancelled ${data.reservationIdFormatted || `#${data.reservationId}`} - Lavender Moon Villas`

    const result = await sendEmailWithResend({
      to: data.guestEmail,
      subject,
      html,
    })

    if (!result.success && result.error) {
      console.error(`[Email] Failed to send cancellation email for reservation ${data.reservationId}:`, {
        guestEmail: data.guestEmail,
        error: result.error.message,
        code: result.error.code,
      })
    }

    return result
  } catch (error: any) {
    const emailError = new EmailError(
      `Unexpected error generating cancellation email: ${error.message}`,
      'GENERATION_ERROR',
      { originalError: error.message, stack: error.stack }
    )
    console.error('[Email] Exception in sendCancellationEmail:', emailError.message)
    return { success: false, error: emailError }
  }
}

/**
 * Generate verification email HTML for reservation access
 */
function generateVerificationEmail(data: { guestName: string; reservationId: number; accessUrl: string }): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lavendermoon.net'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Access Your Reservation - Lavender Moon Villas</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6B4E8E; padding-bottom: 20px;">
          <h1 style="color: #6B4E8E; font-size: 28px; margin: 10px 0 5px 0;">Lavender Moon Villas</h1>
          <p style="color: #888; font-style: italic; margin: 5px 0; font-size: 14px;">Where tranquility meets luxury</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #6B4E8E; margin-top: 0;">Access Your Reservation</h2>
          <p>Dear ${data.guestName},</p>
          <p>You requested access to manage your reservation #${data.reservationId}.</p>
          <p>Click the button below to view and edit your reservation:</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.accessUrl}" style="display: inline-block; background: #6B4E8E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Manage My Reservation
          </a>
        </div>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px;"><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
        </div>

        <div style="background: #e8f0eb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="margin: 10px 0 0 0; font-size: 12px; word-break: break-all; color: #6B4E8E;">${data.accessUrl}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
          <p><strong>Lavender Moon Villas</strong></p>
          <p>Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica</p>
          <p style="margin: 8px 0;">
            📧 <a href="mailto:reservations@lavendermoon.net" style="color: #6B4E8E;">reservations@lavendermoon.net</a> | 
            📱 WhatsApp: <a href="https://wa.me/18765068440" style="color: #6B4E8E;">+1 (876) 506-8440</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send verification email for reservation access
 */
export async function sendVerificationEmail(data: {
  to: string
  guestName: string
  reservationId: number
  accessUrl: string
}): Promise<{ success: boolean; error?: EmailError; emailId?: string }> {
  try {
    const html = generateVerificationEmail(data)
    const subject = `Access Your Reservation #${data.reservationId} - Lavender Moon Villas`

    const result = await sendEmailWithResend({
      to: data.to,
      subject,
      html,
    })

    if (!result.success && result.error) {
      console.error(`[Email] Failed to send verification email for reservation ${data.reservationId}:`, {
        guestEmail: data.to,
        error: result.error.message,
        code: result.error.code,
      })
    }

    return result
  } catch (error: any) {
    const emailError = new EmailError(
      `Unexpected error generating verification email: ${error.message}`,
      'GENERATION_ERROR',
      { originalError: error.message, stack: error.stack }
    )
    console.error('[Email] Exception in sendVerificationEmail:', emailError.message)
    return { success: false, error: emailError }
  }
}

/**
 * Generate check-in email HTML
 */
function generateCheckInEmail(data: {
  guestName: string
  reservationId: number
  roomNumber: string
  roomName: string
  checkInDate: string
  checkInUrl: string
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lavendermoon.net'
  const checkInDate = new Date(data.checkInDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC', // Prevent timezone offset from shifting the date
  })
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Check-In Instructions - Lavender Moon Villas</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6B4E8E; padding-bottom: 20px;">
          <h1 style="color: #6B4E8E; font-size: 28px; margin: 10px 0 5px 0;">Lavender Moon Villas</h1>
          <p style="color: #888; font-style: italic; margin: 5px 0; font-size: 14px;">Where tranquility meets luxury</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #6B4E8E; margin-top: 0;">Ready to Check In!</h2>
          <p>Dear ${data.guestName},</p>
          <p>We're excited to welcome you to Lavender Moon Villas!</p>
          <p>Your check-in is scheduled for <strong>${checkInDate}</strong>.</p>
        </div>

        <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: #2e7d32; margin-top: 0;">Self Check-In Available</h3>
          <p style="margin: 0;">You can check yourself in between <strong>3:00 PM and 9:00 PM</strong> on your check-in date.</p>
          <p style="margin: 10px 0 0 0;">After 9:00 PM, your key will be available with security.</p>
        </div>

        <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="color: #6B4E8E; margin-top: 0;">Reservation Details</h3>
          <p><strong>Reservation #:</strong> ${data.reservationId}</p>
          <p><strong>Room:</strong> ${data.roomName} (${data.roomNumber})</p>
          <p><strong>Check-in Date:</strong> ${checkInDate}</p>
          <p><strong>Check-in Time:</strong> 3:00 PM - 9:00 PM</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.checkInUrl}" style="display: inline-block; background: #6B4E8E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Check In Now
          </a>
        </div>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 14px;"><strong>Important:</strong></p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
            <li>Check-in is only available between 3:00 PM and 9:00 PM on your check-in date</li>
            <li>After 9:00 PM, please contact security for your key</li>
            <li>If you need assistance, call us at +1 (876) 506-8440</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
          <p><strong>Lavender Moon Villas</strong></p>
          <p>Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica</p>
          <p style="margin: 8px 0;">
            📧 <a href="mailto:reservations@lavendermoon.net" style="color: #6B4E8E;">reservations@lavendermoon.net</a> | 
            📱 WhatsApp: <a href="https://wa.me/18765068440" style="color: #6B4E8E;">+1 (876) 506-8440</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send check-in email
 */
export async function sendCheckInEmail(data: {
  to: string
  guestName: string
  reservationId: number
  roomNumber: string
  roomName: string
  checkInDate: string
  checkInUrl: string
}): Promise<{ success: boolean; error?: EmailError; emailId?: string }> {
  try {
    const html = generateCheckInEmail(data)
    const checkInDate = new Date(data.checkInDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC', // Prevent timezone offset from shifting the date
    })
    const subject = `Check-In Instructions for ${checkInDate} - Reservation #${data.reservationId}`

    const result = await sendEmailWithResend({
      to: data.to,
      subject,
      html,
    })

    if (!result.success && result.error) {
      console.error(`[Email] Failed to send check-in email for reservation ${data.reservationId}:`, {
        guestEmail: data.to,
        error: result.error.message,
        code: result.error.code,
      })
    }

    return result
  } catch (error: any) {
    const emailError = new EmailError(
      `Unexpected error generating check-in email: ${error.message}`,
      'GENERATION_ERROR',
      { originalError: error.message, stack: error.stack }
    )
    console.error('[Email] Exception in sendCheckInEmail:', emailError.message)
    return { success: false, error: emailError }
  }
}

