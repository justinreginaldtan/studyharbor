# 2-Week Sprint: Portfolio-Ready StudyHarbor

**Goal:** Transform MVP into job-ready portfolio piece showcasing end-to-end technical depth

**Developer Context:**
- Senior CIS student graduating soon
- Pivoting cybersecurity → software engineering
- Strong system thinking, leverages AI for rapid development
- Need to demonstrate production-ready architecture

---

## Current State Assessment

### ✅ Strengths
- Real-time collaboration (Supabase Realtime)
- Excellent animation engineering (60fps canvas rendering)
- Strong TypeScript usage
- Polished UI/UX with custom design system
- Performance-optimized state management

### ⚠️ Critical Gaps
- **No authentication system** (guest-only)
- **No database usage** (localStorage only)
- **No payment infrastructure**
- **Single 840-line component** (needs architecture)
- No testing, monitoring, or CI/CD

---

## Sprint Strategy: DEPTH over BREADTH

**Philosophy:** One production-grade feature beats five half-implemented features

### Week 1: Authentication + Database Foundation
Demonstrate ability to integrate complex auth systems and design scalable data models

### Week 2: Architecture Refactor + Payment System
Show system design skills and payment integration patterns

---

## Week 1: Auth + Database (Days 1-7)

### Day 1: Supabase Auth Setup
**Goal:** Enable production-ready authentication

**Tasks:**
- [ ] Enable Supabase Auth in dashboard
- [ ] Configure email authentication
- [ ] Add Google OAuth provider
- [ ] Set up email templates (verification, password reset)
- [ ] Configure redirect URLs

**Deliverables:**
```typescript
// lib/auth.ts - Auth service layer
export const authService = {
  signUp(email: string, password: string),
  signIn(email: string, password: string),
  signInWithGoogle(),
  signOut(),
  resetPassword(email: string),
}
```

**Portfolio Value:**
- Shows understanding of OAuth flows
- Demonstrates service layer architecture
- Security-conscious patterns

---

### Day 2: Database Schema Design
**Goal:** Create scalable data model

**Tasks:**
- [ ] Design `profiles` table schema
- [ ] Design `focus_sessions` table schema
- [ ] Design `rooms` table schema
- [ ] Write Supabase migrations
- [ ] Implement Row Level Security policies

**Schema:**
```sql
-- profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  status_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- focus_sessions table (analytics gold)
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  room_id UUID REFERENCES rooms(id),
  session_type TEXT NOT NULL, -- 'focus' | 'break'
  duration_ms INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- room_participants (many-to-many)
CREATE TABLE room_participants (
  room_id UUID REFERENCES rooms(id),
  user_id UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);
```

**RLS Policies:**
```sql
-- Users can only update their own profiles
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can view sessions in public rooms
CREATE POLICY "View public room sessions"
  ON focus_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = focus_sessions.room_id
    AND rooms.is_public = true
  ));
```

**Portfolio Value:**
- Database design skills
- Understanding of data privacy (RLS)
- Scalable schema patterns

---

### Day 3: Migration System + Auth UI
**Goal:** Seamless upgrade path from guest system

**Tasks:**
- [ ] Create `/app/auth` route pages
- [ ] Build auth forms (login, signup, reset)
- [ ] Implement "Continue as Guest" option
- [ ] Add "Upgrade Account" flow for guests
- [ ] Migrate localStorage identity to profile

**Key Files:**
```
app/
  auth/
    login/page.tsx
    signup/page.tsx
    reset-password/page.tsx
  components/
    AuthGuard.tsx
    UpgradePrompt.tsx
```

**Migration Logic:**
```typescript
// lib/migrations/guestToUser.ts
export async function migrateGuestToUser(
  guestId: string,
  userId: string
) {
  // Copy guest preferences to user profile
  const guestData = localStorage.getItem('studyharbor.identity');
  await supabase.from('profiles').insert({
    id: userId,
    display_name: guestData.displayName,
    avatar_color: guestData.color,
  });
}
```

**Portfolio Value:**
- Thoughtful user experience (no data loss)
- Migration strategy planning
- Progressive enhancement pattern

---

### Day 4: Protected Routes + Session Management
**Goal:** Secure the application

**Tasks:**
- [ ] Create `AuthGuard` component
- [ ] Implement middleware for protected routes
- [ ] Add session refresh logic
- [ ] Build user menu/dropdown
- [ ] Add sign-out functionality

