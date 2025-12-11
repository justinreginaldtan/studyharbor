import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

type SessionResult =
  | { user: User; error: null }
  | { user: null; error: string };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ACCESS_TOKEN_COOKIES = ["sb-access-token", "sb:token", "supabase-auth-token"];

function getAccessToken(req: NextRequest): string | null {
  for (const name of ACCESS_TOKEN_COOKIES) {
    const value = req.cookies.get(name)?.value;
    if (value) return value;
  }
  return null;
}

/**
 * Returns the authenticated Supabase user from an incoming request using the access token cookie.
 * Falls back to null (with an error message) when the request is unauthenticated or misconfigured.
 */
export async function getUserFromRequest(req: NextRequest): Promise<SessionResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { user: null, error: "Supabase environment not configured" };
  }

  const accessToken = getAccessToken(req);
  if (!accessToken) {
    return { user: null, error: "No access token present" };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return { user: null, error: error?.message ?? "Unauthenticated" };
  }

  return { user: data.user, error: null };
}

/**
 * Helper to require a user and return a typed result for API routes/middleware.
 */
export async function requireUser(req: NextRequest): Promise<SessionResult> {
  return getUserFromRequest(req);
}
