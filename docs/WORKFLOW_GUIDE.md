# AI-Assisted Development Workflow Guide

**For:** Justin's rapid development style
**Goal:** Maximum velocity without sacrificing quality

---

## Your Development Profile

**Strengths:**
- System thinking and architecture
- Meta-prompting and AI leverage
- Rapid prototyping
- User experience focus

**Growth Areas:**
- Implementation syntax/details
- Security best practices
- Testing discipline
- Documentation habits

**Optimal Strategy:** AI handles boilerplate, you handle architecture

---

## Daily Development Loop

### Morning (2-3 hours)

**1. Review Yesterday's Work (10 min)**
```bash
git diff HEAD~1  # See what you built
```
- Does it still make sense?
- Any bugs noticed overnight?
- Update todo list for today

**2. Set Daily Goal (5 min)**
Use this prompt with Claude:
```
Today I want to: [specific feature]

Context:
- Current state: [what works]
- Blockers: [if any]
- Definition of done: [specific outcome]

Help me break this into 2-3 hour chunks.
```

**3. Deep Work Session (90 min)**
- Implement ONE feature completely
- AI generates code, you review line-by-line
- Test immediately (don't defer)
- Commit when feature works

**4. Break (15 min)**
- Step away from screen
- Think about next steps
- Let AI tasks run in background

### Afternoon (2-3 hours)

**5. Second Deep Work Session (90 min)**
- Either continue feature or refactor
- Focus on polish and error handling
- Write at least one test

**6. Documentation (30 min)**
- Update README if user-facing changed
- Add comments to complex logic
- Update todo list for tomorrow

**7. Commit + Push (15 min)**
```bash
git add .
git commit -m "descriptive message"
git push
```

---

## AI Prompting Strategies

### For Architecture Decisions

**Template:**
```
I need to decide between [Option A] and [Option B] for [feature].

Context:
- User count: [scale expectations]
- Timeline: [2 weeks]
- Skills: [strong on X, weak on Y]

Trade-offs I care about:
1. Development speed
2. Portfolio showcase value
3. Maintainability

Which should I choose and why?
```

### For Implementation

**Template:**
```
Implement [specific feature] in [language/framework].

Requirements:
- Must handle [edge case 1]
- Must handle [edge case 2]
- Should follow [pattern/style]

File structure:
[paste current structure]

Existing code:
[paste relevant snippet]

Generate:
1. The implementation
2. TypeScript types
3. Unit test
4. Usage example
```

### For Debugging

**Template:**
```
I'm getting [error message].

What I tried:
1. [attempt 1]
2. [attempt 2]

Code:
[paste minimal reproduction]

Environment:
- Next.js 16
- React 19
- [other relevant details]

What's wrong and how do I fix it?
```

### For Refactoring

**Template:**
```
This file is [lines] lines and does too much.

Current code:
[paste file]

Break it into:
- [concern 1]
- [concern 2]
- [concern 3]

Show me the new file structure and implementation.
```

---

## Workflow Optimizations

### Use AI for Boilerplate

**Don't type these yourself:**
- TypeScript interfaces
- Zod validation schemas
- Database migrations
- API route boilerplate
- Test skeletons
- Error boundaries

**Prompt:**
```
Generate [item] for [feature] following [pattern].
```

### Review AI Code Critically

**Always check:**
- [ ] Are edge cases handled?
- [ ] Is error handling present?
- [ ] Are types correct?
- [ ] Does it follow project conventions?
- [ ] Is it secure? (no injection risks)

**Red flags:**
- Hard-coded credentials
- No input validation
- Unhandled promises
- Missing error messages
- `any` types

### Test as You Go

**Don't defer testing to the end.**

After implementing each feature:
```bash
# Unit test
npm run test [file]

# Manual test in browser
npm run dev

# Type check
npm run type-check
```

---

## When to Use Which AI Tool

### Claude (You're here!)
**Best for:**
- Architecture decisions
- Code review
- Debugging complex issues
- Planning and documentation
- Refactoring large files

**Prompt style:** Conversational, provide context

### Cursor/Copilot
**Best for:**
- Writing repetitive code
- Completing functions
- Generating tests
- Refactoring small blocks

**Prompt style:** Code comments, inline

### ChatGPT
**Best for:**
- Quick syntax questions
- Library API lookups
- Explaining error messages
- General programming questions

**Prompt style:** Direct, specific

---

## Common Pitfalls & Solutions

### Pitfall: "Works on my machine" syndrome
**Solution:** Test in incognito, different browser
```bash
# Clear all caches
rm -rf .next node_modules
npm install
npm run dev
```

### Pitfall: Scope creep mid-feature
**Solution:** Write it down, defer to later
```markdown
## Future Enhancements
- [ ] Cool idea that came up
```

### Pitfall: Copy-pasting without understanding
**Solution:** Ask AI to explain first
```
Before I use this code, explain:
1. What does [line] do?
2. Why is [pattern] used here?
3. What could go wrong?
```

### Pitfall: Committing broken code
**Solution:** Pre-commit checklist
```bash
# Always run before commit
npm run build      # Must succeed
npm run type-check # Must pass
npm run test       # Must pass
```

### Pitfall: No error handling
**Solution:** Add try/catch template
```typescript
try {
  // Your code
} catch (error) {
  console.error('Context:', error);
  Sentry.captureException(error);
  toast.error('User-friendly message');
}
```

---

## Speed-Running Features

### Template: New Database Table

**Prompt:**
```
Create a Supabase migration for [table_name] with:
- id (UUID, primary key)
- [field1] (type)
- [field2] (type)
- timestamps

Include:
- RLS policy for [access pattern]
- TypeScript types
- API client functions (CRUD)
```

### Template: New API Route

**Prompt:**
```
Create a Next.js API route at /api/[route] that:
- Accepts [HTTP method]
- Validates input with Zod
- Calls Supabase to [action]
- Returns [response shape]
- Handles errors gracefully
```

### Template: New React Component

**Prompt:**
```
Create a [ComponentName] component that:
- Accepts props: [list]
- Renders [UI description]
- Uses Tailwind with [design system tokens]
- Handles [user interaction]
- Is fully typed with TypeScript
```

---

## 2-Week Sprint Time Management

### Week 1: Foundation (50 hours)

| Day | Hours | Focus |
|-----|-------|-------|
| Day 1 | 6h | Supabase auth setup |
| Day 2 | 6h | Database schema + RLS |
| Day 3 | 8h | Auth UI + migration logic |
| Day 4 | 8h | Protected routes + session |
| Day 5 | 8h | Refactor page.tsx (part 1) |
| Day 6 | 8h | Refactor page.tsx (part 2) |
| Day 7 | 6h | Testing infrastructure |

**Daily Deliverable:** One complete feature (commit + push)

### Week 2: Monetization + Polish (50 hours)

| Day | Hours | Focus |
|-----|-------|-------|
| Day 8 | 8h | Stripe setup + checkout |
| Day 9 | 8h | Webhook handler + billing |
| Day 10 | 8h | Feature gating + upgrade UX |
| Day 11 | 8h | Security hardening |
| Day 12 | 8h | Analytics dashboard |
| Day 13 | 6h | Error handling + monitoring |
| Day 14 | 4h | Documentation + deployment |

**Weekend Buffer:** If behind, use Sunday to catch up

---

## Portfolio Optimization

### What Recruiters Look For (30-second scan)

**1. README** (10 seconds)
- [ ] Screenshots/GIF above the fold
- [ ] Tech stack badges
- [ ] One-sentence description
- [ ] Live demo link

**2. Code Quality** (10 seconds)
- [ ] TypeScript throughout
- [ ] Consistent formatting
- [ ] Meaningful commit messages
- [ ] Tests visible

**3. Complexity** (10 seconds)
- [ ] Real-time features
- [ ] Auth system
- [ ] Payment integration
- [ ] Database design

### README Template

```markdown
# StudyHarbor

> Real-time collaborative Pomodoro timer with social presence

[Demo GIF]

🔗 [Live Demo](https://studyharbor.vercel.app) | 📖 [Docs](./docs)

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Supabase](https://img.shields.io/badge/Supabase-green)
![Stripe](https://img.shields.io/badge/Stripe-purple)

## Features

✅ **Real-time presence** - See who's focusing alongside you
✅ **Authenticated accounts** - Secure sign-up with OAuth
✅ **Pro subscriptions** - Stripe-powered billing
✅ **Session analytics** - Track your focus streaks
✅ **Multi-room support** - Create custom study spaces

## Architecture Highlights

- 🚀 **60fps canvas animations** using requestAnimationFrame
- 🔒 **Row Level Security** for data isolation
- 📡 **WebSocket presence** via Supabase Realtime
- 💳 **Webhook-driven billing** for subscription sync

## Local Development

\`\`\`bash
npm install
cp .env.example .env.local
# Add your Supabase/Stripe keys
npm run dev
\`\`\`

## Architecture

[Diagram]

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for details.

## What I Learned

- Implementing OAuth flows with PKCE
- Designing RLS policies for multi-tenant data
- Handling Stripe webhooks idempotently
- Optimizing React rendering for 60fps animations
- Managing real-time state synchronization

## Author

**Justin** - Senior CIS Student
- [LinkedIn](...)
- [Portfolio](...)
```

---

## Interview Prep Script

### Practice explaining each feature:

**Real-Time Presence**
> "I implemented presence tracking using Supabase Realtime channels. Each user broadcasts their position every 120ms, and I use refs to avoid React re-renders at 60fps. The synchronization uses timestamp-based conflict resolution to handle race conditions."

**Authentication**
> "I integrated Supabase Auth with both email/password and Google OAuth. The system uses Row Level Security policies to ensure users can only access their own data. Guests can upgrade seamlessly without losing their session history."

**Payment Integration**
> "I implemented Stripe Checkout for subscriptions with webhook handlers that sync the subscription status to our database. Feature gating is enforced server-side using RLS policies that check the user's tier."

**Architecture**
> "I refactored the initial 840-line monolith into a modular hook-based architecture. Each concern—presence, timer sync, rendering—has its own custom hook, making the codebase testable and maintainable."

---

## Daily Standup (with yourself)

Every morning, answer:

1. **What did I complete yesterday?**
   - [ ] Feature X is done
   - [ ] Bug Y is fixed

2. **What am I working on today?**
   - [ ] Feature Z (6 hours)

3. **What's blocking me?**
   - Stripe account approval?
   - Unclear requirements?
   - Technical blocker?

**Write this down** (use `DAILY_LOG.md`)

---

## Productivity Hacks

### Focus Sessions (Pomodoro)
Use your own app!
- 50 min focus / 10 min break
- 4 sessions = 1 feature

### Avoid Context Switching
- Close Slack/Discord during deep work
- Batch email/messages (check 2x/day)
- Use Do Not Disturb mode

### Leverage Peak Hours
- Morning: Hard problems (architecture, debugging)
- Afternoon: Easier tasks (styling, docs)
- Evening: Reviews and planning

### Energy Management
- Sleep 7-8 hours (non-negotiable)
- Exercise before coding (20 min walk)
- Eat before hunger (keep snacks)
- Hydrate constantly (water bottle)

---

## When You're Stuck

### Debugging Process

**1. Isolate the problem (10 min)**
- Minimal reproduction
- What changed?
- Can I reproduce?

**2. Read the error (5 min)**
- Google exact error message
- Check GitHub issues
- Read docs for the API

**3. Ask AI (15 min)**
```
I'm stuck on [problem].

Error:
[paste error]

Code:
[paste minimal snippet]

Expected:
[what should happen]

Actual:
[what's happening]

What's wrong?
```

**4. Take a break (15 min)**
- Step away
- Rubber duck it
- Come back fresh

**5. Ask for help (30 min)**
- Discord/Slack
- Stack Overflow
- GitHub Discussions

**Max time stuck:** 1 hour before asking humans

---

## Measuring Progress

### Daily Metrics

Track in `DAILY_LOG.md`:
```markdown
## Day 1

Hours: 6
Features completed:
- [x] Supabase auth setup
- [x] Login/signup UI

Blockers:
- None

Tomorrow:
- [ ] Database migrations
- [ ] RLS policies
```

### Weekly Review

Every Sunday:
```markdown
## Week 1 Retrospective

Completed:
- [x] Auth system
- [x] Database schema

Learned:
- RLS policies are powerful
- Zod makes validation easy

Struggles:
- Stripe account approval delayed
- Refactoring took longer than expected

Adjustments:
- Mock Stripe until approved
- Allocate more time for refactoring
```

---

## Accountability

### Share Progress Publicly

- Tweet daily updates (build in public)
- Post screenshots on LinkedIn
- Update GitHub README daily

**Template Tweet:**
```
Day [X] building StudyHarbor 🚀

Shipped today:
✅ [feature]
✅ [feature]

Tomorrow:
🔲 [next feature]

#buildinpublic #webdev
```

### Find an Accountability Buddy

- Daily check-ins (5 min)
- Share wins and blockers
- Review each other's code

---

## Resources Bookmarks

### Quick References

**Next.js**
- [App Router Docs](https://nextjs.org/docs/app)
- [Middleware Guide](https://nextjs.org/docs/app/building-your-application/routing/middleware)

**Supabase**
- [Auth Guide](https://supabase.com/docs/guides/auth)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

**Stripe**
- [Checkout Guide](https://stripe.com/docs/checkout/quickstart)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Test Cards](https://stripe.com/docs/testing)

**TypeScript**
- [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Cheat Sheets](https://www.typescriptlang.org/cheatsheets)

**Testing**
- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## Conclusion

**Remember:**
- AI is your pair programmer, not your replacement
- Review every line of generated code
- Test early and often
- Document as you go
- Commit small and frequently

**You've got this!** Build something amazing.

For questions, check:
- `SPRINT_PLAN.md` - What to build
- `ARCHITECTURE.md` - How it works
- This file - How to work

Now go build! 🚀
