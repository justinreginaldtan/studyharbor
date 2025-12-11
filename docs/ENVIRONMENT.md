# Environment Reference

Where to set:
- Local development: `.env.local`
- Vercel: Project Settings → Environment Variables (Production + Preview)

> Keep test and live Stripe keys/prices consistent; don’t mix modes.

## Core App
- `NEXT_PUBLIC_URL` — public base URL (used for Stripe redirects).

## Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — required for billing/webhook writes.

## Stripe
- `STRIPE_SECRET_KEY` — `sk_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — `pk_...`
- `STRIPE_WEBHOOK_SECRET` — `whsec_...` for `/api/webhooks/stripe`
- `STRIPE_PRICE_PRO_MONTH` — `price_...` (live mode)
- `STRIPE_PRICE_DONATION` — `price_...` (live mode)
- Optional: `STRIPE_PRICE_PRO_YEAR` (if you add yearly)

## Upstash (rate limiting)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Analytics
- `NEXT_PUBLIC_POSTHOG_KEY` — `phc_...`
- Optional: `NEXT_PUBLIC_POSTHOG_HOST` (only if self-hosting)

## Observability
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

## E2E / Playwright (optional)
- `PLAYWRIGHT_BASE_URL` — e.g., `http://localhost:3000`
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `E2E_REALTIME` — `true` to enable realtime spec
