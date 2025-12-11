# StudyHarbor Cheat Sheet

**Keep this open while coding!**

---

## 🎯 Today's Focus

**Day 1:** ✅ Auth Setup (DONE!)
**Next:** Day 2 - Database Schema

---

## 🤖 Claude Commands

```bash
/daily-log 6h completed auth, tests passing
/sprint-status
/code-review components/AuthForm.tsx
```

---

## 🎨 Design System (Copy-Paste Ready)

### Glass Card
```tsx
<div className="backdrop-blur-lounge bg-glass-surface border border-glass-border rounded-glass shadow-glass-lg p-6">
  {/* Content */}
</div>
```

### Button (Yellow)
```tsx
<button className="px-4 py-2 rounded-lg bg-twilight-ember text-twilight font-medium hover:scale-105 transition-transform">
  Click Me
</button>
```

### Button (Blue)
```tsx
<button className="px-4 py-2 rounded-lg bg-twilight-lagoon text-twilight font-medium hover:scale-105 transition-transform">
  Click Me
</button>
```

### Input Field
```tsx
<input
  type="text"
  className="w-full px-3 py-2 rounded-lg bg-twilight-overlay border border-glass-borderWeak text-parchment placeholder-text-faint focus:border-twilight-ember focus:outline-none"
  placeholder="Enter text..."
/>
```

### Text Colors
```tsx
className="text-parchment"      // Primary text
className="text-text-muted"     // Secondary
className="text-text-faint"     // Tertiary
```

---

## 🔑 Colors (Design Tokens)

```typescript
twilight.DEFAULT  // #0b1220 (dark bg)
twilight.ember    // #fcd34d (yellow)
twilight.blush    // #f973af (pink)
twilight.lagoon   // #38bdf8 (blue)
parchment         // #fefce8 (text)
```

---

## 📂 File Locations

```bash
# Auth
lib/auth/authService.ts

# Components
components/[ComponentName].tsx

# Pages
app/[route]/page.tsx

# Design System
lib/design-tokens.ts
tailwind.config.js

# Supabase
lib/supabaseClient.ts

# Docs
docs/QUICK_REFERENCE.md  # Full guide
DAILY_LOG.md             # Your progress
```

---

## 🧪 Common Commands

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Build
npm run build

# Kill port 3000
lsof -ti:3000 | xargs kill -9

# Clear cache
rm -rf .next && npm install
```

---

## 🔗 Quick Links

- Supabase: https://supabase.com/dashboard
- Docs: [QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)
- Auth Test: http://localhost:3001/test-auth

---

## 📝 End of Day (1 min)

```bash
# 1. Use Claude command
/daily-log [hours]h [what you did]

# 2. Commit code
git add .
git commit -m "Day X: [feature]"
git push
```

---

## 🆘 Quick Fixes

**Module not found?**
```bash
rm -rf .next && npm install && npm run dev
```

**TypeScript error?**
```bash
npm run type-check
# Fix the errors shown
```

**Supabase not working?**
```bash
# Check .env.local has:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 💡 Ask Claude

**Good questions:**
- "How do I implement [feature]?"
- "Getting error: [paste error]"
- "Review this code: [paste code]"
- "What's next for Day X?"

**Use specific details!** Paste errors and code.

---

**Print this or keep it in a separate window!**
