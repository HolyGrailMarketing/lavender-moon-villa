import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);

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


