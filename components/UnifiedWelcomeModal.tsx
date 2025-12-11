'use client';

/**
 * Unified Welcome Modal
 * Combines auth options with guest customization
 * Matches the cozy twilight aesthetic
 */

import { useEffect, useRef, useState } from "react";
import { authService, authValidation } from "@/lib/auth/authService";
import { COZY_AVATAR_COLORS } from "@/lib/utils";

type UnifiedWelcomeModalProps = {
  open: boolean;
  initialName: string;
  initialColor: string;
  onConfirm: (identity: { displayName: string; color: string; userId?: string; isAuthenticated: boolean }) => void;
};

type Screen = 'auth-choice' | 'auth-form' | 'guest-customize';
type AuthMode = 'signin' | 'signup';

const COLOR_NAMES: Record<string, string> = {
  "#FDE68A": "Sun Glow",
  "#FCA5A5": "Dusk Rose",
  "#BFDBFE": "Sky Mist",
  "#C4B5FD": "Twilight Lilac",
  "#BBF7D0": "Fern Whisper",
  "#FBCFE8": "Petal Haze",
  "#FDBA74": "Amber Ember",
  "#A5F3FC": "Lagoon Drift",
};

export function UnifiedWelcomeModal({ open, initialName, initialColor, onConfirm }: UnifiedWelcomeModalProps) {
  const [screen, setScreen] = useState<Screen>('auth-choice');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Guest customization state
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(initialName);
    setColor(initialColor);
  }, [initialName, initialColor]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, screen]);

  const handleEmailAuth = async () => {
    setAuthError('');
    setAuthLoading(true);

    // Validate
    if (!authValidation.isValidEmail(email)) {
      setAuthError('Please enter a valid email address');
      setAuthLoading(false);
      return;
    }

    const passwordCheck = authValidation.isValidPassword(password);
    if (!passwordCheck.valid) {
      setAuthError(passwordCheck.message || 'Invalid password');
      setAuthLoading(false);
      return;
    }

    try {
      if (authMode === 'signup') {
        const { user, error } = await authService.signUp({
          email,
          password,
          displayName: email.split('@')[0],
        });

        if (error) {
          setAuthError(authValidation.getErrorMessage(error));
          setAuthLoading(false);
        } else if (user) {
          // Success! Send back authenticated identity
          onConfirm({
            displayName: user.user_metadata?.display_name || email.split('@')[0],
            color: initialColor,
            userId: user.id,
            isAuthenticated: true,
          });
        }
      } else {
        const { user, error } = await authService.signIn({ email, password });

        if (error) {
          setAuthError(authValidation.getErrorMessage(error));
          setAuthLoading(false);
        } else if (user) {
          // Success!
          onConfirm({
            displayName: user.user_metadata?.display_name || email.split('@')[0],
            color: user.user_metadata?.avatar_color || initialColor,
            userId: user.id,
            isAuthenticated: true,
          });
        }
      }
    } catch (err) {
      setAuthError('Something went wrong. Please try again.');
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setAuthLoading(true);

    try {
      const { error } = await authService.signInWithGoogle();
      if (error) {
        setAuthError(authValidation.getErrorMessage(error));
        setAuthLoading(false);
      }
      // If successful, user will be redirected
    } catch (err) {
      setAuthError('Google sign-in failed. Please try again.');
      setAuthLoading(false);
    }
  };

  const handleGuestCustomize = () => {
    setScreen('guest-customize');
  };

  const handleGuestConfirm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    onConfirm({
      displayName: trimmed,
      color,
      isAuthenticated: false,
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,14,24,0.78)] backdrop-blur-[22px]"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to StudyHarbor"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setAuthMode("signin");
          setScreen("auth-choice");
        }
      }}
    >
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 -m-[30%] animate-aurora-drift bg-[radial-gradient(circle_at_22%_25%,rgba(251,191,36,0.18),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(96,165,250,0.22),transparent_55%),radial-gradient(circle_at_50%_75%,rgba(248,113,113,0.2),transparent_50%)] blur-[48px] opacity-90" />

      {/* Auth Choice Screen */}
      {screen === 'auth-choice' && (
        <div className="relative z-10 w-[min(92vw,420px)] space-y-6 rounded-glass border border-white/15 bg-[rgba(15,23,42,0.95)] p-8 shadow-glass-lg backdrop-blur-lounge">
          <header className="space-y-2 text-center">
            <span className="text-xs uppercase tracking-[0.35em] text-slate-100/70">Hey there 💛</span>
            <h2 className="text-2xl font-semibold tracking-[0.06em] text-parchment md:text-3xl">
              Pull up a chair
            </h2>
            <p className="text-sm leading-relaxed text-slate-100/80">
              Choose how you'd like to join the cozy study lounge.
            </p>
          </header>

          <div className="space-y-3">
            <button
              onClick={() => setScreen('auth-form')}
              className="w-full rounded-full border border-white/15 bg-twilight-ember/90 px-6 py-3 text-sm font-semibold text-twilight shadow-[0_18px_36px_rgba(252,211,77,0.45)] transition hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilight-ember/60"
            >
              Sign In / Sign Up
            </button>

            <button
              onClick={handleGoogleAuth}
              disabled={authLoading}
              className="w-full rounded-full border border-white/15 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[rgba(15,23,42,0.95)] px-2 text-slate-100/60">Or</span>
              </div>
            </div>

            <button
              onClick={handleGuestCustomize}
              className="w-full rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Continue as Guest
            </button>
          </div>

          <div className="space-y-2 text-center text-[0.75rem] leading-relaxed text-slate-100/70">
            <p>This is a safe, warm space. Choose what feels comfortable for you.</p>
          </div>
        </div>
      )}

      {/* Auth Form Screen */}
      {screen === 'auth-form' && (
        <div className="relative z-10 w-[min(92vw,420px)] space-y-6 rounded-glass border border-white/15 bg-[rgba(15,23,42,0.95)] p-8 shadow-glass-lg backdrop-blur-lounge">
          <header className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-[0.06em] text-parchment">
              {authMode === 'signin' ? 'Welcome Back' : 'Join StudyHarbor'}
            </h2>
            <p className="text-sm leading-relaxed text-slate-100/80">
              {authMode === 'signin'
                ? 'Sign in to continue your focus journey'
                : 'Create an account to save your progress'}
            </p>
          </header>

          {authError && (
            <div className="p-3 rounded-lg bg-twilight-blush/20 border border-twilight-blush/30">
              <p className="text-sm text-parchment">{authError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.28em] text-slate-200/70 mb-2">
                Email
              </label>
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                disabled={authLoading}
                className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-300/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.28em] text-slate-200/70 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                disabled={authLoading}
                className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-300/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={handleEmailAuth}
              disabled={authLoading}
              className="w-full rounded-full bg-twilight-ember/90 px-6 py-3 text-sm font-semibold text-twilight shadow-[0_18px_36px_rgba(252,211,77,0.45)] transition hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilight-ember/60 disabled:opacity-60"
            >
              {authLoading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>

            <button
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              disabled={authLoading}
              className="w-full text-sm text-twilight-lagoon hover:text-twilight-ember transition-colors disabled:opacity-50"
            >
              {authMode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>

            <button
              onClick={() => setScreen('auth-choice')}
              disabled={authLoading}
              className="w-full text-sm text-slate-100/60 hover:text-slate-100/90 transition-colors disabled:opacity-50"
            >
              ← Back
            </button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs text-slate-100/60">Password must be at least 8 characters</p>
            <p className="text-xs text-slate-100/60">with letters and numbers</p>
          </div>
        </div>
      )}

      {/* Guest Customization Screen */}
      {screen === 'guest-customize' && (
        <form
          onSubmit={handleGuestConfirm}
          className="relative z-10 w-[min(92vw,420px)] space-y-6 rounded-glass border border-white/15 bg-[rgba(15,23,42,0.95)] p-8 shadow-glass-lg backdrop-blur-lounge"
        >
          <header className="space-y-2 text-center">
            <span className="text-xs uppercase tracking-[0.35em] text-slate-100/70">Almost there 💛</span>
            <h2 className="text-2xl font-semibold tracking-[0.06em] text-parchment md:text-3xl">
              Customize Your Vibe
            </h2>
            <p className="text-sm leading-relaxed text-slate-100/80">
              Pick a name and color that feels like you. No pressure, just cozy focus.
            </p>
          </header>

          <div className="space-y-3">
            <label className="block text-left text-xs uppercase tracking-[0.28em] text-slate-200/70">
              Display Name
            </label>
            <input
              ref={inputRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Soft Birch"
              className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-300/40 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
              maxLength={40}
            />
          </div>

          <fieldset className="space-y-3 text-left">
            <legend className="text-xs uppercase tracking-[0.28em] text-slate-200/70">
              Avatar Glow
            </legend>
            <div className="grid grid-cols-4 gap-3">
              {COZY_AVATAR_COLORS.map((option) => {
                const selected = option === color;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    className={`group relative flex h-16 flex-col items-center justify-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                      selected
                        ? "border-white/60 bg-white/10"
                        : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                    }`}
                    aria-pressed={selected}
                  >
                    <span
                      className="mb-1 h-6 w-6 rounded-full"
                      style={{ backgroundColor: option }}
                    />
                    <span className="text-[0.65rem] font-medium tracking-[0.15em] text-slate-100/80">
                      {COLOR_NAMES[option] ?? "Glow"}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2 text-center text-[0.75rem] leading-relaxed text-slate-100/70">
            <p>This is a safe, warm space. Choose a name that feels good to you—no one will judge.</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={name.trim().length === 0}
              className="w-full rounded-full bg-twilight-ember/90 px-6 py-3 text-sm font-semibold text-twilight shadow-[0_18px_36px_rgba(252,211,77,0.45)] transition hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-twilight-ember/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              I'm ready 💛
            </button>
            <button
              type="button"
              onClick={() => setScreen('auth-choice')}
              className="w-full text-sm text-slate-100/60 hover:text-slate-100/90 transition-colors"
            >
              ← Back
            </button>
            <span className="text-center text-[0.68rem] uppercase tracking-[0.32em] text-slate-200/60">
              Press Enter to continue
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
