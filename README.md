# RoomLink 🏠
### Premium University Hostel & Room Rental Platform — Tanzania

---

## 🚀 Quick Start

```bash
unzip roomlink-complete.zip
cd roomlink
npm install --legacy-peer-deps
npx expo start -c
```

Scan the QR code with **Expo Go** on your phone.

---

## 🗄️ Supabase Setup (Required for backend)

1. Open [supabase.com](https://supabase.com) → your project
2. Go to **SQL Editor** → paste and run `supabase-schema.sql`
3. Done — tables, triggers, RLS, and seed data are all set

---

## 🔑 Credentials (pre-configured)

| Service | Key |
|---------|-----|
| Clerk | `pk_test_cXVpY2stZ3JvdXBlci0yLmNsZXJrLmFjY291bnRzLmRldiQ` |
| Supabase URL | `https://rvmikdgjvrqlygitqyla.supabase.co` |
| Supabase Key | `sb_publishable_78TFswAc26L6DkixZz1UIA_96L4Mr9M` |
| Google Maps | `AIzaSyDLTgBBe0Pe-zzKWKt18-tVB60Lf8qEoMA` |

Update these in `constants/Config.ts`.

---

## 📱 Features

### Authentication (Clerk)
- ✅ Email + Password login/register
- ✅ Google OAuth login
- ✅ Apple OAuth login  
- ✅ Facebook OAuth login
- ✅ Forgot password → email reset code → new password
- ✅ Protected routes (auto-redirect if not signed in)

### Student Verification
- ✅ Upload student ID front + back photos
- ✅ Selfie with ID
- ✅ Admin review queue in Supabase
- ✅ Verified badge on profile
- ✅ Terms acceptance required

### Hostel Discovery
- ✅ Home feed with featured & nearby hostels
- ✅ Full-text search with live filtering
- ✅ Advanced filters: budget, gender, type, amenities, rating
- ✅ Sort by price, rating, distance
- ✅ Category browsing (hostel/private/shared/apartment)

### Map
- ✅ Google Maps satellite view
- ✅ Dark custom map style
- ✅ Price bubble markers
- ✅ Click marker → hostel detail modal (in-map preview)
- ✅ "View Full Details" navigates to hostel screen
- ✅ University markers (🎓)
- ✅ User location + radius circle
- ✅ Toggle satellite ↔ standard view

### Hostel Detail
- ✅ Image carousel with dot indicators
- ✅ Star rating breakdown
- ✅ Availability status
- ✅ Amenities grid with icons
- ✅ Map location preview
- ✅ Reviews section
- ✅ Host contact + DM button
- ✅ WhatsApp direct contact
- ✅ Booking modal with duration selector
- ✅ Booking code generation

### Community Chat
- ✅ Auto-joined to YOUR university group only on registration
- ✅ No other university groups visible
- ✅ Only messages sent AFTER joining are visible (Supabase Realtime)
- ✅ Admin-only community management (configurable via Config.ADMIN_CLERK_ID)
- ✅ Direct messages with any user
- ✅ Emoji reactions (long-press message)
- ✅ Message reply with preview
- ✅ Voice notes (hold mic)
- ✅ Image sharing (gallery + camera)
- ✅ Quick emoji picker
- ✅ Attach menu (photo, camera, file, location)
- ✅ Read receipts (✓✓)

### Profile
- ✅ Edit profile (name, phone, WhatsApp, bio, gender, university, year, budget)
- ✅ Avatar upload
- ✅ Student verification flow
- ✅ Saved hostels management
- ✅ Booking history with WhatsApp contact
- ✅ My reviews
- ✅ Notification toggle
- ✅ Sign out with confirmation
- ✅ Account deletion request

### Legal
- ✅ Full Terms of Service (13 sections)
- ✅ Full Privacy Policy (12 sections, GDPR-aligned)
- ✅ Terms agreement required at registration
- ✅ Privacy-first verification (ID photos explained)

---

## 📁 Project Structure

```
roomlink/
├── app/
│   ├── _layout.tsx             Root layout with Clerk
│   ├── index.tsx               Animated splash screen
│   ├── onboarding.tsx          4-step preference setup
│   ├── (auth)/
│   │   ├── welcome.tsx         Landing with hero image
│   │   ├── login.tsx           Login + OAuth + forgot password
│   │   ├── register.tsx        2-step register + terms
│   │   └── reset-password.tsx  Email code + new password
│   ├── (tabs)/
│   │   ├── index.tsx           Home feed
│   │   ├── explore.tsx         Search + advanced filters
│   │   ├── map.tsx             Google Maps satellite
│   │   ├── messages.tsx        Chat list (own university only)
│   │   └── profile.tsx         Full profile + settings
│   ├── hostel/[id].tsx         Hostel detail + booking
│   ├── chat/
│   │   ├── [id].tsx            Real-time chat room
│   │   └── new.tsx             New conversation
│   ├── profile/
│   │   ├── edit.tsx            Edit profile form
│   │   ├── verification.tsx    Student ID verification
│   │   ├── saved.tsx           Saved hostels
│   │   ├── bookings.tsx        Booking history
│   │   └── reviews.tsx         My reviews
│   └── legal/
│       ├── terms.tsx           Terms of Service
│       └── privacy.tsx         Privacy Policy
├── constants/
│   ├── Colors.ts               Brand colors + design tokens
│   └── Config.ts               All credentials (edit here)
├── services/
│   ├── supabase.ts             Supabase client + helpers
│   └── mockData.ts             Demo data
├── types/index.ts              TypeScript interfaces
├── assets/images/
│   └── roomlink-logo.png       App logo (used everywhere)
└── supabase-schema.sql         Complete DB schema
```

---

## 🎨 Brand

| Token | Value |
|-------|-------|
| Primary | `#00C8FF` (Cyan) |
| Secondary | `#1A3BE8` (Deep Blue) |
| Accent | `#6B3BF0` (Purple) |
| Background | `#06091A` (Dark Navy) |
| Card | `#0D1230` |
| Success | `#00E5A0` |
| Error | `#FF4D6A` |

---

## ⚠️ Notes

- **Expo Go compatible** — no eject needed
- **Reanimated 3.x only** — no v4, no worklets
- **No @gorhom/bottom-sheet** — uses native Modal
- **Mock data** included so app runs without backend
- Google Maps satellite requires real device (not simulator)

---

*RoomLink v1.0.0 · Built for Tanzanian university students · Made with ❤️*
