# RoomLink — Docker Deployment Guide

This guide deploys the **server-side parts** of RoomLink with Docker:

| Piece | How it's deployed | In this guide? |
|---|---|---|
| **Payment backend** (`backend/`, Node/Express) | Docker container | ✅ |
| **Admin dashboard** (`admin/payments.html`) | nginx container | ✅ |
| **Payments database** (MySQL) | Docker container | ✅ |
| **Mobile app** (Expo/React Native) | **EAS build → app stores** (not Docker) | ↓ see §7 |
| **Supabase** (DB/auth/storage) | **Managed service** (you don't host it) | ↓ see §8 |

> A React Native app is not a server, so it isn't "deployed via Docker." It's compiled to
> APK/AAB/IPA and published to the stores. Docker here runs the **payment API + admin + DB**.
> Everything else the app needs (rooms, bookings, chat) is in **Supabase**, which is hosted for you.

---

## 1. What you get

```
                         ┌─────────────────────────────┐
        Internet ───►    │   web  (nginx, ports 80/443)│
                         │   • serves /  → admin        │
                         │   • proxies /api → api       │
                         └───────────────┬─────────────┘
                                         │ (internal network)
                              ┌──────────┴──────────┐
                              │  api (Node :4000)   │
                              │  payment service     │
                              └──────────┬──────────┘
                                         │
                              ┌──────────┴──────────┐
                              │  db (MySQL :3306)    │
                              │  payments storage    │
                              └─────────────────────┘
```

Three containers, one command. Defined in `docker-compose.yml`.

## 2. Prerequisites

- A Linux server (any VPS: Hetzner, DigitalOcean, AWS EC2, etc.) with **Docker** and the
  **Docker Compose plugin** installed.
- A domain name pointed at the server (needed for HTTPS and for the payment gateway's webhook).

Install Docker on Ubuntu:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
docker compose version   # confirm the plugin is present
```

## 3. Configure

From the project root:
```bash
cp .env.docker.example .env
nano .env
```
Set strong values for `DB_PASSWORD`, `DB_ROOT_PASSWORD`, and `PAYMENT_WEBHOOK_SECRET`.
Leave `PAYMENT_PROVIDER=mock` until you've tested, then switch to `azampay` (§6).
Set `PUBLIC_BASE_URL` to your domain (e.g. `https://api.roomlink.co.tz`).

## 4. Run it

```bash
docker compose up -d --build
docker compose ps           # all three should be "Up" (db healthy)
docker compose logs -f api  # watch the backend boot
```

Check it:
```bash
curl http://localhost/health
# {"ok":true,"provider":"mock"}
```
Open `http://<server-ip>/` → the admin dashboard. Create a test charge:
```bash
curl -X POST http://localhost/api/payments/create-charge \
  -H 'Content-Type: application/json' \
  -d '{"bookingId":"bk_1","hostelId":"1","monthlyRent":80000,"phone":"0712345678","network":"mpesa"}'
```
In mock mode it auto-completes after ~6s; the dashboard total updates live.

## 5. Add HTTPS (production)

The payment gateway will only call an HTTPS webhook, so TLS is required in production.
Two easy options:

**Option A — Caddy (automatic certs, simplest).** Replace the `web` service with Caddy:
```yaml
  web:
    image: caddy:2-alpine
    restart: unless-stopped
    depends_on: [api]
    ports: ["80:80", "443:443"]
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - ./admin:/srv:ro
      - caddy_data:/data
    networks: [roomlink]
```
`deploy/Caddyfile`:
```
your-domain.com {
    root * /srv
    file_server
    handle_path /api/* { reverse_proxy api:4000 }
    handle /health { reverse_proxy api:4000 }
}
```
Caddy fetches and renews Let's Encrypt certs automatically. Add `caddy_data:` under `volumes:`.

**Option B — nginx + certbot.** Keep the nginx `web` service, obtain certs with certbot on the host,
mount them into `deploy/certs/`, and uncomment the `443` block in `deploy/nginx/default.conf` and the
`443` port + certs volume in `docker-compose.yml`.

## 6. Go live with real mobile money

1. Open an account with a Tanzanian gateway (ClickPesa / AzamPay / ZenoPay / Selcom).
2. In `.env`: `PAYMENT_PROVIDER=azampay`, fill `AZAMPAY_*`, set a long `PAYMENT_WEBHOOK_SECRET`,
   and `PUBLIC_BASE_URL=https://your-domain.com`.
3. In the gateway dashboard, set the webhook/callback URL to
   `https://your-domain.com/api/payments/webhook`.
4. Confirm the exact endpoint/field names in `backend/providers/index.js` against the gateway's
   current docs (only that file changes per provider).
5. `docker compose up -d --build` to apply.

## 7. The mobile app (separate from Docker)

Build and publish with EAS, then point it at this deployed backend:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android      # .aab/.apk
eas build --platform ios          # needs Apple Developer account
eas submit -p android
```

Before building, set the app's `.env` (or EAS secrets) so it talks to your live services:
```
EXPO_PUBLIC_API_BASE_URL=https://your-domain.com
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
```
(`EXPO_PUBLIC_API_BASE_URL` is what the checkout screen calls — it must be your HTTPS domain,
not localhost, for a real device.)

## 8. Supabase

Supabase is hosted — there's nothing to Docker. Just run `supabase-schema.sql` then
`supabase-seed.sql` in its SQL editor and put the keys in the app's `.env` (see `SUPABASE_SETUP.md`).
If you specifically want to **self-host** Supabase with Docker, use their official compose at
github.com/supabase/supabase (`docker/` folder) — that's a separate stack from this one.

## 9. Operations

```bash
docker compose logs -f api          # tail backend logs
docker compose restart api          # restart after a code change (rebuild: --build)
docker compose down                 # stop (keeps the db volume)
docker compose down -v              # stop AND delete the database volume (destroys data)
```

**Database backup:**
```bash
docker compose exec db sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" roomlink' > backup-$(date +%F).sql
```

**Scale the API horizontally** (nginx load-balances the replicas automatically):
```bash
docker compose up -d --scale api=3
```

**Update to a new version:**
```bash
git pull
docker compose up -d --build
```

## 10. Honest scope

- This deploys the **payment service + admin + its DB**. It's the part that genuinely needs a server.
- The bigger NestJS/Redis/BullMQ/WebSocket architecture from your design docs is **not** built — the
  app uses Supabase directly for most data. If you move to that architecture later, each service
  would get its own Dockerfile and join this same compose/network pattern.
- Keep `.env`, `PAYMENT_WEBHOOK_SECRET`, and any `sb_secret_…` key on the server only — never in the
  mobile app or in git.
