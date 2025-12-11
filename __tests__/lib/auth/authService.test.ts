// __tests__/lib/auth/authService.test.ts

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { authService } from '@/lib/auth/authService';
import { supabase } from '@/lib/supabaseClient';

const mockAuth = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: mockAuth,
  },
}));

const mockUser = { id: '123', email: 'test@example.com' };
const mockSession = { access_token: 'abc-123', user: mockUser };

describe('authService', () => {
  const originalWindow = globalThis.window;

  beforeAll(() => {
    (globalThis as any).window = {
      location: { origin: 'http://localhost' },
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    (globalThis as any).window = originalWindow;
  });

  it('signs up a user successfully', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });

    const result = await authService.signUp({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: { data: { display_name: 'Test User' } },
    });
    expect(result.user).toEqual(mockUser);
    expect(result.session).toEqual(mockSession);
    expect(result.error).toBeNull();
  });

  it('propagates signup error', async () => {
    const err = { name: 'AuthApiError', message: 'User already registered' };
    mockAuth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: err });

    const result = await authService.signUp({ email: 'fail@example.com', password: 'x' });
    expect(result.error).toEqual(err);
  });

  it('handles signup exception gracefully', async () => {
    mockAuth.signUp.mockRejectedValue(new Error('network down'));
    const result = await authService.signUp({ email: 'x', password: 'y' });
    expect(result.error?.message).toContain('network down');
    expect(result.user).toBeNull();
  });

  it('signs in a user', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    const result = await authService.signIn({ email: 'test@example.com', password: 'password123' });
    expect(result.user).toEqual(mockUser);
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('returns error on sign in failure', async () => {
    const err = { name: 'AuthApiError', message: 'Invalid login credentials' };
    mockAuth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: err });
    const result = await authService.signIn({ email: 'bad', password: 'bad' });
    expect(result.error).toEqual(err);
  });

  it('handles OAuth sign in error and exception', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({ error: { name: 'OAuthError', message: 'denied' } });
    const failure = await authService.signInWithGoogle();
    expect(failure.error?.message).toBe('denied');

    mockAuth.signInWithOAuth.mockRejectedValue(new Error('oauth explode'));
    const result = await authService.signInWithGoogle();
    expect(result.error?.message).toContain('oauth explode');
  });

  it('signs out', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });
    const result = await authService.signOut();
    expect(result.error).toBeNull();
  });

  it('resets password and handles error', async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
    const ok = await authService.resetPassword('reset@example.com');
    expect(ok.error).toBeNull();

    mockAuth.resetPasswordForEmail.mockResolvedValue({ error: { name: 'Error', message: 'fail' } });
    const fail = await authService.resetPassword('reset@example.com');
    expect(fail.error?.message).toBe('fail');
  });

  it('updates password and handles exception', async () => {
    mockAuth.updateUser.mockResolvedValue({ error: null });
    const ok = await authService.updatePassword('new-password');
    expect(ok.error).toBeNull();

    mockAuth.updateUser.mockRejectedValue(new Error('nope'));
    const fail = await authService.updatePassword('new-password');
    expect(fail.error?.message).toContain('nope');
  });

  it('gets session and user with errors', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    const session = await authService.getSession();
    expect(session.session).toEqual(mockSession);

    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: { message: 'bad', name: 'error' } });
    const sessionErr = await authService.getSession();
    expect(sessionErr.error?.message).toBe('bad');

    mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const user = await authService.getUser();
    expect(user.user).toEqual(mockUser);

    mockAuth.getUser.mockRejectedValue(new Error('boom'));
    const userErr = await authService.getUser();
    expect(userErr.error?.message).toContain('boom');
  });

  it('invokes auth state change callbacks', () => {
    const unsubscribe = vi.fn();
    mockAuth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    const spy = vi.fn();
    const off = authService.onAuthStateChange(spy);
    expect(mockAuth.onAuthStateChange).toHaveBeenCalled();
    off();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
