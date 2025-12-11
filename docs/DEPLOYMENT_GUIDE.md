# Deployment Guide for StudyHarbor

This guide outlines the steps to deploy the StudyHarbor application to Vercel, ensuring all necessary environment variables and integrations are correctly configured.

## Prerequisites

1.  **GitHub Account:** Your project should be hosted on GitHub.
2.  **Vercel Account:** Connect your GitHub account to Vercel.
3.  **Stripe Account:** Configured with products and prices, and a webhook endpoint.
4.  **Supabase Project:** Configured with database, authentication, and RLS.
5.  **Upstash Redis Instance:** For rate limiting.
6.  **Sentry Project:** For error monitoring.

## 1. Environment Variables Configuration

Vercel needs access to your sensitive environment variables. These should be configured in your Vercel project settings, NOT committed to your repository.

Go to your Vercel Project Settings -> "Environment Variables" and add the following:

### Supabase

*   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (e.g., `https://<your-project-ref>.supabase.co`)
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Public Anon Key
*   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (for admin operations like fetching user email in API routes, **keep this server-side only**)

### Stripe

*   `STRIPE_SECRET_KEY`: Your Stripe Secret Key (e.g., `sk_live_...` or `sk_test_...`)
*   `STRIPE_WEBHOOK_SECRET`: Your Stripe Webhook Secret (for verifying webhook events)
*   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe Publishable Key (e.g., `pk_live_...` or `pk_test_...`)
*   `NEXT_PUBLIC_URL`: The public URL where your application will be deployed (e.g., `https://your-domain.vercel.app`). This is used for Stripe redirect URLs.

### Upstash Redis (for Rate Limiting)

*   `UPSTASH_REDIS_REST_URL`: The REST URL for your Upstash Redis instance.
*   `UPSTASH_REDIS_REST_TOKEN`: The REST Token for your Upstash Redis instance.

### Sentry

*   `SENTRY_DSN`: Your Sentry DSN (Data Source Name).
*   `SENTRY_ORG`: Your Sentry organization slug.
*   `SENTRY_PROJECT`: Your Sentry project slug.
*   `NEXT_PUBLIC_SENTRY_DSN`: Same as `SENTRY_DSN` for client-side (or a client-specific DSN).

## 2. Deploying to Vercel

1.  **Link GitHub Repository:** On Vercel, import your GitHub project.
2.  **Configure Project:**
    *   **Framework Preset:** Next.js
    *   **Root Directory:** (Leave empty if your project is at the root)
    *   **Build Command:** `next build` (Vercel usually auto-detects)
    *   **Output Directory:** `build` (Vercel usually auto-detects)
3.  **Add Environment Variables:** Ensure all the environment variables listed above are added to your Vercel project settings.
4.  **Deploy:** Click "Deploy". Vercel will build and deploy your application.

## 3. Post-Deployment Steps

### Stripe Webhook Setup

1.  **Add Webhook Endpoint:** In your Stripe Dashboard, go to "Developers" -> "Webhooks".
2.  Click "Add endpoint".
3.  **Endpoint URL:** Enter `https://your-domain.vercel.app/api/webhooks/stripe` (replace `your-domain.vercel.app` with your actual deployed URL).
4.  **Events to send:** Select the following events:
    *   `checkout.session.completed`
    *   `customer.subscription.created`
    *   `customer.subscription.updated`
    *   `customer.subscription.deleted`
5.  **Get Signing Secret:** After creating the endpoint, Stripe will provide a "Signing secret" (starts with `whsec_`). Copy this and add it as `STRIPE_WEBHOOK_SECRET` to your Vercel environment variables.

### Supabase RLS Policies

Ensure your Row Level Security policies are correctly configured in your Supabase project to allow your application to read/write data securely. Our migrations (`supabase/migrations/*.sql`) handle this automatically when pushed.

### Sentry Release Monitoring

Once deployed, Sentry will automatically capture errors and performance data. Ensure your Sentry project settings match the environment variables provided. You might want to review Sentry's documentation on creating releases for better version tracking.

Your StudyHarbor application is now live and ready!
