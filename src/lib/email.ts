/**
 * Email notification service for Lavender Moon Villas
 * Supports Resend API (recommended) or SMTP fallback
 */

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
  roomName: string
  roomNumber: string
  checkIn: string
  checkOut: string
  numGuests: number
  totalPrice: number
  specialRequests?: string
  status: string
}

/**
 * Send email using Resend API (recommended for Vercel)
 */
async function sendEmailWithResend(data: EmailData): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.EMAIL_FROM || 'Lavender Moon Villas <noreply@lavendermoon.net>'
  const REPLY_TO = process.env.EMAIL_REPLY_TO || 'reservations@lavendermoon.net'

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured. Email sending disabled.')
    return false
  }

  try {
    // Dynamic import to avoid build-time errors if package not installed
    const { Resend } = await import('resend')
    const resend = new Resend(RESEND_API_KEY)

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      replyTo: REPLY_TO,
      subject: data.subject,
      html: data.html,
      text: data.text || data.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    if (result.error) {
      console.error('Resend API error:', result.error)
      return false
    }

    console.log('Email sent successfully:', result.data?.id)
    return true
  } catch (error: any) {
    console.error('Error sending email with Resend:', error.message)
    return false
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
  })
  const checkOutDate = new Date(data.checkOut).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - Lavender Moon Villas</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6B4E8E; font-size: 28px; margin: 0;">Lavender Moon Villas</h1>
        <p style="color: #888; font-style: italic; margin: 5px 0;">Where tranquility meets luxury</p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #6B4E8E; margin-top: 0;">Booking Confirmed!</h2>
        <p>Dear ${data.guestName},</p>
        <p>Thank you for choosing Lavender Moon Villas. Your reservation has been confirmed!</p>
      </div>

      <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #6B4E8E; margin-top: 0; border-bottom: 2px solid #6B4E8E; padding-bottom: 10px;">Reservation Details</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 40%;">Reservation ID:</td>
            <td style="padding: 8px 0;">#${data.reservationId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Room:</td>
            <td style="padding: 8px 0;">${data.roomName} (${data.roomNumber})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Check-in:</td>
            <td style="padding: 8px 0;">${checkInDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Check-out:</td>
            <td style="padding: 8px 0;">${checkOutDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Guests:</td>
            <td style="padding: 8px 0;">${data.numGuests}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Total Amount:</td>
            <td style="padding: 8px 0; font-size: 18px; color: #6B4E8E; font-weight: bold;">$${data.totalPrice.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      ${data.specialRequests ? `
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
        <strong>Special Requests:</strong>
        <p style="margin: 5px 0 0 0;">${data.specialRequests}</p>
      </div>
      ` : ''}

      <div style="background: #e8f0eb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #6B4E8E; margin-top: 0;">What's Next?</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>We look forward to welcoming you to Lavender Moon Villas</li>
          <li>Check-in time is from 3:00 PM</li>
          <li>Check-out time is by 11:00 AM</li>
          <li>If you have any questions, please contact us at reservations@lavendermoon.net or +1 (876) 516-1421</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
        <p><strong>Lavender Moon Villas</strong></p>
        <p>Breadnut Hill, Ocho Rios, St. Ann Parish, Jamaica</p>
        <p>Phone: +1 (876) 516-1421 | WhatsApp: +1 (876) 506-8440</p>
        <p>Email: reservations@lavendermoon.net</p>
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
        <p><strong>Check-in:</strong> ${new Date(data.checkIn).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Check-out:</strong> ${new Date(data.checkOut).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
        <p>Dates: ${new Date(data.checkIn).toLocaleDateString()} - ${new Date(data.checkOut).toLocaleDateString()}</p>
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
 */
export async function sendBookingConfirmation(data: ReservationEmailData): Promise<boolean> {
  const html = generateBookingConfirmationEmail(data)
  const subject = `Booking Confirmation #${data.reservationId} - Lavender Moon Villas`

  return await sendEmailWithResend({
    to: data.guestEmail,
    subject,
    html,
  })
}

/**
 * Send reservation update email
 */
export async function sendReservationUpdate(
  data: ReservationEmailData,
  changes: string[]
): Promise<boolean> {
  const html = generateReservationUpdateEmail(data, changes)
  const subject = `Reservation Updated #${data.reservationId} - Lavender Moon Villas`

  return await sendEmailWithResend({
    to: data.guestEmail,
    subject,
    html,
  })
}

/**
 * Send cancellation email
 */
export async function sendCancellationEmail(data: ReservationEmailData): Promise<boolean> {
  const html = generateCancellationEmail(data)
  const subject = `Reservation Cancelled #${data.reservationId} - Lavender Moon Villas`

  return await sendEmailWithResend({
    to: data.guestEmail,
    subject,
    html,
  })
}

