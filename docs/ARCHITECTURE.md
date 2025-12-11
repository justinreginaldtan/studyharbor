# StudyHarbor Architecture

**Status:** Transitioning from MVP → Production-Ready
**Last Updated:** [Update as you go]

---

## System Overview

StudyHarbor is a real-time collaborative Pomodoro timer application with social presence. Users appear as animated avatars in a shared "cozy study lounge" where they can see others focusing alongside them.

### Core Value Proposition
- **Accountability through presence** - Study alongside others in real-time
- **Gamified focus** - Session tracking and analytics
- **Cozy aesthetic** - Pixel art avatars, ambient music, twilight theme

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                       Browser                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Next.js 16 (App Router)                 │   │
│  │  ┌──────────────┐        ┌──────────────┐      │   │
│  │  │ React 19     │        │ Zustand      │      │   │
│  │  │ Components   │◄──────►│ State Store  │      │   │
│  │  └──────────────┘        └──────────────┘      │   │
│  │         │                        │              │   │
│  │         │                        │              │   │
│  │  ┌──────▼────────────────────────▼──────┐      │   │
│  │  │      Canvas Animation Loop           │      │   │
│  │  │  (requestAnimationFrame @ 60fps)     │      │   │
│  │  └──────────────────────────────────────┘      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼───────┐ ┌───▼───────┐ ┌──▼─────────┐
│   Supabase    │ │ Supabase  │ │   Stripe   │
│     Auth      │ │  Database │ │  Payments  │
└───────┬───────┘ └───┬───────┘ └──┬─────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │    Supabase Realtime      │
        │   (WebSocket channels)    │
        │  • Presence broadcasting  │
        │  • Timer synchronization  │
        └───────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.0.1 | React framework (App Router) |
| React | 19.2.0 | UI library |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 3.4.14 | Styling |
| Framer Motion | 12.23.24 | Animations |
| Zustand | 5.0.8 | State management |

### Backend/Services
| Service | Purpose |
|---------|---------|
| Supabase | Auth, Database, Realtime |
| Stripe | Payment processing |
| Vercel | Hosting & deployment |

### Development Tools
| Tool | Purpose |
|------|---------|
| Vitest | Unit testing |
| Playwright | E2E testing |
| ESLint | Code linting |
| Prettier | Code formatting |

---

## Data Architecture

### Current State (MVP)

#### Identity Storage (localStorage)
```typescript
// Key: "studyharbor.identity"
{
  guestId: "guest-abc123",
  displayName: "Mellow Whisper",
  color: "#FDE68A"
}
```

#### UI Preferences (Zustand + localStorage)
```typescript
// Key: "studyharbor.ui"
{
  ambientVolume: 0.5,
  focusSessionMinutes: 25,
  breakSessionMinutes: 5,
  avatarColor: "#FDE68A",
  ambientPlaying: true
}
```

### Target State (Production)

#### Database Schema

```sql
-- Users table (managed by Supabase Auth)
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) <= 40),
  avatar_color TEXT NOT NULL CHECK (avatar_color ~ '^#[0-9A-Fa-f]{6}$'),
  status_message TEXT CHECK (char_length(status_message) <= 100),
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 50 CHECK (max_participants BETWEEN 2 AND 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Focus sessions (for analytics)
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('focus', 'break')),
  duration_ms INTEGER NOT NULL CHECK (duration_ms > 0),
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- Room participants (many-to-many)
CREATE TABLE public.room_participants (
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_completed_at ON focus_sessions(completed_at);
CREATE INDEX idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);
```

#### Row Level Security Policies

```sql
-- Profiles: Users can read all, update only their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Rooms: Public rooms viewable, owners can update
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public rooms are viewable by everyone"
  ON rooms FOR SELECT
  USING (is_public = true);

CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Room owners can update their rooms"
  ON rooms FOR UPDATE
  USING (auth.uid() = owner_id);

-- Focus sessions: Users can view their own + public room sessions
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view sessions in public rooms"
  ON focus_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = focus_sessions.room_id
    AND rooms.is_public = true
  ));

CREATE POLICY "Users can insert own sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## Component Architecture

### Current Structure (MVP - Monolithic)

```
app/
  page.tsx (840 lines ⚠️)
    - Identity management
    - Supabase channel setup
    - Avatar rendering loop
    - Timer logic
    - Presence broadcasting
    - UI components
