import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { sql, Staff } from './db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(staff: Omit<Staff, 'password_hash'>): Promise<string> {
  return new SignJWT({ 
    id: staff.id, 
    email: staff.email, 
    role: staff.role,
    name: `${staff.first_name} ${staff.last_name}`
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: number; email: string; role: string; name: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function login(email: string, password: string) {
  const result = await sql`
    SELECT * FROM staff WHERE email = ${email} AND is_active = true
  `;
  
  if (result.length === 0) {
    return { error: 'Invalid credentials' };
  }
  
  const staff = result[0] as Staff;
  const valid = await verifyPassword(password, staff.password_hash);
  
  if (!valid) {
    return { error: 'Invalid credentials' };
  }
  
  const { password_hash, ...staffData } = staff;
  const token = await createToken(staffData);
  
  return { token, staff: staffData };
}

export async function createStaffMember(
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string, 
  role: 'admin' | 'front_desk' | 'manager' = 'front_desk'
) {
  const passwordHash = await hashPassword(password);
  
  const result = await sql`
    INSERT INTO staff (email, password_hash, first_name, last_name, role)
    VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName}, ${role})
    RETURNING id, email, first_name, last_name, role, is_active, created_at
  `;
  
  return result[0];
}


