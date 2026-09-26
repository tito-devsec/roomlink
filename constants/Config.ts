// RoomLink — Central Configuration
// Replace values as needed before deploying

export const Config = {
  // ── Clerk Auth ──────────────────────────────────
  CLERK_PUBLISHABLE_KEY: 'pk_test_cXVpY2stZ3JvdXBlci0yLmNsZXJrLmFjY291bnRzLmRldiQ',
  // CLERK_SECRET_KEY is server-side only — never put in mobile app

  // ── Supabase ─────────────────────────────────────
  // Set these in a .env file (EXPO_PUBLIC_ vars are read at build time by Expo).
  // The values below are the project defaults you provided; change in .env, not here.
  SUPABASE_URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://alqhfvsavenowchxinhf.supabase.co',
  SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_SBaBaeBwnzezG9Pu1SD_lA_KASLDsLK',

  // ── Google Maps ───────────────────────────────────
  GOOGLE_MAPS_API_KEY: 'AIzaSyDLTgBBe0Pe-zzKWKt18-tVB60Lf8qEoMA',

  // ── App Info ──────────────────────────────────────
  APP_NAME: 'RoomLink',
  APP_VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@roomlink.co.tz',
  LEGAL_EMAIL: 'legal@roomlink.co.tz',
  PRIVACY_EMAIL: 'privacy@roomlink.co.tz',

  // ── Community Admin ───────────────────────────────
  // Only this Clerk user ID can be community admin
  ADMIN_CLERK_ID: 'user_admin_placeholder', // Replace with your Clerk user ID

  // ── System Admin contact ──────────────────────────
  // RoomLink no longer connects tenants to landlords directly. Every enquiry
  // about a room goes through the RoomLink system admin on this number.
  // >>> REPLACE the placeholder below with the real number before launch. <<<
  // Keep the +255 country code, no spaces (e.g. '+255700000000').
  ADMIN_CONTACT_NUMBER: '+255618238986', // RoomLink system admin (WhatsApp)
  ADMIN_CONTACT_NAME: 'RoomLink Admin',
  // Real number is set above, so contact buttons are live (WhatsApp + call).
  ADMIN_CONTACT_READY: true,

  // ── Universities ──────────────────────────────────
  // The university shown at the TOP of every university dropdown. In production
  // this is whichever university the admin marks as featured (is_featured=true
  // in the `universities` table). For now it defaults to the most popular one.
  FEATURED_UNIVERSITY_ID: '1', // University of Dar es Salaam (UDSM)

  // ── Features ──────────────────────────────────────
  ENABLE_GOOGLE_LOGIN: true,
  ENABLE_APPLE_LOGIN: true,
  ENABLE_FACEBOOK_LOGIN: true,
  MAX_UPLOAD_SIZE_MB: 10,

  // ── Payments ──────────────────────────────────────
  // Base URL of the RoomLink Node.js backend (the only place a payment is
  // confirmed). On a real device use your computer's LAN IP, not localhost.
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000',

  // Service fee charged once per booking = 40% of ONE month's rent.
  // 80,000 rent -> 32,000 fee. Change the rate here only (and in backend/.env).
  SERVICE_FEE_RATE: 0.40,

  // For the "you save vs a broker" line. Traditional brokers in TZ often charge
  // ~1 month's rent. We compare the fee against that. Set to 0 to hide.
  TYPICAL_BROKER_RATE: 1.0,

  PAYMENT_NETWORKS: [
    { id: 'mpesa', label: 'M-Pesa', color: '#E30613' },
    { id: 'tigo', label: 'Mixx by Yas (Tigo Pesa)', color: '#0033A0' },
    { id: 'airtel', label: 'Airtel Money', color: '#ED1C24' },
    { id: 'halopesa', label: 'HaloPesa', color: '#F7941E' },
  ] as const,
};

// Single source of truth for the fee. TZS has no decimals, so round.
export function computeServiceFee(monthlyRent: number): number {
  return Math.round(monthlyRent * Config.SERVICE_FEE_RATE);
}

// What a typical broker would charge, for the savings line.
export function brokerEquivalent(monthlyRent: number): number {
  return Math.round(monthlyRent * Config.TYPICAL_BROKER_RATE);
}
