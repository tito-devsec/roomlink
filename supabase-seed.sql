-- RoomLink — seed data
-- Run AFTER supabase-schema.sql, in the Supabase SQL Editor.
-- Gives the app real rows to read so the home feed shows live data.

-- Universities ------------------------------------------------------------
INSERT INTO universities (id, name, city, latitude, longitude, student_count) VALUES
  ('11111111-1111-1111-1111-111111111111', 'University of Dar es Salaam', 'Dar es Salaam', -6.7790, 39.2026, 40000),
  ('22222222-2222-2222-2222-222222222222', 'Ardhi University',            'Dar es Salaam', -6.7700, 39.2200, 9000),
  ('33333333-3333-3333-3333-333333333333', 'Dar es Salaam Institute of Technology', 'Dar es Salaam', -6.8120, 39.2800, 12000)
ON CONFLICT (id) DO NOTHING;

-- Hostels (owner_id left NULL; attach to a real landlord later) ------------
INSERT INTO hostels
  (id, owner_id, name, description, address, city, latitude, longitude,
   price_per_month, type, gender_preference, university_id, images, amenities,
   available_rooms, total_rooms, rating, review_count, is_verified, whatsapp, is_active)
VALUES
  ('aaaaaaa1-0000-0000-0000-000000000001', NULL,
   'Blue Horizon Hostel',
   'Modern student hostel with premium amenities, high-speed WiFi, and a vibrant community, 5 minutes from the UDSM main gate. 24/7 security and CCTV.',
   'Mlimani Road, Ubungo', 'Dar es Salaam', -6.7750, 39.2280,
   180000, 'hostel', 'mixed', '11111111-1111-1111-1111-111111111111',
   ARRAY['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
         'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
         'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'],
   ARRAY['WiFi','Security','Water','Parking','Study Room','Laundry'],
   8, 20, 4.7, 124, TRUE, '+255712345678', TRUE),

  ('aaaaaaa1-0000-0000-0000-000000000002', NULL,
   'Campus View Residence',
   'Premium fully-furnished rooms with campus views. All-inclusive pricing covers water, electricity, high-speed WiFi, and gym access.',
   'University Road, Kinondoni', 'Dar es Salaam', -6.7680, 39.2200,
   250000, 'private_room', 'mixed', '11111111-1111-1111-1111-111111111111',
   ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
         'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80'],
   ARRAY['WiFi','Water','Electricity','Furnished','Gym'],
   5, 12, 4.8, 98, TRUE, '+255713000000', TRUE),

  ('aaaaaaa1-0000-0000-0000-000000000003', NULL,
   'Mlimani Shared Rooms',
   'Affordable shared rooms for students who want community and low cost. Walking distance to ARU.',
   'Survey Area, Ardhi', 'Dar es Salaam', -6.7720, 39.2190,
   95000, 'shared_room', 'female', '22222222-2222-2222-2222-222222222222',
   ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'],
   ARRAY['WiFi','Water','Security'],
   10, 24, 4.4, 41, FALSE, '+255714000000', TRUE),

  ('aaaaaaa1-0000-0000-0000-000000000004', NULL,
   'Sinza Modern Apartments',
   'Self-contained apartments ideal for postgraduate students. Quiet, secure, fully furnished.',
   'Sinza Madukani', 'Dar es Salaam', -6.7800, 39.2400,
   320000, 'apartment', 'mixed', '33333333-3333-3333-3333-333333333333',
   ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'],
   ARRAY['WiFi','Water','Electricity','Furnished','Private Bathroom','Kitchen'],
   3, 8, 4.9, 67, TRUE, '+255715000000', TRUE)
ON CONFLICT (id) DO NOTHING;
