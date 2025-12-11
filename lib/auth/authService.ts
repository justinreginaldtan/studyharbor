/**
 * StudyHarbor Authentication Service
 *
 * Handles all auth operations with Supabase.
 * Provides a clean interface for signup, login, and session management.
 */

import { supabase } from '@/lib/supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Authentication Service
 * Centralized auth operations
 */
export const authService = {
  /**
   * Sign up a new user with email and password
   * Creates both auth user and profile record
   */
  async signUp({ email, password, displayName }: SignUpData): Promise<AuthResult> {
    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        console.error('[Auth] Signup error:', error.message);
        return { user: null, session: null, error };
      }

      // Note: Profile record will be created via database trigger
      // See migration: create_profile_on_signup.sql

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err) {
      console.error('[Auth] Signup exception:', err);
      return {
        user: null,
        session: null,
        error: {
          name: 'SignUpError',
          message: err instanceof Error ? err.message : 'Unknown error during signup',
        } as AuthError,
      };
    }
  },

  /**
   * Sign in existing user with email and password
   */
  async signIn({ email, password }: SignInData): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign in error:', error.message);
        return { user: null, session: null, error };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (err) {
      console.error('[Auth] Sign in exception:', err);
      return {
        user: null,
        session: null,
        error: {
          name: 'SignInError',
          message: err instanceof Error ? err.message : 'Unknown error during sign in',
        } as AuthError,
      };
    }
  },

  /**
   * Sign in with Google OAuth
   * Redirects to Google auth page
   */
  async signInWithGoogle(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('[Auth] Google OAuth error:', error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error('[Auth] Google OAuth exception:', err);
      return {
        error: {
          name: 'OAuthError',
          message: err instanceof Error ? err.message : 'Unknown error during OAuth',
        } as AuthError,
      };
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[Auth] Sign out error:', error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error('[Auth] Sign out exception:', err);
      return {
        error: {
          name: 'SignOutError',
          message: err instanceof Error ? err.message : 'Unknown error during sign out',
        } as AuthError,
      };
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('[Auth] Password reset error:', error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error('[Auth] Password reset exception:', err);
      return {
        error: {
          name: 'PasswordResetError',
          message: err instanceof Error ? err.message : 'Unknown error during password reset',
        } as AuthError,
      };
    }
  },

  /**
   * Update password (when user has reset token)
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('[Auth] Password update error:', error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error('[Auth] Password update exception:', err);
      return {
        error: {
          name: 'PasswordUpdateError',
          message: err instanceof Error ? err.message : 'Unknown error during password update',
        } as AuthError,
      };
    }
  },

  /**
   * Get current session
   */
  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] Get session error:', error.message);
        return { session: null, error };
      }

      return { session: data.session, error: null };
    } catch (err) {
      console.error('[Auth] Get session exception:', err);
      return {
        session: null,
        error: {
          name: 'SessionError',
          message: err instanceof Error ? err.message : 'Unknown error getting session',
        } as AuthError,
      };
    }
  },

  /**
   * Get current user
   */
  async getUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error('[Auth] Get user error:', error.message);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      console.error('[Auth] Get user exception:', err);
      return {
        user: null,
        error: {
          name: 'UserError',
          message: err instanceof Error ? err.message : 'Unknown error getting user',
        } as AuthError,
      };
    }
  },

  /**
   * Listen to auth state changes
   * Returns unsubscribe function
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  },
};

/**
 * Validation helpers
 */
export const authValidation = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   * Requirements: min 8 chars, at least one letter and one number
   */
  isValidPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }

    if (!/[a-zA-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one letter' };
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }

    return { valid: true };
  },

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error: AuthError | null): string {
    if (!error) return 'An unknown error occurred';

    // Map common Supabase errors to friendly messages
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Email or password is incorrect',
      'User already registered': 'An account with this email already exists',
      'Email not confirmed': 'Please verify your email before signing in',
      'Password should be at least 6 characters': 'Password must be at least 8 characters',
      'Unable to validate email address: invalid format': 'Please enter a valid email address',
    };

    return errorMessages[error.message] || error.message;
  },
};
