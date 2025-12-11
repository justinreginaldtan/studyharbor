import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/auth/serverSession';
import { ratelimit } from '@/lib/ratelimit';
import { ensureCustomer, getReturnUrls, getStripeClient } from '@/lib/payments/stripeHelpers';

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Server misconfigured: missing Supabase service role key' }, { status: 500 });
  }

  const { user, error: sessionError } = await requireUser(req);
  if (!user || sessionError) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await ratelimit.limit(`billing-portal:${user.id}`);
  if (!success) {
    return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
  }

  if (!user.email) {
    return NextResponse.json({ message: 'User email not found' }, { status: 400 });
  }

  const customerId = await ensureCustomer({ supabaseAdmin, userId: user.id, email: user.email });

  try {
    const { successUrl } = getReturnUrls(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: successUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[Billing Portal] Error creating session', error);
    return NextResponse.json({ message: error.message ?? 'Internal Server Error' }, { status: 500 });
  }
}
