# Billing Runbook (Stripe)

## Rotate keys
1) Stripe Dashboard → Developers → API keys → create/reveal new secret (`sk_...`) and publishable (`pk_...`) in the same mode (test or live).
2) Update envs: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (local + Vercel).
3) Redeploy. Remove/disable old keys in Stripe for safety.

## Webhook health
1) Endpoint should be `https://<prod-domain>/api/webhooks/stripe` (or local `http://localhost:3000/api/webhooks/stripe` when using Stripe CLI).
2) Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`.
3) If you recreate the endpoint, copy the new `whsec_...` into `STRIPE_WEBHOOK_SECRET` (local + Vercel).
4) Test: In Stripe → Webhooks → Send test event (matching mode) or use `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`. Check for 200 response; errors appear in Vercel logs.

## Prices (allowlist)
- Live mode: `STRIPE_PRICE_PRO_MONTH`, `STRIPE_PRICE_DONATION` (and `STRIPE_PRICE_PRO_YEAR` if added).
- Test mode: use test price IDs and test keys together. Never mix test price IDs with live keys.

## Common errors
- 500 from checkout/billing portal: missing `SUPABASE_SERVICE_ROLE_KEY` or Stripe keys.
- 400 “Price not allowed”: price ID not in the env allowlist.
- Webhook ignored: `userId` missing in metadata or signature mismatch (check `STRIPE_WEBHOOK_SECRET`).

## Safe test flow (test mode)
1) Switch to test keys, test price IDs, and test webhook endpoint/secret.
2) Run checkout; use Stripe test cards (e.g., 4242 4242 4242 4242).
3) Confirm profile updated with `stripe_customer_id`/`stripe_subscription_id` and `subscription_status` in Supabase.
