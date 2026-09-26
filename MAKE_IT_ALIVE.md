# RoomLink — Make It Alive 🚀

This build is a **complete, runnable two-sided app** (Student + Landlord) with a working
**40% service-fee payment system**, a **Node.js payment backend**, and a **web admin dashboard**.

Read this honestly: out of the box it runs end-to-end on **demo/mock data with a mock payment
provider** so you can see and test everything today. To take real users' money and store real
listings, you must complete the "Go live" steps below. Nothing here charges real money until you
switch the provider and add credentials.

---

## What's included

**Mobile app (React Native + Expo)**
- Splash → Onboarding → **Choose User Type** (Student / Landlord)
- **Student:** welcome, register (sets role), login, home, explore, map, hostel details with a
  **prominent 40% fee breakdown + "you save vs broker"**, booking flow, **payment checkout**
  (M-Pesa / Mixx by Yas / Airtel / HaloPesa), chat, profile, saved, verification
- **Landlord:** choose-type → landlord register → **dashboard, manage rooms, add room
  (photo/video upload + live fee preview), bookings (accept/reject, student contacts hidden),
  profile** — purple-themed tab bar
- Role-based routing: the splash and login send students to `(tabs)` and landlords to `(landlord)`

**Backend (`backend/`, Node.js + Express)** — the only place a payment is confirmed.
**Admin (`admin/payments.html`)** — live service-fee dashboard.

The fee lives in exactly two places and must match: `constants/Config.ts` (`SERVICE_FEE_RATE`)
and `backend/.env` (`SERVICE_FEE_RATE`).

---

## 1. Run the app (demo mode)

```bash
npm install
npx expo start
```

Scan the QR with Expo Go, or press `a` (Android) / `i` (iOS).

> Auth uses Clerk and several screens read from Supabase. The demo keys shipped in
> `constants/Config.ts` may be rate-limited or disabled — for anything real, put your own keys in
> (see step 4). The home/explore/hostel/landlord screens run on mock data and work without a backend.

## 2. Run the payment backend (mock — no real money)

```bash
cd backend
npm install
cp .env.example .env
npm start          # http://localhost:4000  (provider: mock)
```

Mock mode simulates the USSD prompt and auto-approves after ~6s, so you can watch a payment go
`pending → completed` without a gateway account.

## 3. Connect the app to the backend

In `constants/Config.ts` set `API_BASE_URL`:
- iOS simulator / web: `http://localhost:4000`
- **Real phone (Expo Go): your computer's LAN IP**, e.g. `http://192.168.1.10:4000`
  (a phone can't reach `localhost`). Find it with `ipconfig` / `ifconfig`.

Now: open a hostel → **Book** → **Pay … & Book** → pick a network, enter `0712 345 678` → **Pay**.
It flips to **Payment received** after a few seconds.

## 4. Watch payments in admin

Open `admin/payments.html` in a browser. It polls the backend and shows total fees collected,
status pills, and success rate, refreshing live.

---

## Go live (real money + real data)

### A. Pick a Tanzanian mobile-money gateway
Open an account with one that does USSD-push collections: **ClickPesa, AzamPay, ZenoPay, or Selcom**.
They cover M-Pesa, Tigo Pesa (Mixx by Yas), Airtel Money and HaloPesa through one integration.

### B. Switch the backend to the real provider
In `backend/.env`:
```
PAYMENT_PROVIDER=azampay
PUBLIC_BASE_URL=https://your-public-url        # see C
PAYMENT_WEBHOOK_SECRET=<a long random string>
AZAMPAY_BASE_URL=...        # from your dashboard
AZAMPAY_TOKEN=...           # from your dashboard
```
Then **confirm the exact endpoint path and field names** in `backend/providers/index.js` against
your provider's current docs — each gateway names fields slightly differently. Only that one file
changes per provider.

### C. Expose the webhook
The gateway must reach `PUBLIC_BASE_URL/api/payments/webhook`. In dev, tunnel with
`ngrok http 4000` (or cloudflared) and use the https URL. In your gateway dashboard, set the
callback/webhook URL to that path. The webhook is protected by `PAYMENT_WEBHOOK_SECRET`.

### D. Database
Demo uses an in-memory store. For production set `DB_HOST` etc. in `.env` and run:
```bash
mysql roomlink < backend/db/payments.sql
```
This adds the `payments` table and, when a fee completes, sets that booking to `confirmed`.
(If you keep the app's existing **Supabase** stack instead of MySQL, port `store.js` to Supabase —
see "Honest gaps" below.)

### E. Your own Clerk + Supabase keys
Replace the demo values in `constants/Config.ts` (and `app.json`) with your own Clerk publishable
key, Supabase URL/anon key, and Google Maps key. Run `supabase-schema.sql` in your Supabase project.

### F. Build for the stores
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android      # .aab / .apk
eas build --platform ios          # needs an Apple Developer account
eas submit -p android             # to Google Play
```

---

## Honest gaps before "production ready for real users"

This is a strong, real demo — not a finished production system. Be aware:

1. **Two stacks don't fully meet yet.** The app is Expo + Clerk + Supabase; the payment backend is
   Node + (optional) MySQL, matching your written spec. They talk over the payment API, but the
   rest of the app (listings, bookings, chat, verification) still runs on **mock data**. Wire those
   to Supabase (or your Node API) before real users.
2. **Landlord listings, bookings, roommate matching, and chat are demo data.** The screens and
   flows are complete; the persistence is not. Connect `services/landlordData.ts`,
   `services/mockData.ts`, and the chat send path to your database.
3. **Admin approval is shown but not enforced** (verification badges, "pending approval"). The Admin
   Portal is a separate web app you still need to build for approvals, moderation, and connecting
   students↔landlords.
4. **Payments need real-world testing** with each gateway's sandbox, plus reconciliation, refunds,
   and receipts before launch.
5. **Secrets:** move all keys out of source into environment config before publishing.

Treat this as the app skeleton + a fully working fee-payment core. The fee math, the checkout UX,
the server-side enforcement, and both user journeys are done; the remaining work is connecting the
demo screens to live data and standing up the admin portal.