**Middleware Pattern:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}
```

**Portfolio Value:**
- Security-first mindset
- Understanding of middleware patterns
- Session management expertise

---

### Day 5-6: Refactor page.tsx (840 lines → modular)
**Goal:** Demonstrate architectural thinking

**Current Problem:**
- Monolithic 840-line component
- Mixing concerns (auth, timer, presence, rendering)
- Hard to test and maintain

**New Architecture:**
```
app/
  (authenticated)/
    room/[roomId]/page.tsx (150 lines)
  components/
    lounge/
      usePresenceManager.ts      -- Presence logic
      useTimerSync.ts            -- Timer sync logic
      useIdentityManager.ts      -- Identity/profile sync
```

**Hook Extraction:**
```typescript
// components/lounge/usePresenceManager.ts
export function usePresenceManager(roomId: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`);
    // Handle presence sync
    return () => channel.unsubscribe();
  }, [roomId]);

  return { participants, broadcastPosition, updateStatus };
}

// components/lounge/useTimerSync.ts
export function useTimerSync(roomId: string, mode: 'solo' | 'shared') {
  const [timerState, setTimerState] = useState<TimerState>();

  // Timer synchronization logic

  return { timerState, startTimer, pauseTimer, resetTimer };
}
```

**Portfolio Value:**
- Component composition skills
- Custom hook patterns
- Separation of concerns
- Testable architecture

---

### Day 7: Testing Infrastructure
**Goal:** Show testing maturity

**Tasks:**
- [ ] Install Vitest + React Testing Library
- [ ] Write tests for auth service
- [ ] Write tests for timer logic
- [ ] Write tests for presence hooks
- [ ] Set up GitHub Actions CI

**Test Coverage Targets:**
```typescript
// __tests__/lib/auth.test.ts
describe('authService', () => {
  it('should sign up user with email/password', async () => {
    const { user, error } = await authService.signUp(
      'test@example.com',
      'securePass123'
    );
    expect(user).toBeDefined();
    expect(error).toBeNull();
  });
});

// __tests__/hooks/useTimerSync.test.ts
describe('useTimerSync', () => {
  it('should sync timer state across users', async () => {
    // Test timer synchronization logic
  });
});
```

**CI Configuration:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run build
```

**Portfolio Value:**
- Testing best practices
- CI/CD setup
- Quality assurance mindset

---

## Week 2: Monetization + Polish (Days 8-14)

### Day 8-9: Stripe Integration
**Goal:** Production-ready payment system

**Tasks:**
- [ ] Set up Stripe account + test mode
- [ ] Define pricing tiers
- [ ] Create Stripe Checkout sessions
- [ ] Implement webhook handler
- [ ] Build billing portal

**Pricing Tiers:**
```typescript
// lib/pricing.ts
export const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      maxRooms: 1,
      maxParticipants: 10,
      sessionHistory: false,
      customThemes: false,
    }
  },
  pro: {
    name: 'Pro',
    price: 5, // $5/month
    stripePriceId: 'price_xxx',
    features: {
      maxRooms: Infinity,
      maxParticipants: 50,
      sessionHistory: true,
      customThemes: true,
      prioritySupport: true,
    }
  }
};
```

**Checkout Flow:**
```typescript
// app/api/checkout/route.ts
export async function POST(req: Request) {
  const { priceId, userId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: { userId },
  });

  return Response.json({ url: session.url });
}
```

**Webhook Handler:**
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
  }

  return Response.json({ received: true });
}
```

**Portfolio Value:**
- Payment integration expertise
- Webhook security (signature verification)
- Idempotency handling
- Subscription lifecycle management

---

### Day 10: Feature Gating + Billing Portal
**Goal:** Enforce subscription limits

**Tasks:**
- [ ] Create feature gate utilities
- [ ] Add upgrade prompts
- [ ] Build billing management page
- [ ] Add usage tracking

**Feature Gate Pattern:**
```typescript
// lib/features/featureGate.ts
export async function canCreateRoom(userId: string): Promise<boolean> {
  const subscription = await getSubscription(userId);
  const roomCount = await getRoomCount(userId);

  const tier = PRICING_TIERS[subscription.tier];
  return roomCount < tier.features.maxRooms;
}

// Usage in components
export function CreateRoomButton() {
  const handleClick = async () => {
    const canCreate = await canCreateRoom(user.id);
    if (!canCreate) {
      showUpgradeModal();
    } else {
      createRoom();
    }
  };
}
```

**Billing Portal:**
```typescript
// app/dashboard/billing/page.tsx
export default function BillingPage() {
  return (
    <div>
      <h1>Billing & Subscription</h1>
      <CurrentPlanCard />
      <UsageMetrics />
      <UpgradeOptions />
      <ManageSubscriptionButton /> {/* Opens Stripe portal */}
    </div>
  );
}
```

**Portfolio Value:**
- Business logic implementation
- User experience in paywalls
- SaaS patterns

---

### Day 11: Security Hardening
**Goal:** Production-ready security

