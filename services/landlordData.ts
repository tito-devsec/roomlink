// Demo data for the landlord side. Swap for real API/Supabase calls in production.
import { computeServiceFee } from '../constants/Config';

export interface LandlordRoom {
  id: string;
  name: string;
  price_per_month: number;
  type: 'single' | 'shared' | 'hostel';
  status: 'published' | 'pending' | 'paused' | 'occupied';
  university: string;
  image: string;
  views: number;
  saves: number;
  is_featured: boolean;
}

export interface BookingRequest {
  id: string;
  roomName: string;
  studentName: string;
  studentInitials: string;
  studentVerified: boolean;
  date: string;
  status: 'pending' | 'accepted' | 'rejected';
  serviceFeePaid: number; // what the student already paid RoomLink
}

export const LANDLORD_ROOMS: LandlordRoom[] = [
  { id: 'r1', name: 'Blue Horizon — Room A', price_per_month: 180000, type: 'hostel', status: 'published',
    university: 'UDSM', image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
    views: 1240, saves: 86, is_featured: true },
  { id: 'r2', name: 'Campus View — Single', price_per_month: 250000, type: 'single', status: 'published',
    university: 'UDSM', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
    views: 880, saves: 54, is_featured: false },
  { id: 'r3', name: 'Mlimani Shared Room', price_per_month: 95000, type: 'shared', status: 'occupied',
    university: 'ARU', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
    views: 410, saves: 22, is_featured: false },
  { id: 'r4', name: 'Sinza Studio', price_per_month: 320000, type: 'single', status: 'pending',
    university: 'DIT', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80',
    views: 0, saves: 0, is_featured: false },
];

export const BOOKING_REQUESTS: BookingRequest[] = [
  { id: 'b1', roomName: 'Blue Horizon — Room A', studentName: 'Amina Hassan', studentInitials: 'AH',
    studentVerified: true, date: '2 hours ago', status: 'pending', serviceFeePaid: computeServiceFee(180000) },
  { id: 'b2', roomName: 'Campus View — Single', studentName: 'John Mwangi', studentInitials: 'JM',
    studentVerified: true, date: 'Yesterday', status: 'pending', serviceFeePaid: computeServiceFee(250000) },
  { id: 'b3', roomName: 'Blue Horizon — Room A', studentName: 'Grace Kimaro', studentInitials: 'GK',
    studentVerified: false, date: '3 days ago', status: 'accepted', serviceFeePaid: computeServiceFee(180000) },
];

export const LANDLORD_STATS = {
  activeRooms: LANDLORD_ROOMS.filter(r => r.status === 'published').length,
  pendingRooms: LANDLORD_ROOMS.filter(r => r.status === 'pending').length,
  totalBookings: BOOKING_REQUESTS.length,
  // Monthly rent the landlord stands to collect from accepted bookings:
  expectedRevenue: 430000,
};
