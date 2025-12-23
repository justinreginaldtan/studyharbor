## Playwright MCP Prompts

Tailored commands for `https://studyharbor.vercel.app/` to drive UI review and flow checks.

### UI Critique (desktop + mobile)
- “Open https://studyharbor.vercel.app/ at 1440px. Take full-page and above-the-fold screenshots. Critique hierarchy, spacing, CTA prominence, typography, contrast, nav clarity. Give top 3 fixes. Then at 390px: repeat, note overflows/tap targets.”

### Primary Flow (hero → CTA → form/section)
- “Load https://studyharbor.vercel.app/. Click the main hero CTA; follow the flow through any forms/sections until completion. Screenshot each step (folded). Report pass/fail per step and any console errors.”

### Baseline Capture (run once)
- “Open https://studyharbor.vercel.app/ at 1440px. Screenshot: hero, pricing/plan section, testimonials (or next key section), footer. Save as baseline `home-hero`, `home-pricing`, `home-testimonials`, `home-footer`.”

### Visual Diff (after changes)
- “Revisit https://studyharbor.vercel.app/ at 1440px. Screenshot same anchors. Compare to baselines. Note layout shifts, spacing/color changes, missing elements. Return new shots + diff notes.”

### Mobile Readiness
- “Open https://studyharbor.vercel.app/ at 390px. Scroll slowly, screenshot every viewport height. Flag overflow, clipped text, tiny tap targets, sticky header issues.”

### Accessibility Sweep
- “Open https://studyharbor.vercel.app/ at desktop. Extract DOM for interactive elements. List missing/empty alts, low-contrast text, unlabeled inputs/buttons, heading order issues. Top 5 fixes.”

### Copy Polish
- “Open https://studyharbor.vercel.app/. Extract visible text. Propose sharper H1/H2, hero subcopy, and main CTA text that match the visuals in the screenshot. Keep each suggestion concise.”

### Release Gate (quick)
- “Check https://studyharbor.vercel.app/ at 1440px and 390px: page loads, nav/anchors work, hero CTA works, no console errors. Pass/fail + folded screenshots + any errors.”
