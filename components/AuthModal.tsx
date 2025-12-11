'use client';

/**
 * AuthModal Component
 * Beautiful glassmorphism auth overlay for the main cozy scene
 * Matches the twilight aesthetic with smooth animations
 */

import { useEffect, useRef, useState } from 'react';
import { authService, authValidation } from '@/lib/auth/authService';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  onAuthSuccess: (userId: string, email: string) => void;
}

type AuthMode = 'signin' | 'signup';

export default function AuthModal({
  isOpen,
  onClose,
  onContinueAsGuest,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const frame = requestAnimationFrame(() => emailRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen]);

  const handleEmailAuth = async () => {
    setError('');
    setLoading(true);

    // Validate
    if (!authValidation.isValidEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    const passwordCheck = authValidation.isValidPassword(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message || 'Invalid password');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { user, error: authError } = await authService.signUp({
          email,
          password,
          displayName: email.split('@')[0],
        });

        if (authError) {
          setError(authValidation.getErrorMessage(authError));
        } else if (user) {
          onAuthSuccess(user.id, user.email || email);
        }
      } else {
        const { user, error: authError } = await authService.signIn({
          email,
          password,
        });

        if (authError) {
          setError(authValidation.getErrorMessage(authError));
        } else if (user) {
          onAuthSuccess(user.id, user.email || email);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('[AuthModal] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await authService.signInWithGoogle();

      if (authError) {
        setError(authValidation.getErrorMessage(authError));
        setLoading(false);
      }
      // If successful, user will be redirected to Google
      // Then back to /auth/callback, which will handle the rest
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
      setLoading(false);
      console.error('[AuthModal] Google error:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-modal"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-modal flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-label="Authentication"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full max-w-md pointer-events-auto"
            >
              {/* Glass card */}
              <div className="backdrop-blur-lounge bg-glass-surface border border-glass-border rounded-glass shadow-glass-lg p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-parchment">
                    Welcome to StudyHarbor
                  </h2>
                  <p className="text-text-muted text-sm">
                    {mode === 'signin'
                      ? 'Sign in to save your progress'
                      : 'Create an account to get started'}
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-twilight-blush/20 border border-twilight-blush/30"
                  >
                    <p className="text-sm text-parchment">{error}</p>
                  </motion.div>
                )}

                {/* Form */}
                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm text-text-muted mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      ref={emailRef}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-lg bg-twilight-overlay border border-glass-borderWeak text-parchment placeholder-text-faint focus:border-twilight-ember focus:outline-none transition-colors disabled:opacity-50"
                      placeholder="you@example.com"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm text-text-muted mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-lg bg-twilight-overlay border border-glass-borderWeak text-parchment placeholder-text-faint focus:border-twilight-ember focus:outline-none transition-colors disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>

                  {/* Email Auth Button */}
                  <button
                    onClick={handleEmailAuth}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-lg bg-twilight-ember text-twilight font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? 'Loading...'
                      : mode === 'signin'
                      ? 'Sign In'
                      : 'Sign Up'}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-glass-borderWeak"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-glass-surface px-2 text-text-faint">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Google Auth Button */}
                  <button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-700 font-medium hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>

                  {/* Guest option */}
                  <button
                    onClick={onContinueAsGuest}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-lg bg-twilight-overlay text-text-muted hover:text-parchment transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue as Guest
                  </button>
                </div>

                {/* Toggle mode */}
                <div className="text-center">
                  <button
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    disabled={loading}
                    className="text-sm text-twilight-lagoon hover:text-twilight-ember transition-colors disabled:opacity-50"
                  >
                    {mode === 'signin'
                      ? "Don't have an account? Sign up"
                      : 'Already have an account? Sign in'}
                  </button>
                </div>

                {/* Password hint */}
                <div className="text-center space-y-1">
                  <p className="text-xs text-text-faint">
                    Password must be at least 8 characters
                  </p>
                  <p className="text-xs text-text-faint">
                    with letters and numbers
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
