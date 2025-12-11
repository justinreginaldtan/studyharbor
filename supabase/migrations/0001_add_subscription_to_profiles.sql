-- supabase/migrations/0001_add_subscription_to_profiles.sql

ALTER TABLE public.profiles
ADD COLUMN subscription_status TEXT DEFAULT 'free' NOT NULL;