```

**Problems:**
- Difficult to test
- Hard to reason about
- Mixing concerns
- Performance bottlenecks hidden

### Target Structure (Production - Modular)

```
app/
  layout.tsx                    -- Root layout
  page.tsx                      -- Landing/marketing page

  (authenticated)/              -- Route group (requires auth)
    layout.tsx                  -- Auth guard wrapper
    dashboard/
      page.tsx                  -- User dashboard
      stats/page.tsx            -- Analytics page
      billing/page.tsx          -- Subscription management
    room/
      [roomId]/
        page.tsx                -- Room page (200 lines)

  auth/
    login/page.tsx              -- Login form
    signup/page.tsx             -- Signup form
    reset-password/page.tsx     -- Password reset

components/
  lounge/                       -- Room/lobby hooks
    usePresenceManager.ts       -- Presence hook
    useTimerSync.ts             -- Timer sync hook
    useIdentityManager.ts       -- Identity/profile sync

  PomodoroPanel.tsx             -- Timer controls (main panel)
  AvatarSprite.tsx              -- Avatar rendering

  UI/                           -- Reusable UI components
    AmbientPlayer.tsx
    Toast.tsx
    Modal.tsx
    Button.tsx
    Input.tsx

  Auth/
    AuthGuard.tsx               -- Protected route wrapper
    UpgradePrompt.tsx           -- Subscription upsell
    UserMenu.tsx                -- User dropdown

lib/
  auth/
    authService.ts              -- Auth operations
    authContext.tsx             -- Auth provider

  api/
    profiles.ts                 -- Profile API client
    rooms.ts                    -- Room API client
    sessions.ts                 -- Session API client
    stripe.ts                   -- Stripe operations

  hooks/
    useAuth.ts                  -- Auth state hook
    useProfile.ts               -- Profile data hook
    useSubscription.ts          -- Subscription hook

  state/
    uiStore.ts                  -- Global UI state (Zustand)

  utils/
    supabaseClient.ts           -- Supabase singleton
    validation.ts               -- Zod schemas
    formatting.ts               -- Date/time formatting

  types/
    database.ts                 -- Database types (generated)
    api.ts                      -- API types
    domain.ts                   -- Business logic types
```

---

## State Management Strategy

### Three-Tier State System

#### 1. Server State (Supabase)
- **Source of truth** for persistent data
- User profiles, rooms, sessions
- Managed by Supabase client with real-time subscriptions

```typescript
// Example: Fetching user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

#### 2. Global Client State (Zustand)
- UI preferences (volume, theme)
- App-wide settings
- Persisted to localStorage

```typescript
// lib/state/uiStore.ts
interface UIState {
  ambientVolume: number;
  focusSessionMinutes: number;
  breakSessionMinutes: number;
  setAmbientVolume: (volume: number) => void;
  // ...
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      ambientVolume: 0.5,
      setAmbientVolume: (volume) => set({ ambientVolume: volume }),
      // ...
    }),
    { name: 'studyharbor.ui' }
  )
);
```

#### 3. Component State (useState/useRef)
- Local UI state (modals, dropdowns)
- High-frequency updates (animation)
- Not persisted

```typescript
// Avatar position (60fps updates)
const localPositionRef = useRef({ x: 0.5, y: 0.68 });
const targetPositionRef = useRef({ x: 0.5, y: 0.68 });

// Modal visibility
const [isModalOpen, setIsModalOpen] = useState(false);
```

### When to Use Each

| State Type | Use Case | Example |
|------------|----------|---------|
| Server | Persistent, shared data | User profiles, rooms |
| Global Client | Cross-component UI prefs | Volume, theme |
| Component | Scoped UI state | Modal open/close |
| Refs | Performance-critical | Animation coordinates |

---

## Real-Time Architecture

### Supabase Realtime Channels

#### Channel: `room:{roomId}`
- **Purpose:** Synchronize presence and timer state within a room
- **Events:**
  - `presence.sync` - User joins/leaves
  - `timer:update` - Timer state changes
  - `timer:request-sync` - New user requests current state

#### Presence Tracking

