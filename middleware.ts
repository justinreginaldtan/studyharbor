import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/serverSession";

const PROTECTED_PATH_PREFIXES = ["/dashboard", "/billing"];
const PUBLIC_PREFIXES = ["/auth", "/pricing", "/test-auth", "/api", "/_next"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.includes(".")) return true; // static assets
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const { user } = await requireUser(request);
  if (!user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
