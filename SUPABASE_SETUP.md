# RoomLink — Supabase Connection & SDK 54

This covers (1) connecting the mobile app to your Supabase project and (2) the Expo SDK 54 upgrade.

---

## 1. Supabase credentials (already wired)

Credentials live in **`.env`** (not in source), read by Expo via `EXPO_PUBLIC_` variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://alqhfvsavenowchxinhf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_SBaBaeBwnzezG9Pu1SD_lA_KASLDsLK
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

> Your pasted names used `NEXT_PUBLIC_*` (that's Next.js). Expo only exposes vars prefixed
> `EXPO_PUBLIC_`, so they're renamed. `constants/Config.ts` reads these, with your values as
> fallback defaults. Change them in `.env` — you said you'd rotate the key later; just edit `.env`.

`services/supabase.ts` builds the client (AsyncStorage session storage, auto-refresh). The whole
app reads through **`services/data.ts`**, which tries Supabase first and falls back to local mock
data if the project isn't reachable or a table is empty — so the app is never blank while you set up.

## 2. Create the tables and seed rooms

In the Supabase dashboard → SQL Editor, run **in order**:

1. `supabase-schema.sql` — tables, indexes, and Row Level Security policies
   (includes `Hostels public read` and `Universities public read`).
2. `supabase-seed.sql` — 3 universities + 4 hostels so the home feed shows live data.

## 3. Verify the connection

```bash
npm run test:supabase
```

Expected once schema + seed are applied: `✅ Connected. hostels rows returned: 4`.

- **403 / auth rejected** → the publishable key is wrong/temporary, or the schema hasn't been run
  yet (so RLS denies with no policy). Replace the key and run `supabase-schema.sql`.
- **404 table not found** → run `supabase-schema.sql`.
- **empty table** → run `supabase-seed.sql`.

## 4. What's connected now

- **Home feed** (`app/(tabs)/index.tsx`) → `listHostels()` from the `hostels` table.
- **Hostel details** (`app/hostel/[id].tsx`) → `getHostel(id)`.
- **Saved** (`app/profile/saved.tsx`) → `listFavorites(userId)` / `toggleFavorite()`.
- **My bookings** (`app/profile/bookings.tsx`) → `listBookings(userId)`.
- **Checkout** (`app/payment.tsx`) → writes a `bookings` row on successful payment.

Each call degrades gracefully to mock data if Supabase is unavailable.

## ⚠️ Important caveat: Clerk auth + Supabase RLS

This app signs users in with **Clerk**, not Supabase Auth. The schema's *write* policies
(`Bookings own`, `Favorites own`, …) check the Postgres identity, which Clerk users don't have.
That means:

- **Reads work** with the publishable key (hostels/universities are public-read). ✅
- **Writes** (saving favorites, inserting bookings) **will be blocked by RLS** for Clerk users
  until you bridge identity. The data layer already treats writes as best-effort so nothing crashes.

Pick one to make writes real:
1. **Route writes through the Node backend** (in `/backend`) using the Supabase **service-role**
   key (`sb_secret_…`) — recommended; keep the secret on the server only. The payment backend
   already owns booking confirmation, so this fits naturally.
2. **Mint a Supabase JWT from Clerk** (Clerk JWT template → Supabase) and pass it to
   `createClient` so `auth.uid()` is set and the `*_own` policies match.

---

## 5. Expo SDK 54 upgrade (done in this project)

`package.json` is now on **SDK 54** (Expo ~54, React Native 0.81, React 19.1, expo-router ~6,
Reanimated v4 + react-native-worklets). Also changed:

- `babel.config.js` — removed the manual `react-native-reanimated/plugin`
  (babel-preset-expo configures it automatically in SDK 54; the manual entry breaks Reanimated v4).
- `app.json` — `newArchEnabled: true` (Reanimated v4 requires the New Architecture; it's the
  SDK 54 default), and removed the unused `expo-av` plugin (deprecated in SDK 54). The app uses
  React Native's built-in `Animated`, so nothing depended on Reanimated or expo-av.

**Finish the upgrade on your machine** (this pins every native module to the exact SDK-54 build):

```bash
rm -rf node_modules package-lock.json
npm install
npx expo install --fix      # authoritative: aligns all expo/* + RN deps to SDK 54
npx expo-doctor             # optional: flags any remaining version mismatches
npx expo start -c
```

If `expo-doctor` flags a package version, run `npx expo install <package>` to let Expo choose the
SDK-54-correct version rather than editing the number by hand.
