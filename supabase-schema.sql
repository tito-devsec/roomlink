-- =============================================
-- RoomLink Complete Supabase Schema v2
-- Run in Supabase SQL Editor
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- UNIVERSITIES
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  logo_url TEXT,
  student_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USERS (linked to Clerk user IDs)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  gender TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  university_id UUID REFERENCES universities(id),
  year_of_study INT,
  budget_min INT DEFAULT 0,
  budget_max INT DEFAULT 1000000,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  verification_id_front TEXT,  -- Supabase Storage URL
  verification_id_back TEXT,
  verification_selfie TEXT,
  verification_submitted_at TIMESTAMPTZ,
  verification_reviewed_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HOSTELS
CREATE TABLE IF NOT EXISTS hostels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  price_per_month INT NOT NULL,
  type TEXT CHECK (type IN ('hostel','private_room','shared_room','apartment')) DEFAULT 'hostel',
  gender_preference TEXT CHECK (gender_preference IN ('male','female','mixed')) DEFAULT 'mixed',
  university_id UUID REFERENCES universities(id),
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  available_rooms INT DEFAULT 0,
  total_rooms INT DEFAULT 0,
  rating FLOAT DEFAULT 0,
  review_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  whatsapp TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROOMS
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  type TEXT CHECK (type IN ('single','double','triple','quad')) DEFAULT 'single',
  price_per_month INT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  floor INT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  status TEXT CHECK (status IN ('pending','confirmed','cancelled','completed')) DEFAULT 'pending',
  booking_code TEXT UNIQUE DEFAULT 'RL-' || EXTRACT(EPOCH FROM NOW())::INT::TEXT,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  duration_months INT DEFAULT 1,
  total_amount INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hostel_id, user_id)
);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hostel_id)
);

-- CHATS (group and direct)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT CHECK (type IN ('direct','group')) DEFAULT 'direct',
  university_id UUID REFERENCES universities(id),
  name TEXT,
  avatar_url TEXT,
  participants TEXT[] DEFAULT '{}',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES (real-time)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,
  type TEXT CHECK (type IN ('text','image','voice','file','system')) DEFAULT 'text',
  media_url TEXT,
  reply_to_id UUID REFERENCES messages(id),
  reactions JSONB DEFAULT '{}',
  read_by TEXT[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AMENITIES lookup
CREATE TABLE IF NOT EXISTS amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  category TEXT
);

-- VERIFICATIONS (admin review queue)
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  id_front_url TEXT NOT NULL,
  id_back_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  admin_notes TEXT,
  reviewed_by TEXT REFERENCES users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_hostels_city ON hostels(city);