```typescript
// Broadcasting position (120ms intervals)
channel.track({
  id: userId,
  color: avatarColor,
  name: displayName,
  x: localPositionRef.current.x,
  y: localPositionRef.current.y,
  updatedAt: Date.now(),
  status: statusMessage,
});
```

#### Timer Synchronization

```typescript
// Broadcasting timer state (1000ms when running)
channel.send({
  type: 'broadcast',
  event: 'timer:update',
  payload: {
    mode: 'shared',
    phase: 'focus',
    remainingMs: 1500000, // 25 minutes
    isRunning: true,
    lastUpdatedAt: Date.now(),
  },
});
```

### Conflict Resolution Strategy

**Problem:** Multiple users trying to control shared timer

**Solution:** Optimistic locking with timestamps
```typescript
function handleTimerUpdate(incomingState: TimerState) {
  const currentState = timerRef.current;

  // Only accept updates newer than our state
  if (incomingState.lastUpdatedAt > currentState.lastUpdatedAt) {
    setTimerState(incomingState);
  }
}
```

**Future Enhancement:** Leader election (oldest user in room controls timer)

---

## Authentication Flow

### Current (Guest-Only)

```
User visits app
    │
    ├─ Check localStorage for identity
    │   │
    │   ├─ Exists → Load guest session
    │   └─ Missing → Generate random guest ID
    │
    └─ Show WelcomeModal (customize name/color)
```

### Target (Auth-Enabled)

```
User visits app
    │
    ├─ Check Supabase session
    │   │
    │   ├─ Authenticated → Load user profile
    │   │   └─ Redirect to /dashboard
    │   │
    │   └─ Not authenticated
    │       │
    │       ├─ Offer "Continue as Guest"
    │       │   └─ Generate temporary identity
    │       │
    │       └─ Offer "Sign Up / Log In"
    │           │
    │           ├─ Email/Password
    │           └─ OAuth (Google)
    │
    └─ After auth → Create/load profile
```

### Session Management

```typescript
// lib/auth/authService.ts
export const authService = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (data.user) {
      // Create profile record
      await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: generateDefaultName(),
        avatar_color: generateRandomColor(),
      });
    }

    return { data, error };
  },

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signInWithGoogle() {
    return supabase.auth.signInWithOAuth({ provider: 'google' });
  },

  async signOut() {
    return supabase.auth.signOut();
  },
};
```

### Protected Routes (Middleware)

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession();

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/room/:path*'],
};
```

---

## Payment Architecture

### Pricing Tiers

| Feature | Free | Pro ($5/mo) |
|---------|------|-------------|
| Room access | 1 default room | Unlimited rooms |
| Participants per room | 10 | 50 |
| Session history | Last 7 days | Unlimited |
| Custom themes | No | Yes |
| Analytics dashboard | Basic | Advanced |
| Priority support | No | Yes |

### Stripe Integration

#### Checkout Flow

```typescript
// app/api/checkout/route.ts
export async function POST(req: Request) {
  const { userId, priceId } = await req.json();

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .single();

  let customerId = profile.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  });

  return Response.json({ url: session.url });
}
```

#### Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await supabase
        .from('profiles')
        .update({
          stripe_subscription_id: subscription.id,
          subscription_tier: 'pro',
        })
        .eq('stripe_customer_id', subscription.customer);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await supabase
        .from('profiles')
        .update({
          stripe_subscription_id: null,
          subscription_tier: 'free',
        })
        .eq('stripe_customer_id', subscription.customer);
      break;
    }
  }

  return Response.json({ received: true });
}
```

### Feature Gating

```typescript
// lib/features/featureGate.ts
export async function canCreateRoom(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (profile.subscription_tier === 'pro') return true;

  // Free users can only access default room
  const { count } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId);

  return count === 0;
}
```

---

## Performance Optimization

### Animation Strategy

**Problem:** 60fps avatar movement with React re-renders

**Solution:** requestAnimationFrame loop with refs

