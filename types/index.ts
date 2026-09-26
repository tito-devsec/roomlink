export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  university_id?: string;
  year_of_study?: number;
  budget_min?: number;
  budget_max?: number;
  avatar_url?: string;
  bio?: string;
  is_verified?: boolean;
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  is_admin?: boolean;
  created_at: string;
}

export interface University {
  id: string;
  name: string;
  short_name?: string;
  city: string;
  latitude: number;
  longitude: number;
  logo_url?: string;
  student_count?: number;
  // Admin-controlled: the featured university is pinned to the top of pickers.
  is_featured?: boolean;
}

// Lifestyle preferences used for roommate compatibility scoring.
export interface RoommatePrefs {
  sleep: 'early' | 'late' | 'flexible';
  cleanliness: 'very_tidy' | 'tidy' | 'relaxed';
  study: 'quiet' | 'social' | 'mixed';
  smoking: 'no' | 'yes' | 'ok_with_it';
  guests: 'rarely' | 'sometimes' | 'often';
}

// A student shown in People search / roommate matching. No phone number is ever
// exposed here — students are found and contacted by name only.
export interface StudentProfile {
  id: string;
  full_name: string;
  university_id: string;
  gender?: 'male' | 'female' | 'other';
  year_of_study?: number;
  budget_min?: number;
  budget_max?: number;
  bio?: string;
  avatar_color?: string;
  is_online?: boolean;
  roommate?: RoommatePrefs;
  looking_for_roommate?: boolean;
}

export interface Hostel {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  price_per_month: number;
  type: 'hostel' | 'private_room' | 'shared_room' | 'apartment';
  gender_preference: 'male' | 'female' | 'mixed';
  university_id?: string;
  images: string[];
  amenities: string[];
  available_rooms: number;
  total_rooms: number;
  rating: number;
  review_count: number;
  distance?: number;
  is_verified: boolean;
  whatsapp?: string;
  created_at: string;
}

export interface Room {
  id: string;
  hostel_id: string;
  room_number: string;
  type: 'single' | 'double' | 'triple' | 'quad';
  price_per_month: number;
  is_available: boolean;
  floor?: number;
  images?: string[];
}

export interface Booking {
  id: string;
  user_id: string;
  hostel_id: string;
  room_id?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  booking_code?: string;
  check_in_date: string;
  check_out_date?: string;
  duration_months?: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  hostel?: Hostel;
}

export interface Review {
  id: string;
  hostel_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: User;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'voice' | 'file' | 'system';
  media_url?: string;
  reply_to_id?: string;
  reactions?: Record<string, string[]>;
  read_by: string[];
  is_deleted?: boolean;
  created_at: string;
  sender?: User;
  reply_to?: Message;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  university_id?: string;
  name?: string;
  avatar_url?: string;
  participants: string[];
  last_message?: Message;
  created_at: string;
  university?: University;
}

export interface FilterOptions {
  budget_min?: number;
  budget_max?: number;
  gender?: string;
  university_id?: string;
  max_distance?: number;
  amenities?: string[];
  type?: string;
  min_rating?: number;
}

export interface Verification {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  id_front_url: string;
  id_back_url: string;
  selfie_url: string;
  admin_notes?: string;
  submitted_at: string;
  reviewed_at?: string;
}
