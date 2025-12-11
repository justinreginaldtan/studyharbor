# StudyHarbor Implementation Plan — 12/10/2025

## Scope & Intent
- Open `/` to guests while keeping authenticated surfaces secure.
- Harden monetization (Stripe checkout, webhook, billing portal) with safe defaults and stored Stripe identifiers.
- Enforce feature gating based on `subscription_status` and surface plan status in UI.
- Add lightweight, privacy-safe product analytics and observability beyond Sentry.
- Avoid git commands per instruction.

## Constraints & Guardrails
- No git commands.
- Stack: Next.js App Router, Supabase (auth/DB/realtime), Stripe, Upstash, Sentry.
- Keep guest flow intact; only gate true auth-required areas (dashboard/billing, API writes).
- Use stable Stripe API version (e.g., `2024-11-20`), not preview/future versions.
- Do not trust client-supplied `userId`/`priceId`; derive from session and allowlist.

## Work Plan (Ordered)
1) **Guest Access & Route Protection**
   - Update `middleware.ts` to:
     - Allow `/` and other public pages (e.g., `/pricing`, `/auth/*`, `/test-auth`, static assets) for guests.
     - Protect only `/dashboard/*`, `/billing/*`, and other authenticated areas by validating Supabase session via cookies, not just presence of any cookie.
   - Add a small server helper (e.g., `lib/auth/getServerSession.ts`) using Supabase auth helpers or server client to fetch the current user and reuse in API routes.

2) **Feature Gate Wiring**
   - Ensure `subscription_status` defaults to `'free'` and is read consistently in UI (e.g., `CornerstoneMenu`, gated CTAs).
   - Expand `lib/features/featureGate.ts` with helper(s):
     - `assertCanCreateRoom(userId, status)` that checks count of rooms vs tier limits.
     - `getPlanLabel(status)` for UI display.
   - Integrate gates in room creation UI/API (if present) and shared timer access if needed for pro-only features.

3) **Stripe Checkout Hardening**
   - Define a server-side price allowlist (e.g., `lib/payments/pricing.ts`) loaded from env: `STRIPE_PRICE_PRO_MONTH`, `STRIPE_PRICE_PRO_YEAR` (optional).
   - In `app/api/checkout/route.ts`:
     - Derive user from Supabase session (no client `userId`), fetch email via admin client once authorized.
     - Require `priceId` ∈ allowlist; reject otherwise.
     - Create/reuse `stripe_customer_id` stored on `profiles`; set metadata `{ userId }`.
     - Use stable Stripe API version and include idempotency key (e.g., `${userId}-${priceId}-${Date.now()}`) for checkout session creation.
     - Return `url` only; handle missing env/service role/Stripe keys with clear 500.

4) **Stripe Webhook Robustness**
   - In `app/api/webhooks/stripe/route.ts`:
     - Verify signature with `STRIPE_WEBHOOK_SECRET`; parse raw body.
     - Handle `checkout.session.completed`, `customer.subscription.created|updated|deleted`.
     - Require metadata `userId`; ignore if absent.
     - Normalize status via `normalizeSubscriptionStatus`; update `profiles` with `subscription_status`, `stripe_customer_id`, `stripe_subscription_id` when present.
     - Add idempotency: skip if event `id` already processed (store in memory per run or persist if adding a lightweight `stripe_events` table; if not adding a table, at least guard by comparing existing subscription id/status before writing).
     - Log to Sentry on errors; respond 200 on handled/ignored events.

5) **Billing Portal**
   - Add `app/api/billing/portal/route.ts`:
     - Require authenticated user via session helper.
     - Create/reuse Stripe customer (persist `stripe_customer_id` on `profiles`).
     - Create billing portal session with return URL to `/dashboard` (or `NEXT_PUBLIC_URL` fallback).
   - Add a “Manage billing” button/link in an authenticated UI surface (e.g., `CornerstoneMenu` or `/dashboard`) calling the new endpoint and redirecting to `url`.

6) **Analytics & Observability**
   - Add PostHog (best-practice default):
     - Env: `NEXT_PUBLIC_POSTHOG_KEY`, optional `NEXT_PUBLIC_POSTHOG_HOST`.
     - Client init wrapper (e.g., `lib/analytics/posthogClient.ts`) that no-ops when key missing or in test.
     - Identify users with hashed `user.id` and guests with hashed `guestId`; never send emails.
     - Track events: `auth_login`, `auth_signup`, `timer_start`, `timer_mode_shared`, `checkout_started`, `checkout_completed`, `billing_portal_opened`.
   - Keep Sentry; consider adding lightweight server logs around checkout/webhook success/failure.

7) **Validation & Safety**
   - Add Zod schemas for API inputs (checkout, billing portal) and enforce before Stripe calls.
   - Sanitize user-visible status messages (basic strip tags) before broadcasting.
   - Ensure env validation (throw early if required keys missing in server routes).

## Deliverables
- Updated middleware and auth session helper.
- Hardened checkout/webhook handlers with allowlisted prices and stored Stripe IDs.
- Billing portal API + UI entry point.
- Feature gate helpers and UI usage.
- PostHog client + event hooks; safety/validation additions.
