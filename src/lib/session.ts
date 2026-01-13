import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export type Session = {
  id: number
  email: string
  role: string
  name: string
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as Session
  } catch {
    return null
  }
}