CREATE INDEX IF NOT EXISTS idx_hostels_university ON hostels(university_id);
CREATE INDEX IF NOT EXISTS idx_hostels_type ON hostels(type);
CREATE INDEX IF NOT EXISTS idx_hostels_gender ON hostels(gender_preference);
CREATE INDEX IF NOT EXISTS idx_hostels_price ON hostels(price_per_month);
CREATE INDEX IF NOT EXISTS idx_hostels_location ON hostels USING gist (point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hostel ON bookings(hostel_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_hostel ON reviews(hostel_id);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university_id);

-- ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Hostels public read" ON hostels FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Universities public read" ON universities FOR SELECT USING (TRUE);
CREATE POLICY "Reviews public read" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Users public read" ON users FOR SELECT USING (TRUE);
CREATE POLICY "Amenities public read" ON amenities FOR SELECT USING (TRUE);

-- User policies
CREATE POLICY "Users update own" ON users FOR UPDATE USING (id = current_user);
CREATE POLICY "Bookings own" ON bookings FOR ALL USING (user_id = current_user);
CREATE POLICY "Favorites own" ON favorites FOR ALL USING (user_id = current_user);
CREATE POLICY "Verifications own" ON verifications FOR INSERT WITH CHECK (user_id = current_user);
CREATE POLICY "Verifications read own" ON verifications FOR SELECT USING (user_id = current_user);

-- Messages policies (simplified for demo)
CREATE POLICY "Messages read" ON messages FOR SELECT USING (TRUE);
CREATE POLICY "Messages insert" ON messages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Chats read" ON chats FOR SELECT USING (TRUE);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE verifications;

-- TRIGGERS

-- Update hostel rating after review
CREATE OR REPLACE FUNCTION update_hostel_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hostels SET
    rating = (SELECT COALESCE(AVG(rating),0)::FLOAT FROM reviews WHERE hostel_id = NEW.hostel_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE hostel_id = NEW.hostel_id)
  WHERE id = NEW.hostel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_hostel_rating();

-- Auto-add student to university group chat on registration
CREATE OR REPLACE FUNCTION auto_join_university_chat()
RETURNS TRIGGER AS $$
DECLARE
  v_chat_id UUID;
  v_uni_name TEXT;
BEGIN
  IF NEW.university_id IS NOT NULL THEN
    SELECT id INTO v_chat_id FROM chats
    WHERE university_id = NEW.university_id AND type = 'group'
    LIMIT 1;

    IF v_chat_id IS NULL THEN
      SELECT name INTO v_uni_name FROM universities WHERE id = NEW.university_id;
      INSERT INTO chats (type, university_id, name, participants, created_by)
      VALUES ('group', NEW.university_id, v_uni_name || ' Community 🎓',
              ARRAY[NEW.id], NEW.id)
      RETURNING id INTO v_chat_id;
    ELSE
      UPDATE chats
      SET participants = array_append(participants, NEW.id)
      WHERE id = v_chat_id
        AND NOT (participants @> ARRAY[NEW.id]);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_university_set ON users;
CREATE TRIGGER on_user_university_set
  AFTER INSERT OR UPDATE OF university_id ON users
  FOR EACH ROW
  WHEN (NEW.university_id IS NOT NULL)
  EXECUTE FUNCTION auto_join_university_chat();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER hostels_updated_at BEFORE UPDATE ON hostels FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- SEED DATA
INSERT INTO universities (name, city, latitude, longitude, student_count) VALUES
  ('University of Dar es Salaam', 'Dar es Salaam', -6.7714, 39.2226, 20000),
  ('Ardhi University', 'Dar es Salaam', -6.7741, 39.2094, 5000),
  ('Muhimbili University of Health and Allied Sciences', 'Dar es Salaam', -6.8003, 39.2056, 8000),
  ('College of Engineering and Technology (CoET)', 'Dar es Salaam', -6.7700, 39.2300, 4000),
  ('St. Augustine University of Tanzania', 'Mwanza', -2.5148, 32.9010, 6000),
  ('Sokoine University of Agriculture', 'Morogoro', -6.8439, 37.6445, 7000),
  ('University of Dodoma', 'Dodoma', -6.1630, 35.7516, 15000),
  ('Nelson Mandela African Institution of Science', 'Arusha', -3.3731, 36.8260, 3000)
ON CONFLICT DO NOTHING;

INSERT INTO amenities (name, icon, category) VALUES
  ('WiFi', 'wifi', 'connectivity'),
  ('Security', 'shield-checkmark', 'safety'),
  ('CCTV', 'videocam', 'safety'),
  ('Water', 'water', 'utilities'),
  ('Parking', 'car', 'transport'),
  ('AC', 'snow', 'comfort'),
  ('Gym', 'barbell', 'leisure'),
  ('Pool', 'water-outline', 'leisure'),
  ('Kitchen', 'restaurant', 'facilities'),
  ('Cafeteria', 'cafe', 'facilities'),
  ('Furnished', 'bed', 'furnishing'),
  ('Laundry', 'shirt', 'facilities'),
  ('Study Room', 'book', 'academic')
ON CONFLICT DO NOTHING;
