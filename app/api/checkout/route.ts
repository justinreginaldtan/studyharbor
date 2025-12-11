// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ratelimit } from '@/lib/ratelimit';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { getAllowedPrice } from '@/lib/payments/pricing';
import { requireUser } from '@/lib/auth/serverSession';
import { ensureCustomer, getReturnUrls, getStripeClient } from '@/lib/payments/stripeHelpers';

const requestSchema = z.object({
  priceId: z.string().min(1, 'Missing price'),
});

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { message: 'Server misconfigured: missing Supabase service role key' },
      { status: 500 },
    );
  }

  const { user, error: sessionError } = await requireUser(req);
  if (!user || sessionError) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid request', issues: parsed.error.format() }, { status: 400 });
  }

  const { priceId } = parsed.data;
  const price = getAllowedPrice(priceId);
  if (!price) {
    return NextResponse.json({ message: 'Price not allowed' }, { status: 400 });
  }

  // Rate limit per user
  const { success } = await ratelimit.limit(`checkout:${user.id}`);
  if (!success) {
    return NextResponse.json({ message: 'Too Many Requests' }, { status: 429 });
  }

  if (!user.email) {
    return NextResponse.json({ message: 'User email not found' }, { status: 400 });
  }

  const customerId = await ensureCustomer({ supabaseAdmin, userId: user.id, email: user.email });
  const { successUrl, cancelUrl } = getReturnUrls(req);

  try {
    const idempotencyKey = `checkout_${user.id}_${priceId}_${new Date().toISOString().slice(0, 10)}`;
    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        customer_email: user.email,
        line_items: [{ price: price.id, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { userId: user.id, cadence: price.cadence },
      },
      { idempotencyKey }
    );

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[Stripe Checkout] Error creating checkout session:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
