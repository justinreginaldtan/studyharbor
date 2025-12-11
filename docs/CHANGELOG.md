# Changelog

## 2025-12-10
- Opened `/` to guests while protecting `/dashboard` and `/billing` via real Supabase session validation (middleware + server session helper).
- Hardened Stripe checkout (price allowlist, session-derived user, stable API version, persisted Stripe customer id) and webhook (status normalization, idempotent processing, customer/subscription persistence tied to metadata).
- Added billing portal API route and surfaced a “Manage Billing” button in `CornerstoneMenu` with plan label normalization.
- Sanitized shared status messages in presence broadcasts.
- Added PostHog analytics wiring (hashed identifiers) and timer/billing event tracking.
- Added feature gate helpers for plan labels and room limits; added Supabase migration for Stripe IDs on profiles.
- Centralized Stripe helpers (client, return URLs, customer creation) and env helpers; deduped checkout/billing logic.
- Added analytics event helper wrapper for consistent tracking calls.
