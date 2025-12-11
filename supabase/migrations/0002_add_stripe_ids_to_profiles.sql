-- supabase/migrations/0002_add_stripe_ids_to_profiles.sql

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer id for billing portal and checkout reuse';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Stripe subscription id for lifecycle tracking';
