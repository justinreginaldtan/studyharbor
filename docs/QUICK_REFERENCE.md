# StudyHarbor Quick Reference Sheet

**Your daily command center for the 2-week sprint**

---

## 🎯 Daily Workflow (5 minutes)

### Morning Routine
```bash
1. Open VS Code to cozylands_v0.1/
2. Ask Claude: "What should I work on today?"
3. Start coding!
```

### End of Day Routine (1 minute)
```bash
/daily-log [hours]h [what you did]

Example:
/daily-log 6h completed auth setup, started database schema
```

---

## 🤖 Claude Skills (Slash Commands)

### `/daily-log` - Quick Progress Update
```bash
# Usage:
/daily-log 6h completed auth setup, tests passing

# What it does:
- Updates DAILY_LOG.md automatically
- Checks off completed tasks
- Logs hours worked
```

### `/sprint-status` - See Where You Are
```bash
# Usage:
/sprint-status

# Shows:
- Current day (X/14)
- Today's target feature
- Hours logged (today, week, total)
- What's next tomorrow
- Velocity (on track / behind / ahead)
```

### `/code-review` - Check Code Quality
```bash
# Usage:
/code-review components/AuthForm.tsx

# Checks:
- TypeScript types
- Security issues
- Design system compliance
- Performance problems
- Error handling
```

---

## 📁 Project Structure (Where Things Live)

```
cozylands_v0.1/
├── app/                          # Next.js pages
│   ├── page.tsx                  # Main room (840 lines - needs refactor)
│   ├── test-auth/page.tsx        # Auth testing page
│   └── auth/                     # Auth pages (you'll build)
│       ├── login/page.tsx
│       └── signup/page.tsx
│
├── components/                   # React components
│   ├── AvatarSprite.tsx          # Pixel art avatars
│   ├── PomodoroPanel.tsx         # Timer UI
│   └── lounge/                   # Presence, timer, identity hooks
│
├── lib/                          # Utilities & services
│   ├── auth/
│   │   └── authService.ts        # ✅ Auth functions (Day 1 DONE)
│   ├── design-tokens.ts          # Your twilight colors
│   ├── supabaseClient.ts         # Supabase connection
│   └── types.ts                  # TypeScript types
│
├── docs/                         # Documentation
│   ├── QUICK_REFERENCE.md        # 👈 This file!
│   ├── SPRINT_PLAN.md            # 2-week roadmap
│   ├── ARCHITECTURE.md           # Technical guide
│   ├── WORKFLOW_GUIDE.md         # AI workflow tips
│   └── studyharbor-spec.md         # Design vision
│
├── DAILY_LOG.md                  # 📝 Your daily progress tracker
└── .env.local                    # Supabase keys (keep secret!)
```

---

## 🔑 Environment Variables