**Tasks:**
- [ ] Add input validation (Zod schemas)
- [ ] Implement rate limiting
- [ ] Add content moderation for status messages
- [ ] Create error boundaries
- [ ] Sanitize user inputs (XSS prevention)

**Input Validation:**
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const profileSchema = z.object({
  display_name: z.string().min(1).max(40),
  avatar_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  status_message: z.string().max(100).optional(),
});

export const roomSchema = z.object({
  name: z.string().min(1).max(50),
  is_public: z.boolean(),
  max_participants: z.number().int().min(2).max(100),
});
```

**Rate Limiting (Upstash Redis):**
```typescript
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

// Middleware usage
const { success } = await ratelimit.limit(userId);
if (!success) throw new Error('Rate limit exceeded');
```

**Content Moderation:**
```typescript
// lib/moderation.ts
const BANNED_WORDS = ['spam', 'scam', /* ... */];

export function moderateContent(text: string): string {
  // Basic profanity filter
  const cleaned = BANNED_WORDS.reduce((acc, word) => {
    return acc.replace(new RegExp(word, 'gi'), '***');
  }, text);

  // XSS prevention
  return cleaned.replace(/[<>]/g, '');
}
```

**Portfolio Value:**
- Security awareness
- Input validation best practices
- DDoS protection understanding

---

### Day 12: Session Analytics Dashboard
**Goal:** Demonstrate data visualization skills

**Tasks:**
- [ ] Build analytics queries
- [ ] Create dashboard UI
- [ ] Add charts (Recharts or Chart.js)
- [ ] Show focus streaks
- [ ] Display personal bests

**Analytics Queries:**
```typescript
// lib/analytics/queries.ts
export async function getUserStats(userId: string) {
  const { data: sessions } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_type', 'focus')
    .order('completed_at', { ascending: false });

  return {
    totalSessions: sessions.length,
    totalMinutes: sessions.reduce((acc, s) => acc + s.duration_ms / 60000, 0),
    longestStreak: calculateStreak(sessions),
    averageSessionLength: calculateAverage(sessions),
  };
}
```

**Dashboard UI:**
```typescript
// app/dashboard/stats/page.tsx
export default function StatsPage() {
  const stats = await getUserStats(user.id);

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        title="Total Focus Time"
        value={`${stats.totalMinutes} min`}
        trend="+12% this week"
      />
      <StatCard
        title="Current Streak"
        value={`${stats.longestStreak} days`}
      />
      <LineChart data={stats.sessionsOverTime} />
      <HeatMap data={stats.sessionsByDay} />
    </div>
  );
}
```

**Portfolio Value:**
- Data aggregation skills
- Visualization techniques
- User engagement features

---

### Day 13: Error Handling + Monitoring
**Goal:** Production observability

**Tasks:**
- [ ] Add Sentry for error tracking
- [ ] Create error boundaries
- [ ] Add loading states
- [ ] Implement retry logic
- [ ] Add toast notifications for errors

**Sentry Setup:**
```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception?.values?.[0]?.type === 'NetworkError') {
      return null;
    }
    return event;
  },
});
```

**Error Boundary:**
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.reset} />;
    }
    return this.props.children;
  }
}
```

**Portfolio Value:**
- Production-grade error handling
- Observability practices
- User experience focus

---

### Day 14: Documentation + Deployment
**Goal:** Polish for recruiters

**Tasks:**
- [ ] Update README with architecture diagram
- [ ] Add CONTRIBUTING.md (optional)
- [ ] Write API documentation
- [ ] Create deployment guide
- [ ] Record demo video
- [ ] Deploy to Vercel

**README Structure:**
```markdown
# StudyHarbor - Collaborative Study Rooms

> A real-time collaborative Pomodoro timer with social presence

## Architecture Overview
[Diagram showing: Next.js → Supabase → Stripe]

## Tech Stack
- Next.js 16 (App Router) + React 19
- Supabase (Auth, Database, Realtime)
- Stripe (Subscriptions)
- Tailwind CSS + Framer Motion
- TypeScript + Zustand

## Key Features
✅ Real-time presence synchronization
✅ Authenticated user accounts
✅ Pro subscription with Stripe
✅ Session history & analytics
✅ Multi-room architecture

## Local Development
[Setup instructions]

## Architecture Decisions
[Document key technical choices]
```

**Architecture Diagram:**
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
┌──────▼──────┐  ┌──▼─────────┐
│   Next.js   │  │  Supabase  │
│  App Router │  │  Realtime  │
└──────┬──────┘  └──┬─────────┘
       │             │
       ├─────────────┤
       │             │