```typescript
// components/lounge/useAvatarRenderer.ts
export function useAvatarRenderer(
  localPositionRef: MutableRefObject<Position>,
  remoteAvatarsRef: MutableRefObject<Map<string, RemoteAvatar>>
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    function render() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      // Draw local avatar
      drawAvatar(ctx, localPositionRef.current, true);

      // Draw remote avatars
      remoteAvatarsRef.current.forEach((avatar) => {
        drawAvatar(ctx, avatar, false);
      });

      animationId = requestAnimationFrame(render);
    }

    render();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return canvasRef;
}
```

### State Update Optimization

**Problem:** Zustand re-renders on every state change

**Solution:** `useShallow` selector

```typescript
// Before (re-renders on any UI state change)
const uiState = useUIStore();

// After (only re-renders when these values change)
const { ambientVolume, setAmbientVolume } = useUIStore(
  useShallow((state) => ({
    ambientVolume: state.ambientVolume,
    setAmbientVolume: state.setAmbientVolume,
  }))
);
```

### Component Memoization

```typescript
// components/AvatarSprite.tsx
export const AvatarSprite = memo(
  AvatarSpriteComponent,
  (prev, next) => {
    // Only re-render if position or color changes
    return (
      prev.x === next.x &&
      prev.y === next.y &&
      prev.color === next.color
    );
  }
);
```

---

## Security Considerations

### Current Vulnerabilities (MVP)

1. **No authentication** - Anyone can impersonate anyone
2. **Client-side trust** - Timer state can be manipulated
3. **No rate limiting** - Susceptible to spam/DoS
4. **No input validation** - XSS risk in status messages
5. **Exposed Supabase anon key** - No RLS policies

### Hardening Plan

#### 1. Input Validation (Zod)

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z.string()
    .min(1, 'Name required')
    .max(40, 'Name too long')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Alphanumeric only'),

  avatar_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),

  status_message: z.string()
    .max(100, 'Status too long')
    .optional(),
});
```

#### 2. Rate Limiting (Upstash)

```typescript
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

// In API routes
const { success } = await ratelimit.limit(userId);
if (!success) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

#### 3. Content Moderation

```typescript
// lib/moderation/filter.ts
const BANNED_WORDS = ['spam', 'scam', /* ... */];

export function moderateContent(text: string): string {
  // Remove HTML tags (XSS prevention)
  const cleaned = text.replace(/<[^>]*>/g, '');

  // Filter profanity
  return BANNED_WORDS.reduce((acc, word) => {
    const regex = new RegExp(word, 'gi');
    return acc.replace(regex, '***');
  }, cleaned);
}
```

#### 4. CSRF Protection

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Supabase handles CSRF tokens automatically
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value; },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
      },
    }
  );

  await supabase.auth.getSession(); // Validates session

  return response;
}
```

---

## Monitoring & Observability

### Error Tracking (Sentry)

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,

  beforeSend(event, hint) {
    // Don't send network errors
    if (event.exception?.values?.[0]?.type === 'NetworkError') {
      return null;
    }

    // Redact sensitive data
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
    }

    return event;
  },
});
```

### Analytics (PostHog - optional)

```typescript
// lib/analytics/posthog.ts
import posthog from 'posthog-js';

export function initAnalytics() {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.opt_out_capturing();
        }
      },
    });
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties);
}

// Usage
trackEvent('timer_started', {
  session_type: 'focus',
  duration_minutes: 25,
});
```

---

## Deployment Architecture

### Vercel Deployment

```yaml
# vercel.json (optional - uses defaults)
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "STRIPE_WEBHOOK_SECRET": "@stripe-webhook-secret"
  }
}
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Server-side only

STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm run test

      - name: Build
        run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// __tests__/lib/auth/authService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { authService } from '@/lib/auth/authService';

describe('authService', () => {
  it('should sign up a new user', async () => {
    const { data, error } = await authService.signUp(
      'test@example.com',
      'securePassword123'
    );

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe('test@example.com');
  });

  it('should reject weak passwords', async () => {
    const { error } = await authService.signUp(
      'test@example.com',
      'weak'
    );

    expect(error).toBeDefined();
    expect(error?.message).toContain('password');
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/room.test.ts
import { test, expect } from '@playwright/test';

test('user can join a room and see others', async ({ page, context }) => {
  // First user
  await page.goto('/room/default');
  await expect(page.locator('[data-testid="avatar-self"]')).toBeVisible();

  // Second user (new context)
  const page2 = await context.newPage();
  await page2.goto('/room/default');

  // First user should see second user's avatar
  await expect(page.locator('[data-testid="avatar-remote"]')).toHaveCount(1);
});
```