**File:** `.env.local` (don't commit this!)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Stripe (Week 2)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring (Week 2)
NEXT_PUBLIC_SENTRY_DSN=https://...
```

**Where to find these:**
- Supabase: https://supabase.com/dashboard → Settings → API
- Stripe: https://dashboard.stripe.com/test/apikeys

---

## 🎨 Design System (Your Twilight Aesthetic)

### Colors (from `lib/design-tokens.ts`)
```typescript
// Use these in your code:
twilight.DEFAULT      // #0b1220 (dark background)
twilight.ember        // #fcd34d (yellow accent)
twilight.blush        // #f973af (pink accent)
twilight.lagoon       // #38bdf8 (blue accent)
parchment             // #fefce8 (text color)
```

### Tailwind Classes (Quick Reference)
```tsx
// Glass morphism (your signature look)
className="backdrop-blur-lounge bg-glass-surface border border-glass-border rounded-glass shadow-glass-lg"

// Buttons
className="px-4 py-2 rounded-lg bg-twilight-ember text-twilight font-medium hover:scale-105 transition-transform"

// Text
className="text-parchment"        // Primary text
className="text-text-muted"       // Secondary text
className="text-text-faint"       // Tertiary text

// Animations
className="animate-breath"        // Subtle breathing
className="animate-aurora-drift"  // Background movement
className="animate-pulse-soft"    // Soft glow pulse
```

---

## 📅 Sprint Overview (14 Days)

### Week 1: Foundation
- **Day 1:** ✅ Supabase Auth setup (DONE!)
- **Day 2:** Database schema + RLS policies
- **Day 3:** Auth UI (login/signup pages)
- **Day 4:** Protected routes + session management
- **Day 5-6:** Refactor page.tsx (840 lines → modular)
- **Day 7:** Testing infrastructure

### Week 2: Monetization + Polish
- **Day 8-9:** Stripe integration
- **Day 10:** Feature gating + billing UI
- **Day 11:** Security hardening
- **Day 12:** Analytics dashboard
- **Day 13:** Error handling + monitoring
- **Day 14:** Documentation + deployment

**Current Progress:** Day 1 ✅ (6/14 remaining in Week 1)

---

## 🐛 Common Issues & Fixes

### "Module not found" error
```bash
# Clear Next.js cache
rm -rf .next
npm install
npm run dev
```

### Supabase auth not working
```bash
# Check these:
1. Is NEXT_PUBLIC_SUPABASE_URL set in .env.local?
2. Is NEXT_PUBLIC_SUPABASE_ANON_KEY set?
3. Did you enable Email auth in Supabase dashboard?
4. Is Site URL set to http://localhost:3000?
```

### TypeScript errors
```bash
# Run type check
npm run type-check

# Most common fix: Add proper types
const user: User | null = ...
```

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or just use the new port Next.js suggests
```

---

## 💬 How to Ask Claude for Help

### ✅ Good Questions (specific)
```
"How do I add RLS policy for user profiles?"
"Getting error: [paste error]. How to fix?"
"Show me how to implement the login form"
"Review my auth code for security issues"
```

### ❌ Vague Questions (less helpful)
```
"Help with auth"
"Database not working"
"Fix my code"
```

**Pro tip:** Paste error messages! I can debug much faster.

---

## 🔥 Keyboard Shortcuts (VS Code)

```bash
# Essential shortcuts
Cmd/Ctrl + P          # Quick file open
Cmd/Ctrl + Shift + P  # Command palette
Cmd/Ctrl + `          # Toggle terminal
Cmd/Ctrl + B          # Toggle sidebar

# Markdown preview
Cmd/Ctrl + Shift + V  # Preview markdown file
Cmd/Ctrl + K V        # Side-by-side preview
```

---

## 📊 Progress Tracking

### Check Your Hours
```bash
# Quick math:
Week 1 target: 50 hours (7 days)
Week 2 target: 50 hours (7 days)
Total: 100 hours

Daily target: ~7 hours
```

### Behind Schedule?
**Don't panic!** Adjust priorities:
1. **Must-have:** Auth + Database + Refactor
2. **Should-have:** Stripe + Security
3. **Nice-to-have:** Analytics + Advanced features

**Communicate with Claude:**
```
"I'm running behind. What can I skip or simplify?"
```

---

## 🎯 Git Workflow (Simple)

### Daily Commits
```bash
# End of each day:
git add .
git commit -m "Day X: [what you built]"
git push

# Example:
git commit -m "Day 1: Supabase auth setup complete"
```

### Commit Message Format
```bash
# Good:
"Day 1: Add Supabase auth service"
"Day 2: Create database schema with RLS policies"
"Day 5: Refactor page.tsx into hooks"

# Avoid:
"Update code"
"Fix stuff"
"WIP"
```

---

## 🧪 Testing Checklist

### Before Committing Code
- [ ] Does it compile? (`npm run build`)
- [ ] Any TypeScript errors? (`npm run type-check`)
- [ ] Did you test it manually?
- [ ] Does it match the twilight design?

### Before Finishing a Day
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Committed and pushed
- [ ] Updated DAILY_LOG.md

---

## 🔗 Important Links

### Supabase
- **Dashboard:** https://supabase.com/dashboard
- **Docs:** https://supabase.com/docs
- **Auth Guide:** https://supabase.com/docs/guides/auth

### Stripe (Week 2)
- **Dashboard:** https://dashboard.stripe.com/test
- **Docs:** https://stripe.com/docs
- **Test Cards:** https://stripe.com/docs/testing

### Next.js
- **Docs:** https://nextjs.org/docs
- **App Router:** https://nextjs.org/docs/app

### Deployment
- **Vercel:** https://vercel.com/dashboard

---

## 💡 Pro Tips

### 1. Save Time with AI
```
# Instead of writing boilerplate:
"Generate a TypeScript interface for a user profile with email, name, and avatar color"

# Instead of debugging alone:
"Getting error: [paste error]. Here's my code: [paste code]"
```

### 2. Keep the Vibe
Every UI component should feel:
- ✨ **Twilight** - Dark blues, warm accents
- 🫧 **Glass** - Blurred overlays, soft borders
- 🌊 **Calm** - Subtle animations, spacious layout
- 🎨 **Minimal** - Only essential UI elements

### 3. Test As You Go
Don't wait until the end! Test after every feature:
```bash
npm run dev
# Open browser, click around, check console
```

### 4. Document Decisions
When you make a choice, note it:
```markdown
# In DAILY_LOG.md:
**Notes:**
Decided to skip Google OAuth for now - focus on email auth first.
Can add OAuth in Week 2 if time permits.
```

---

## 🆘 When You're Stuck

### 1. Try This First (5 min)
```bash
# Read error message carefully
# Google exact error text
# Check related file in VS Code
```

### 2. Ask Claude (10 min)
```
"I'm stuck on [problem]. Here's the error: [paste]
Here's my code: [paste]
What's wrong?"
```

### 3. Take a Break (15 min)
```
# Seriously, step away
# Grab water, walk around
# Come back with fresh eyes
```

### 4. Ask for Help (30 min+)
```
# Discord, Reddit, Stack Overflow
# Be specific, show code and error
```

---

## 📝 Daily Log Template (Quick Copy-Paste)

```markdown
### Day X - [Feature Name]
**Hours:** Xh
**Focus:** [What you worked on]

**Completed:**
- [x] Task 1
- [x] Task 2

**Blockers:**
None / [Issue description]

**Tomorrow:**
- [ ] Next task

**Notes:**
[Anything worth remembering]
```

---

## 🎓 Remember

### You're Building a Portfolio Piece
Every line of code is interview material:
- Write clean, readable code
- Add comments for complex logic
- Commit with good messages
- Document your decisions

### Quality > Speed
One perfect feature > three half-done features

### Ask Questions
I'm here to help! No question is too basic.

### You Got This! 🚀
You've already built a beautiful MVP. Now we're making it production-ready.

---

**Last Updated:** Day 1
**Next Review:** End of Week 1

**Quick Start Tomorrow:**
```
1. Open DAILY_LOG.md
2. Check "Tomorrow:" section from yesterday
3. Ask Claude: "Let's start Day 2"
4. Start coding!
```
