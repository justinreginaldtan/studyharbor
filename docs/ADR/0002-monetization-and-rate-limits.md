# ADR 0002: Stripe Monetization with Allowlisted Prices and Rate Limiting
- Status: Accepted
- Date: 2025-12-10
- Owner: StudyHarbor

## Context
- Need subscription checkout + donations with minimal risk.
- Stripe is the payment processor; Supabase stores profile/billing fields.
- Prevent abuse/spam of checkout/billing endpoints.

## Decision
- Use Stripe Checkout and Billing Portal with a server-side price allowlist (`STRIPE_PRICE_PRO_MONTH`, optional yearly, `STRIPE_PRICE_DONATION`).
- Derive user from Supabase session; store/reuse `stripe_customer_id` on `profiles`; set metadata `{ userId }` on Stripe objects.
- Handle lifecycle via webhook (`checkout.session.completed`, `customer.subscription.*`) with signature verification (`STRIPE_WEBHOOK_SECRET`) and status normalization.
- Rate limit checkout and billing portal routes via Upstash Redis (`@upstash/ratelimit` + REST URL/token).

## Consequences
- ✅ Reduces risk of arbitrary price IDs and spoofed users.
- ✅ Rate limiting curbs abuse and accidental floods.
- ✅ Webhook-driven state keeps `subscription_status` in Supabase authoritative.
- ❌ Dependency on Upstash credentials; without them, endpoints would fail (mitigated via documented env requirements).
- Future: add cosmetic/product SKUs via the same allowlist pattern; consider persisting webhook idempotency state if volume grows.
