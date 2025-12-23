import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { createStaffMember } from '@/lib/auth'

// This endpoint creates the first admin user
// It should only work once when there are no staff members
export async function POST(request: Request) {
  try {
    // Check if any staff exists
    const existing = await sql`SELECT COUNT(*) as count FROM staff`
    
    if (existing[0].count > 0) {
      return NextResponse.json(
        { error: 'Setup already completed' },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const staff = await createStaffMember(email, password, firstName, lastName, 'admin')

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      staff 
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}