┌──────▼──────┐  ┌──▼─────────┐
│   Stripe    │  │  Supabase  │
│  Checkout   │  │  Database  │
└─────────────┘  └────────────┘
```

**Portfolio Value:**
- Professional documentation
- System design thinking
- Deployment experience

---

## Success Metrics

### Technical Showcase
- [ ] Real-time system architecture documented
- [ ] Authentication flow implemented end-to-end
- [ ] Payment integration with webhook security
- [ ] Database schema with RLS policies
- [ ] 80%+ test coverage on critical paths
- [ ] CI/CD pipeline functional

### Portfolio Impact
- [ ] README impresses recruiters in 30 seconds
- [ ] Live demo URL works flawlessly
- [ ] Code is interview-ready (clean, commented)
- [ ] Shows progression from MVP → production
- [ ] Demonstrates full-stack capabilities

### Resume Bullets
```
StudyHarbor - Real-Time Collaborative Study Platform
• Architected real-time presence system supporting 50+ concurrent users
  using Supabase Realtime and WebSocket channels
• Implemented secure authentication with Row Level Security policies
  and OAuth integration
• Integrated Stripe subscription billing with webhook handlers for
  payment lifecycle management
• Optimized canvas rendering pipeline to maintain 60fps animations
  with TypeScript generics and React refs
• Reduced main component complexity from 840 to <200 lines through
  custom hook extraction and component composition
```

---

## Trade-offs & Decisions

### What We're Building
- **Full auth system** - Critical for portfolio
- **Payment integration** - Shows business logic understanding
- **Refactored architecture** - Demonstrates system design

### What We're Deferring
- ❌ Mobile app (use responsive web)
- ❌ Advanced analytics (basic stats sufficient)
- ❌ Social features (friend system, DMs)
- ❌ Email notifications
- ❌ Admin dashboard

### Why This Plan Works
1. **Depth over breadth** - One perfect feature > three half-done
2. **Interview-friendly** - Can explain every decision
3. **Time-realistic** - 2 weeks is tight but achievable
4. **Portfolio-optimized** - Covers full stack, security, payments

---

## Daily Workflow Optimization

### AI-Assisted Development Pattern
1. **Planning** - Use AI for architecture decisions
2. **Implementation** - AI generates boilerplate, you review
3. **Testing** - AI writes test cases, you validate
4. **Documentation** - AI drafts, you refine

### Efficiency Tips
- Use Cursor/GitHub Copilot for boilerplate
- Claude for architectural decisions
- ChatGPT for debugging specific errors
- Don't reinvent - use libraries (Zod, Stripe SDK)

### Daily Review
- End of day: Commit + push
- Write "What I learned" note
- Update portfolio README

---

## Post-Sprint: Interview Prep

### Be Ready to Explain
1. **Real-time architecture** - How does presence sync work?
2. **Security decisions** - Why RLS? Why rate limiting?
3. **State management** - Why Zustand + refs + useState?
4. **Payment flow** - How do webhooks ensure consistency?
5. **Migration strategy** - How did you refactor 840-line component?

### Demo Script (5 minutes)
1. Show authentication flow (signup, login, OAuth)
2. Create a room, join as second user (presence sync)
3. Start shared timer (real-time sync)
4. View session history dashboard
5. Upgrade to Pro (Stripe checkout)
6. Explain architecture diagram

### GitHub Repository Setup
- Pin repository on profile
- Add topics: `nextjs`, `typescript`, `supabase`, `stripe`, `realtime`
- Write detailed PR for major refactor (shows code review skills)
- Add screenshots to README

---

## Resources & References

### Documentation
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

### Libraries to Add
```json
{
  "dependencies": {
    "@stripe/stripe-js": "^2.0.0",
    "stripe": "^14.0.0",
    "zod": "^3.22.0",
    "@upstash/ratelimit": "^1.0.0",
    "@upstash/redis": "^1.0.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

---

## Risk Mitigation

### Potential Blockers
1. **Stripe account approval** - Apply early (Day 0)
2. **Supabase auth email delays** - Test with OAuth first
3. **Scope creep** - Stick to plan, defer nice-to-haves
4. **Time underestimation** - Cut analytics if needed

### Minimum Viable Portfolio Piece
If time runs short, prioritize:
1. ✅ Authentication (must-have)
2. ✅ Refactored architecture (must-have)
3. ✅ Basic payment flow (can mock if Stripe delays)
4. ⚠️ Analytics dashboard (nice-to-have)

---

## Conclusion

This sprint transforms StudyHarbor from a beautiful demo into a production-ready SaaS application. By focusing on authentication, database design, payment integration, and architectural refactoring, you'll demonstrate the full spectrum of full-stack development skills that hiring managers seek.

**Remember:** Recruiters spend 30 seconds on your portfolio. Make sure:
- README is visually stunning
- Live demo works perfectly
- Code is interview-ready
- You can explain every technical decision

**You've got this, Justin!** 🚀

Let's build something incredible.
