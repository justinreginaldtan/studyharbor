// app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { normalizeSubscriptionStatus } from '@/lib/features/featureGate';
import { getStripeClient } from '@/lib/payments/stripeHelpers';
import { optionalEnv } from '@/lib/config/env';

const webhookSecret = optionalEnv('STRIPE_WEBHOOK_SECRET');
const stripe = (() => {
  try {
    return getStripeClient();
  } catch {
    return null;
  }
})();

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ message: 'Stripe not configured' }, { status: 500 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Server misconfigured: missing Supabase service role key' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ message: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown webhook error';
    console.error(`Webhook Error: ${message}`);
    return NextResponse.json({ message: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ message: `Unsupported event type: ${event.type}` }, { status: 200 });
  }

  if (processedEvents.has(event.id)) {
    return NextResponse.json({ message: 'Event already processed' }, { status: 200 });
  }

  const markProcessed = () => processedEvents.add(event.id);

  const updateSubscriptionStatus = async (params: { userId: string; status: string; customerId?: string | null; subscriptionId?: string | null; }) => {
    const normalizedStatus = normalizeSubscriptionStatus(params.status);
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: normalizedStatus,
        stripe_customer_id: params.customerId ?? undefined,
        stripe_subscription_id: params.subscriptionId ?? undefined,
      })
      .eq('id', params.userId);

    if (error) {
      throw new Error(error.message);
    }
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.userId;
        if (checkoutSession.mode !== 'subscription' || !checkoutSession.subscription || !userId) {
          console.warn('Checkout session missing subscription metadata');
          break;
        }
        const subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription as string);
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null;
        await updateSubscriptionStatus({
          userId,
          status: subscription.status,
          customerId,
          subscriptionId: subscription.id,
        });
        markProcessed();
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (!userId) {
          console.warn('Subscription event missing userId metadata');
          break;
        }
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null;
        await updateSubscriptionStatus({
          userId,
          status: subscription.status,
          customerId,
          subscriptionId: subscription.id,
        });
        markProcessed();
        break;
      }
      default:
        console.warn(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown handler error';
    console.error('Error handling event:', message);
    return NextResponse.json({ message: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
