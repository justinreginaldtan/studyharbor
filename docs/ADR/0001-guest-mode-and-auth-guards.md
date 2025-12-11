# ADR 0001: Guest Mode and Auth Guards
- Status: Accepted
- Date: 2025-12-10
- Owner: StudyHarbor

## Context
- Product wants `/` open to guests for low-friction onboarding while keeping authenticated areas secure.
- Supabase auth + middleware already existed; guest access was blocked by auth-only middleware.
- No dedicated marketing site; the app surface doubles as landing.

## Decision
- Allow guest access to `/` and other public pages (e.g., `/pricing`, static assets).
- Protect authenticated areas (`/dashboard`, `/billing`, API writes) via middleware + server-side Supabase session validation (cookie-based, not header-only).
- Keep guest identity ephemeral and client-side; never require email for guests.
- Keep a single surface (no separate marketing page) until growth needs justify split routing.

## Consequences
- ✅ Lower friction for first-touch users; easy live demo.
- ✅ Auth-required areas remain gated; less risk of data leakage.
- ❌ Guests won’t have durable state across devices; acceptable for now.
- Future: if growth requires marketing/SEO, introduce a separate marketing route or site and keep app at `/app` or similar.
