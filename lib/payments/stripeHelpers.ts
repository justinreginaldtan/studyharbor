import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { optionalEnv, requireEnv } from "@/lib/config/env";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-11-17.clover";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;
  const secret = requireEnv("STRIPE_SECRET_KEY");
  stripeClient = new Stripe(secret, { apiVersion: STRIPE_API_VERSION });
  return stripeClient;
}

export function getReturnUrls(req: NextRequest) {
  const base = optionalEnv("NEXT_PUBLIC_URL") ?? req.nextUrl.origin;
  return {
    successUrl: `${base}/dashboard?success=true`,
    cancelUrl: `${base}/pricing`,
  };
}

export async function ensureCustomer(params: {
  supabaseAdmin: SupabaseClient;
  userId: string;
  email: string;
}) {
  const stripe = getStripeClient();
  const { supabaseAdmin, userId, email } = params;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id as string;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await supabaseAdmin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}
