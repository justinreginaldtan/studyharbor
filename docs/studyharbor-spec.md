# StudyHarbor Design Spec

## Essence & Intent
- Dusk-lit study lounge whispering “you’re not alone.”
- Balance soft companionship and calm productivity; avatars and UI elements reassure without overwhelming.
- Safe haven: curated, kind, low-risk interactions; focus first, ambience second.

## Experience Pillars
- Warm twilight palette over deep navy base.
- Soft-glass surfaces with muted gradients and gentle shadows.
- Breathing motion language—slow pulses, parallax drifts, hover blooms.
- Encouraging, observant microcopy in short sentences.
- Spacious layouts with generous padding and calm negative space.

## Visual Language
- **Colors**: base `#0b1220`; accent glow spectrum (`#fcd34d`, `#f973af`, `#38bdf8`); supportive overlays `rgba(15,23,42,0.85)`.
- **Gradients**: layered radial fog similar to current background, diffused, with low-opacity aurora drift.
- **Typography**: Manrope hierarchy—caps for micro labels, semi-bold numerals, lighter body copy.
- **Materials**: glass panels with 12–16px radius, 1px inner stroke, blurred shadows; use Tailwind backdrop utilities.
- **Iconography**: minimal, soft glyphs or emoji sparingly.
- **Imagery**: impressionistic, low-contrast if added.

## Motion & Interaction
- Background aurora drift (20–30s cycle) for effortless movement.
- Avatars: idle sway (2–3px every 6s), hover bloom to 1.05 scale, footsteps fade within 400ms.
- Timer: conic gradient progress easing, phase transitions trigger glow pulse.
- Buttons: primary hums with 1.05 press scale and shadow bloom; ghost buttons lift 1px on hover.
- State transitions: crossfade solo/shared labels and hints within 250ms.

## Microcopy & Tone
- Voice: gentle mentor, never saccharine. Phrases like “Settling in for focus.”
- Labels: lowercase or title case; uppercase reserved for HUD badges.
- Empty states: observational (“It’s a quiet evening here.”).
- Shared mode cues: emphasize togetherness without pressure (“Two others are here with you.”).

## Sound & Feedback (Future)
- Soft chime (mallet-on-glass) at phase transitions, low volume.
- Optional ambient toggle (rain-on-parchment vibe) default off.

## Core Surfaces
- **Study Scene Canvas**: full-bleed background with parallax layers; avatars roam within central bounds.
- **Pomodoro Panel**: circular progress, stacked actions, color shift per phase.
- **HUD Cluster**: session streak, presence count, encouragement badge; responsive layout.
- **Avatar Layer**: accessible labels, consistent shadows, subtle self-glow.
- **Entry / Onboarding (future)**: cozy welcome modal with name/color pick and safety note.
- **Shared Timer Banner (future)**: ribbon with participant avatars when synced.

## State Themes
- Solo vs shared: solo is inward calm; shared adds warm particles and collective microcopy.
- Focus vs break: adjust panel hue (cooler blues for focus, warmer amber for break) while keeping base consistent.
- Presence density: low population shows negative space; higher presence adds campfire glow pulses.

## Next Steps
1. Build Tailwind foundation and design tokens.
2. Modularize scene, HUD, and panel components using this spec.
3. Iterate with motion, copy, and onboarding once baseline UI matches vision.
