# StudyHarbor

> A real-time collaborative Pomodoro timer with social presence in a cozy twilight study lounge

**Status:** ✅ Week 2 - Day 13: Feature Complete (Monetization, Analytics, Security & Monitoring)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

---

## 🧭 Navigation

**For Development:**
- **[QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** ← START HERE! Daily workflow, commands, cheat sheets
- **[DAILY_LOG.md](./DAILY_LOG.md)** - Track your progress
- **[SPRINT_PLAN.md](./docs/SPRINT_PLAN.md)** - 2-week roadmap

**For Technical Details:**
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design & patterns
- **[WORKFLOW_GUIDE.md](./docs/WORKFLOW_GUIDE.md)** - AI-assisted workflow tips
- **[studyharbor-spec.md](./docs/studyharbor-spec.md)** - Design vision

---

## 🎨 What is StudyHarbor?

A twilight-themed study space where you can:
- 🍅 Focus with Pomodoro timers (solo or shared)
- 👥 See others studying alongside you (real-time presence)
- 🎵 Listen to ambient music
- ✨ Feel cozy in a beautiful pixel art environment

**Design Philosophy:** Calm, minimal, warm. Like studying in a quiet lounge at dusk.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **Backend:** Supabase (Auth, Database, Realtime)
- **Payments:** Stripe (subscriptions)
- **State:** Zustand + localStorage
- **Testing:** Vitest, @testing-library/react, @testing-library/jest-dom, jsdom
- **Validation:** Zod
- **Rate Limiting:** Upstash Redis (@upstash/ratelimit, @upstash/redis)
- **Error Monitoring:** Sentry (@sentry/nextjs, @sentry/react)
- **Charting:** Recharts
- **Deployment:** Vercel

---

## 📁 Project Structure

```
app/                    # Next.js pages, API routes
components/             # React components (avatars, timer, UI, AuthModal, ErrorBoundary)
  └── lounge/          # Presence, timer, and identity hooks
  └── ui/              # Shadcn-like UI stubs (Card, Button)
lib/                    # Services, utilities, design tokens
  ├── analytics/       # User analytics queries
  ├── auth/            # Authentication service
  ├── features/        # Feature gating utilities
  └── supabaseClient.ts
__tests__/              # Unit and integration tests
  └── lib/auth/        # Authentication service tests
docs/                   # Documentation & guides
supabase/               # Supabase migrations
DAILY_LOG.md           # Daily progress tracking
vitest.config.ts       # Vitest configuration
sentry.*.config.ts     # Sentry configurations
next.config.mjs        # Next.js and Sentry configuration
```

---

## 🎯 Current Sprint Progress: Week 1 & 2 Completed!

We have successfully completed all core features and enhancements planned for Week 1 and Week 2 up to Day 13, transforming the MVP into a portfolio-ready SaaS application foundation.

**Key Achievements:**
-   **Secure Authentication:** Implemented email/password and Google OAuth using Supabase, with robust `authService`.
-   **Database Foundation:** Designed and deployed scalable database schema (`profiles`, `focus_sessions`, `rooms`) with Row Level Security (RLS).
-   **Modular Architecture:** Refactored the monolithic `page.tsx` into clean, reusable custom hooks (`usePresenceManager`, `useTimerSync`).
-   **Subscription Management:** Integrated Stripe for payments, including a checkout API route and a secure webhook handler for subscription lifecycle. `subscription_status` is now managed in `profiles` and reflected in the UI.
-   **Feature Gating:** Implemented `featureGate` utilities and exposed a `/pricing` page.
-   **Analytics Dashboard:** Developed a user dashboard with `getUserStats` queries and integrated Recharts for session visualization.
-   **Security Hardening:** Added Zod for input validation in UI (e.g., avatar settings) and Upstash Redis for API rate limiting on checkout.
-   **Error Handling & Monitoring:** Integrated Sentry for error tracking across client, server, and edge environments, and set up a global `ErrorBoundary`.
-   **Testing Infrastructure:** Configured Vitest and wrote the first unit tests for `authService`.

---

## 🚀 Architecture Overview

StudyHarbor is built on a modern full-stack architecture, emphasizing real-time capabilities, scalability, and developer experience.

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ Next.js (Client Components)
       ├──────────────────────────────────────────┐
       │                                          │
┌──────▼──────┐                                   │
│   Next.js   │                                   │
│  App Router │                                   │
└──────┬──────┘                                   │
       │ API Routes (Edge/Node.js)                │
       ├───────────────┬──────────────────────────┤
       │               │                          │ Edge / Serverless Functions
┌──────▼──────┐ ┌──────▼──────┐                 ┌──────▼──────┐
│  Stripe API │ │  Supabase   │                 │   Sentry    │
│ (Checkout,  │ │ (Auth, DB,  │                 │ (Error       │
│  Webhooks)  │ │  Realtime)  │                 │  Monitoring)│
└─────────────┘ └──────┬──────┘                 └─────────────┘
                       │ Postgres DB
                       └──────────────────────────┘
```

**Key Interactions:**
-   **User Authentication:** Next.js client interacts with Supabase Auth, storing user and profile data in Supabase Postgres.
-   **Real-time Presence/Timer:** Supabase Realtime handles WebSocket connections for presence synchronization and shared timer events.
-   **Payments:** Frontend initiates Stripe Checkout via Next.js API Routes. Stripe webhooks (`/api/webhooks/stripe`) update user `subscription_status` in Supabase after payment events.
-   **Analytics:** Frontend queries `lib/analytics` functions to fetch user-specific `focus_sessions` data from Supabase.
-   **Security:** Rate limiting protects API routes, Zod validates inputs, and Sentry monitors for runtime errors.

---

## 🔑 Environment Setup

Create or update your `.env.local` file with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_URL=http://localhost:3000 # Your application's public URL

# Sentry Configuration
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/exampleProjectId
SENTRY_ORG=<your-sentry-org>
SENTRY_PROJECT=<your-sentry-project>

# Upstash Redis (for Rate Limiting)
UPSTASH_REDIS_REST_URL=https://<your-redis-endpoint>
UPSTASH_REDIS_REST_TOKEN=<your-redis-token>
```

**How to get these values:**
-   **Supabase:** Dashboard → Settings → API
-   **Stripe:** Dashboard → Developers → API keys and Webhooks
-   **Sentry:** Sentry project settings
-   **Upstash:** Upstash console for your Redis instance

---

## 💻 Local Development

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Link Supabase CLI:** Authenticate and link your local project to your remote Supabase project.
    ```bash
    supabase login
    supabase link --project-ref <YOUR_SUPABASE_PROJECT_ID>
    ```
    (You can find your project ID in the Supabase Dashboard URL or Project Settings → General).
3.  **Apply Supabase Migrations:** Push any new database schema changes.
    ```bash
    supabase db push
    ```
4.  **Start dev server:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` in your browser.

---

## 🧪 Testing

```bash
# Run all tests
npm test
# Unit-only
npm run test:unit
# Playwright E2E (requires env + browsers installed)
npm run test:e2e
# Type checking
npm run type-check
```

**E2E setup:**
- Install browsers once: `npx playwright install --with-deps`
- Set env vars when running E2E:
  - `E2E_EMAIL` / `E2E_PASSWORD` – test user credentials
  - `E2E_REALTIME=true` – enable realtime two-client test (requires Supabase realtime configured)
  - Optional: `PLAYWRIGHT_BASE_URL` to point at a deployed preview

**CI toggles:**
- GitHub Actions runs unit + type-check always.
- Set `RUN_E2E=true` in CI with the above secrets to enable Playwright.

# Build
npm run build
```

---

## 📖 Documentation

**Need help?** Check [QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md) first!

**Claude Skills (slash commands):**
- `/daily-log [hours]h [notes]` - Quick progress update
- `/sprint-status` - See current progress
- `/code-review [file]` - Review code quality

---

## 🎨 Design System

**Colors:**
- Twilight dark: `#0b1220`
- Accent yellow: `#fcd34d`
- Accent pink: `#f973af`
- Accent blue: `#38bdf8`

**Key Components:**
- Glass morphism with `backdrop-blur-lounge`
- Soft animations (`animate-breath`, `animate-aurora-drift`)
- Minimal UI philosophy

See [design-tokens.ts](./lib/design-tokens.ts) for full system.

---

## 🚀 Deployment

The project is configured for deployment to Vercel. Sentry monitoring is integrated.

**Next step:** Configure environment variables in Vercel and deploy!

---

## 📝 License

Private project - Portfolio piece

---

## 🙏 Credits

**Developer:** Justin (Senior CIS student)
**Design:** StudyHarbor team
**AI Assist:** Claude (Anthropic)

---

**Last Updated:** Week 2 - Day 13
**Next Review:** End of Sprint
