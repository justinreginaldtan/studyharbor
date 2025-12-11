// app/pricing/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  isPro,
  normalizeSubscriptionStatus,
  type SubscriptionStatus,
} from "@/lib/features/featureGate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Placeholder Stripe Price IDs (replace with actual IDs from your Stripe Dashboard)
const STRIPE_PRO_PRICE_ID = "price_12345"; // Example: replace with your actual Pro price ID

export default function PricingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (id: string) => {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", id)
        .single();

      if (!isMounted) return;

      if (profileError) {
        setError(profileError.message);
        setSubscriptionStatus("free");
        return;
      }

      setSubscriptionStatus(
        normalizeSubscriptionStatus(profile?.subscription_status)
      );
    };

    const checkUser = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!isMounted) return;
      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUserId(session.user.id);
        await loadProfile(session.user.id);
      } else {
        setUserId(null);
        setSubscriptionStatus("free");
      }

      setLoading(false);
    };

    void checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          setUserId(session.user.id);
          await loadProfile(session.user.id);
        } else {
          setUserId(null);
          setSubscriptionStatus("free");
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUpgrade = async (priceId: string) => {
    if (!userId) {
      alert("Please sign in to upgrade your plan.");
      // Optionally redirect to login or show auth modal
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId, userId }),
      });

      const { url, message } = await response.json();

      if (url) {
        router.push(url); // Redirect to Stripe Checkout
      } else {
        alert(message || "Failed to create checkout session.");
      }
    } catch (error) {
      console.error("Error initiating checkout:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-twilight text-parchment">
        Loading pricing plans...
      </div>
    );
  }

  const isUserPro = isPro(subscriptionStatus);

  return (
    <div className="min-h-screen bg-twilight text-parchment p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Choose Your StudyHarbor Plan</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-twilight-overlay px-4 py-2 text-sm text-twilight-blush">
          {error}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Free Plan Card */}
        <Card className="bg-glass-surface border border-glass-border shadow-glass-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-twilight-lagoon">Free</CardTitle>
            <CardDescription className="text-text-muted">Start focusing with essential features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-extrabold text-parchment">
              $0<span className="text-lg font-medium text-text-faint">/month</span>
            </p>
            <ul className="space-y-2 text-text-muted">
              <li>• 1 Room</li>
              <li>• Up to 10 Participants</li>
              <li>• Basic Session Timer</li>
              <li>• Guest Mode</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-twilight-blue text-parchment hover:bg-twilight-blue/80"
              disabled={isUserPro}
            >
              {isUserPro ? 'Current Plan' : 'Get Started'}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan Card */}
        <Card className="bg-twilight-overlay border border-twilight-ember shadow-glass-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-twilight-ember text-twilight text-xs font-bold px-3 py-1 rounded-bl-lg">
            Most Popular
          </div>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-twilight-ember">Pro</CardTitle>
            <CardDescription className="text-text-muted">Unlock advanced features for serious focus.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-extrabold text-parchment">
              $5<span className="text-lg font-medium text-text-faint">/month</span>
            </p>
            <ul className="space-y-2 text-text-muted">
              <li>• Unlimited Rooms</li>
              <li>• Up to 50 Participants</li>
              <li>• Session History & Analytics</li>
              <li>• Custom Themes</li>
              <li>• Priority Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-twilight-ember text-twilight hover:bg-twilight-ember/80"
              onClick={() => handleUpgrade(STRIPE_PRO_PRICE_ID)}
              disabled={isUserPro}
            >
              {isUserPro ? 'Current Plan' : 'Upgrade to Pro'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {!userId && (
        <p className="text-text-muted mt-8">
          Please <button onClick={() => router.push('/')} className="text-twilight-lagoon hover:underline">sign in</button> to manage your subscription.
        </p>
      )}
    </div>
  );
}
