# Ship Checklist (Continuous Deploy)

## Pre-flight
- Env sanity: confirm `.env.local` matches Vercel envs for the target env (Stripe keys + price IDs + webhook secret all from the same mode; Upstash URL/token present).
- Schema: ensure latest Supabase SQL is applied (notably `handle_new_user` trigger fallback). Run in Supabase SQL editor if pending.
- Secrets scope: never commit `.env.local`; set Vercel envs for Production and Preview.

## Local validation
- Install deps (once): `npm install`
- Type check: `npm run type-check`
- Build: `npm run build`
- E2E (optional): set `PLAYWRIGHT_BASE_URL`, `E2E_EMAIL`, `E2E_PASSWORD` (and `E2E_REALTIME=true` if desired), then `npm run test:e2e`

## Manual spot checks (fast)
- `/` loads for guests; `/dashboard` redirects to auth when logged out.
- Pricing page renders; “Upgrade” hits Stripe (or stubbed in tests) without errors.
- Billing portal button returns a URL (no 500).

## Stripe hygiene
- Live keys paired with live price IDs; webhook points to live URL with matching `whsec_...`.
- If testing, swap to test keys + test price IDs + test webhook endpoint.

## Ship
- Update `docs/CHANGELOG.md` with user-visible changes.
- Deploy via Vercel (auto-build) using the correct env set.

## Post-ship
- Check Sentry for new errors; fix regressions quickly.
- (Optional) Verify PostHog events (signups, timer start, checkout started) are arriving.***
