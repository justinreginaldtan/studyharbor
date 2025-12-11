"use client";

/**
 * Auth Test Page
 * Quick UI to test Supabase auth setup
 * Access at: http://localhost:3000/test-auth
 */

import { useEffect, useState } from 'react';
import { authService, authValidation } from '@/lib/auth/authService';

export default function TestAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [user, setUser] = useState<any>(null);

  // Check current session on load
  useEffect(() => {
    authService.getSession().then(({ session }) => {
      if (session) {
        setUser(session.user);
        setStatus(`✅ Already logged in as ${session.user.email}`);
      }
    });
  }, []);

  const handleSignUp = async () => {
    setStatus('⏳ Signing up...');

    // Validate
    if (!authValidation.isValidEmail(email)) {
      setStatus('❌ Invalid email format');
      return;
    }

    const passwordCheck = authValidation.isValidPassword(password);
    if (!passwordCheck.valid) {
      setStatus(`❌ ${passwordCheck.message}`);
      return;
    }

    // Sign up
    const { user, error } = await authService.signUp({
      email,
      password,
      displayName: email.split('@')[0],
    });

    if (error) {
      setStatus(`❌ ${authValidation.getErrorMessage(error)}`);
    } else {
      setUser(user);
      setStatus(`✅ Signed up as ${user?.email}! Check your email for confirmation.`);
    }
  };

  const handleSignIn = async () => {
    setStatus('⏳ Signing in...');

    const { user, error } = await authService.signIn({ email, password });

    if (error) {
      setStatus(`❌ ${authValidation.getErrorMessage(error)}`);
    } else {
      setUser(user);
      setStatus(`✅ Signed in as ${user?.email}!`);
    }
  };

  const handleSignOut = async () => {
    setStatus('⏳ Signing out...');

    const { error } = await authService.signOut();

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      setUser(null);
      setStatus('✅ Signed out successfully');
    }
  };

  const handleResetPassword = async () => {
    setStatus('⏳ Sending reset email...');

    if (!authValidation.isValidEmail(email)) {
      setStatus('❌ Enter a valid email first');
      return;
    }

    const { error } = await authService.resetPassword(email);

    if (error) {
      setStatus(`❌ ${error.message}`);
    } else {
      setStatus(`✅ Password reset email sent to ${email}!`);
    }
  };

  const handleGoogleSignIn = async () => {
    setStatus('⏳ Redirecting to Google...');

    const { error } = await authService.signInWithGoogle();

    if (error) {
      setStatus(`❌ ${error.message}`);
    }
    // Note: If successful, user will be redirected to Google
    // Then back to your app after authorization
  };

  return (
    <div className="min-h-screen bg-twilight flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-parchment mb-2">
            🧪 Auth Test Page
          </h1>
          <p className="text-text-muted text-sm">
            Test your Supabase authentication setup
          </p>
        </div>

        {/* Glass card */}
        <div
          className="backdrop-blur-lounge bg-glass-surface border border-glass-border rounded-glass p-6 shadow-glass-lg"
        >
          {/* Status */}
          {status && (
            <div className="mb-4 p-3 rounded-lg bg-twilight-overlay text-sm text-parchment">
              {status}
            </div>
          )}

          {/* Current user */}
          {user && (
            <div className="mb-4 p-3 rounded-lg bg-twilight-veil">
              <p className="text-xs text-text-muted mb-1">Logged in as:</p>
              <p className="text-parchment font-medium">{user.email}</p>
              <p className="text-xs text-text-faint mt-1">ID: {user.id.slice(0, 8)}...</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-twilight-overlay border border-glass-borderWeak text-parchment placeholder-text-faint focus:border-twilight-ember focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-text-muted mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-twilight-overlay border border-glass-borderWeak text-parchment placeholder-text-faint focus:border-twilight-ember focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSignUp}
                className="px-4 py-2 rounded-lg bg-twilight-ember text-twilight font-medium hover:scale-105 transition-transform"
              >
                Sign Up
              </button>
              <button
                onClick={handleSignIn}
                className="px-4 py-2 rounded-lg bg-twilight-lagoon text-twilight font-medium hover:scale-105 transition-transform"
              >
                Sign In
              </button>
            </div>

            {/* Google Sign In */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-glass-borderWeak"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-glass-surface px-2 text-text-faint">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-700 font-medium hover:scale-105 transition-transform flex items-center justify-center gap-2"
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
              Sign in with Google
            </button>

            <button
              onClick={handleResetPassword}
              className="w-full px-4 py-2 rounded-lg bg-twilight-overlay text-text-muted text-sm hover:text-parchment transition-colors"
            >
              Reset Password
            </button>

            {user && (
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 rounded-lg bg-twilight-blush text-twilight font-medium hover:scale-105 transition-transform"
              >
                Sign Out
              </button>
            )}
          </div>

          {/* Validation hints */}
          <div className="mt-4 text-xs text-text-faint space-y-1">
            <p>• Password must be at least 8 characters</p>
            <p>• Must contain letters and numbers</p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a
            href="/"
            className="text-twilight-lagoon text-sm hover:text-twilight-ember transition-colors"
          >
            ← Back to StudyHarbor
          </a>
        </div>
      </div>
    </div>
  );
}
