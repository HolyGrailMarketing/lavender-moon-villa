import { neon } from '@neondatabase/serverless';

// Initialize database connection
// Use placeholder during build if DATABASE_URL is not available
// Will use actual connection string at runtime when env var is set
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && typeof window === 'undefined') {
  // Server-side: only warn during build, will fail at runtime if not set
  console.warn('DATABASE_URL not set - this will fail at runtime');
}
export const sql = neon(databaseUrl || 'postgresql://build-placeholder');

export type Room = {
  id: number;
  room_number: string;
  name: string;
  description: string | null;
  price_per_night: number;
  max_guests: number;
  amenities: string[];
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  created_at: Date;
};

export type Guest = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  id_type: string | null;
  id_number: string | null;
  notes: string | null;
  created_at: Date;
};

export type Reservation = {
  id: number;
  room_id: number;
  guest_id: number;
  check_in: Date;
  check_out: Date;
  num_guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  special_requests: string | null;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  room_number?: string;
  room_name?: string;
  guest_name?: string;
  guest_email?: string;
};

export type Staff = {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'front_desk' | 'manager';
  is_active: boolean;
  created_at: Date;
};


