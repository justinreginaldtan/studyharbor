/**
 * StudyHarbor Design Tokens
 *
 * Central source of truth for all design values.
 * Extracted from globals.css and tailwind.config.js
 *
 * Usage:
 * import { TOKENS } from '@/lib/design-tokens';
 * <div className={TOKENS.spacing.md} style={{ color: TOKENS.colors.twilight.ember }}>
 */

export const TOKENS = {
  /**
   * Spacing scale
   * Use these instead of arbitrary values (e.g., 'px-4' instead of 'px-[16px]')
   */
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },

  /**
   * Typography
   * Font sizes, line heights, letter spacing
   */
  typography: {
    // Font sizes
    fontSize: {
      xs: '0.65rem',      // 10.4px - labels, metadata
      sm: '0.75rem',      // 12px - body small
      base: '0.875rem',   // 14px - body
      md: '1rem',         // 16px - body emphasis
      lg: '1.125rem',     // 18px - subheadings
      xl: '1.25rem',      // 20px - headings
      '2xl': '1.5rem',    // 24px - large headings
      '3xl': '2rem',      // 32px - hero text
    },

    // Line heights
    lineHeight: {
      tight: 1.25,        // Default body
      relaxed: 1.6,       // Comfortable reading
      loose: 1.8,         // Maximum readability
    },

    // Letter spacing
    letterSpacing: {
      tight: '0.01em',
      normal: '0.02em',
      wide: '0.06em',
      wider: '0.18em',
      widest: '0.35em',   // ALL CAPS labels
    },

    // Font families
    fontFamily: {
      sans: 'var(--font-sans, "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif)',
    },
  },

  /**
   * Colors
   * Organized by theme and purpose
   */
  colors: {
    // Twilight theme (default)
    twilight: {
      background: '#0b1220',
      overlay: 'rgba(15,23,42,0.85)',
      veil: 'rgba(15,23,42,0.72)',
      ember: '#fcd34d',        // Primary accent (yellow)
      blush: '#f973af',        // Secondary accent (pink)
      lagoon: '#38bdf8',       // Tertiary accent (blue)
    },

    // Dawn theme (light)
    dawn: {
      background: '#f8ede1',
      backgroundAlt: '#f7d4c1',
      overlay: 'rgba(255, 249, 241, 0.82)',
      surface: 'rgba(255, 255, 255, 0.55)',
      border: 'rgba(114, 63, 21, 0.25)',
      textPrimary: 'rgba(63, 35, 21, 0.92)',
      textMuted: 'rgba(115, 71, 49, 0.7)',
    },

    // Night theme (dark blue)
    night: {
      background: '#050716',
      backgroundAlt: '#0e1024',
      overlay: 'rgba(5, 7, 22, 0.85)',
      surface: 'rgba(9, 12, 33, 0.58)',
      border: 'rgba(142, 165, 255, 0.35)',
      textPrimary: 'rgba(230, 239, 255, 0.96)',
      textMuted: 'rgba(176, 190, 228, 0.75)',
    },

    // Common colors (theme-agnostic)
    parchment: '#fefce8',      // Warm off-white text

    // Glass morphism
    glass: {
      surface: 'rgba(0, 0, 0, 0.45)',
      surfaceLight: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      borderStrong: 'rgba(255, 255, 255, 0.15)',
      borderWeak: 'rgba(255, 255, 255, 0.05)',
    },

    // Text colors
    text: {
      primary: 'rgba(248, 250, 252, 0.96)',
      muted: 'rgba(203, 213, 225, 0.75)',
      faint: 'rgba(203, 213, 225, 0.5)',
    },

    // Avatar pastel palette
    avatars: {
      sunGlow: '#FDE68A',
      duskRose: '#FCA5A5',
      skyMist: '#BFDBFE',
      twilightLilac: '#C4B5FD',
      fernWhisper: '#BBF7D0',
      petalHaze: '#FBCFE8',
      amberEmber: '#FDBA74',
      lagoonDrift: '#A5F3FC',
    },
  },

  /**
   * Border radius
   */
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '18px',          // 'glass' - primary rounded corners
    '2xl': '24px',
    full: '9999px',
  },

  /**
   * Shadows
   * Glass morphism shadow system
   */
  shadows: {
    glass: {
      lg: '0 32px 60px rgba(6, 10, 24, 0.55)',
      md: '0 24px 48px rgba(6, 10, 24, 0.45)',
      sm: '0 16px 28px rgba(6, 10, 24, 0.35)',
      xs: '0 8px 18px rgba(6, 10, 24, 0.25)',
    },
    glow: {
      ember: '0 0 20px rgba(252, 211, 77, 0.45)',
      blush: '0 0 20px rgba(249, 115, 175, 0.45)',
      lagoon: '0 0 20px rgba(56, 189, 248, 0.45)',
    },
  },

  /**
   * Backdrop blur
   */
  blur: {
    sm: '8px',
    md: '16px',
    lg: '24px',          // 'lounge' - primary blur
    xl: '48px',
  },

  /**
   * Transitions
   * Consistent timing and easing
   */
  transitions: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },

    easing: {
      glide: 'cubic-bezier(0.16, 1, 0.3, 1)',      // Smooth deceleration
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy spring
      ease: 'ease-in-out',
    },
  },

  /**
   * Animations
   * Keyframe animation names
   */
  animations: {
    auroraDrift: 'auroraDrift 22s ease-in-out infinite alternate',
    breath: 'breath 6s ease-in-out infinite',
    pulseSoft: 'pulseSoft 2800ms ease-in-out infinite',
    ribbonGlow: 'ribbonGlow 4s ease-in-out infinite',
  },

  /**
   * Z-index layers
   * Maintain consistent stacking order
   */
  zIndex: {
    base: 0,
    scene: 10,
    overlay: 50,
    modal: 80,
    drawer: 90,
    settings: 95,
    toast: 100,
    debug: 9999,
  },

  /**
   * Opacity scale
   */
  opacity: {
    disabled: 0.4,
    muted: 0.6,
    normal: 0.8,
    emphasis: 0.9,
    full: 1,
  },

  /**
   * Breakpoints
   * Match Tailwind defaults
   */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

/**
 * Helper: Convert token to Tailwind class
 *
 * Example:
 * toClass(TOKENS.spacing.md) => 'p-3' (12px = 0.75rem = 3 in Tailwind scale)
 */
export function toTailwindSpacing(px: string): string {
  const value = parseInt(px);
  const rem = value / 16;
  const scale = rem * 4; // Tailwind uses 0.25rem increments
  return scale.toString();
}

/**
 * Type exports for TypeScript
 */
export type SpacingToken = keyof typeof TOKENS.spacing;
export type ColorToken = keyof typeof TOKENS.colors;
export type ShadowToken = keyof typeof TOKENS.shadows.glass;
export type TransitionDuration = keyof typeof TOKENS.transitions.duration;
export type TransitionEasing = keyof typeof TOKENS.transitions.easing;
