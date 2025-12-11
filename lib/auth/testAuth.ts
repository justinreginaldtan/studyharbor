/**
 * Auth Test Script
 *
 * Run this to test your Supabase auth setup:
 * - Test email signup
 * - Test email login
 * - Test session persistence
 *
 * Usage: Open browser console and paste this code, or create a test page
 */

import { authService, authValidation } from './authService';

export async function testAuthFlow() {
  console.log('🧪 Testing StudyHarbor Auth Setup...\n');

  // Test 1: Email validation
  console.log('📧 Test 1: Email Validation');
  console.log('Valid email:', authValidation.isValidEmail('test@example.com')); // true
  console.log('Invalid email:', authValidation.isValidEmail('notanemail')); // false

  // Test 2: Password validation
  console.log('\n🔒 Test 2: Password Validation');
  console.log('Valid password:', authValidation.isValidPassword('test1234')); // { valid: true }
  console.log('Too short:', authValidation.isValidPassword('test')); // { valid: false, message: ... }
  console.log('No number:', authValidation.isValidPassword('testtest')); // { valid: false, message: ... }

  // Test 3: Get current session (should be null if not logged in)
  console.log('\n👤 Test 3: Current Session');
  const { session } = await authService.getSession();
  console.log('Current session:', session ? 'Logged in' : 'Not logged in');

  // Test 4: Sign up (ONLY RUN THIS ONCE!)
  console.log('\n✍️ Test 4: Sign Up');
  console.log('⚠️  To test signup, use the auth UI or run this manually:');
  console.log(`
    const result = await authService.signUp({
      email: 'test@example.com',
      password: 'test1234',
      displayName: 'Test User'
    });
    console.log(result);
  `);

  // Test 5: Sign in
  console.log('\n🔑 Test 5: Sign In');
  console.log('⚠️  To test signin, use the auth UI or run this manually:');
  console.log(`
    const result = await authService.signIn({
      email: 'test@example.com',
      password: 'test1234'
    });
    console.log(result);
  `);

  // Test 6: Auth state listener
  console.log('\n👂 Test 6: Auth State Listener');
  console.log('Setting up listener...');
  const unsubscribe = authService.onAuthStateChange((user) => {
    console.log('Auth state changed:', user ? `Logged in as ${user.email}` : 'Logged out');
  });
  console.log('Listener active. Sign in/out to see changes.');
  console.log('Call unsubscribe() to stop listening.');

  return { unsubscribe };
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testAuthFlow = testAuthFlow;
  console.log('Auth test available! Run: testAuthFlow()');
}