### E2E Tests (Critical Paths)

```typescript
// __tests__/e2e/subscription.test.ts
test('user can upgrade to pro subscription', async ({ page }) => {
  // Sign in
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'testpass123');
  await page.click('button[type="submit"]');

  // Navigate to pricing
  await page.goto('/pricing');
  await page.click('text=Upgrade to Pro');

  // Fill Stripe test card
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
  await stripeFrame.locator('[name="cardnumber"]').fill('4242424242424242');
  await stripeFrame.locator('[name="exp-date"]').fill('12/34');
  await stripeFrame.locator('[name="cvc"]').fill('123');

  // Complete purchase
  await page.click('text=Subscribe');

  // Verify success
  await expect(page).toHaveURL(/\/dashboard\?success=true/);
  await expect(page.locator('text=Welcome to Pro')).toBeVisible();
});
```

---

## Migration Path

### Phase 1: Foundation (Week 1)
- [x] Current: Guest-only system
- [ ] Enable Supabase Auth
- [ ] Create database schema
- [ ] Implement RLS policies
- [ ] Build auth UI

### Phase 2: Refactor (Week 1-2)
- [ ] Extract hooks from page.tsx
- [ ] Create modular components
- [ ] Add error boundaries
- [ ] Write unit tests

### Phase 3: Monetization (Week 2)
- [ ] Integrate Stripe
- [ ] Implement feature gates
- [ ] Build billing UI
- [ ] Add webhook handlers

### Phase 4: Polish (Week 2)
- [ ] Add monitoring (Sentry)
- [ ] Implement rate limiting
- [ ] Write documentation
- [ ] Deploy to production

---

## Future Enhancements

### V2 Features (Post-Launch)
- [ ] Mobile apps (React Native)
- [ ] Friends system
- [ ] Direct messaging
- [ ] Custom avatar upload
- [ ] Advanced themes (dawn, night, custom)
- [ ] Spotify integration
- [ ] Leaderboards
- [ ] Achievements/badges
- [ ] Study groups (private rooms with invites)
- [ ] Screensharing (study sessions)
- [ ] Calendar integration
- [ ] Notion/Todoist sync

### Technical Debt
- [ ] Reduce page.tsx from 840 lines
- [ ] Add comprehensive error handling
- [ ] Implement retry logic
- [ ] Add loading skeletons
- [ ] Optimize bundle size
- [ ] Server-side render canvas fallback
- [ ] Add service worker (offline mode)

---

## Decision Log

### Why Next.js App Router?
- Server components reduce client bundle
- Built-in API routes for Stripe webhooks
- Middleware for auth protection
- Image optimization out-of-the-box

### Why Supabase over Firebase?
- PostgreSQL (more powerful than Firestore)
- Built-in Auth + Database + Realtime in one
- Open source, self-hostable
- Better TypeScript support

### Why Zustand over Redux?
- Smaller bundle size (3KB vs 40KB)
- Simpler API (less boilerplate)
- Built-in persistence
- Better performance (no context re-renders)

### Why Canvas over SVG for Avatars?
- 60fps animations smoother on canvas
- Better performance with many avatars
- Pixel art aesthetic fits raster graphics
- Direct pixel manipulation for effects

### Why Stripe over PayPal?
- Better developer experience
- Native subscription management
- Customer portal out-of-the-box
- Cleaner webhook system

---

## Conclusion

This architecture balances simplicity (for 2-week sprint) with professionalism (for portfolio showcase). Key principles:

1. **Start simple, scale smart** - MVP uses localStorage, production uses database
2. **Security first** - RLS policies, rate limiting, input validation
3. **Performance matters** - Canvas rendering, ref-based updates, memoization
4. **Test critical paths** - Auth, payments, real-time sync
5. **Document decisions** - Every trade-off explained

For questions or clarifications, refer to:
- `docs/SPRINT_PLAN.md` - Implementation timeline
- `docs/studyharbor-spec.md` - Product requirements
- Component READMEs (coming soon)

**Last Updated:** [Update as you make architectural changes]
