import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { assertSupabaseEnv } from "@/lib/env";

const WINDOW_MS = 15 * 1000;
const MAX_REQ = 30;
const buckets = new Map<string, { count: number; ts: number }>();

const ONBOARDING_BYPASS_PREFIXES = [
  "/onboarding",
  "/api",
  "/_next",
  "/auth",
  "/static",
];

const ONBOARDING_BYPASS_PATHS = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
  "/sw.js",
  "/offline",
]);

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    return applyRateLimit(req);
  }

  if (!shouldEnforceOnboarding(pathname)) {
    return NextResponse.next();
  }

  return await enforceOnboarding(req);
}

function applyRateLimit(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const real = req.headers.get("x-real-ip") ?? "";
  const ip = (fwd.split(",")[0] || real || "unknown").trim();

  const now = Date.now();
  const rec = buckets.get(ip) ?? { count: 0, ts: now };
  if (now - rec.ts > WINDOW_MS) {
    rec.count = 0;
    rec.ts = now;
  }
  rec.count += 1;
  buckets.set(ip, rec);

  if (rec.count > MAX_REQ) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }
  return NextResponse.next();
}

function shouldEnforceOnboarding(pathname: string) {
  if (ONBOARDING_BYPASS_PATHS.has(pathname)) return false;
  if (ONBOARDING_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    // /api håndteres separat
    if (pathname.startsWith("/api/")) return false;
    if (pathname.startsWith("/onboarding")) return false;
    if (pathname.startsWith("/_next")) return false;
    if (pathname.startsWith("/auth")) return false;
    if (pathname.startsWith("/static")) return false;
  }
  return true;
}

async function enforceOnboarding(req: NextRequest) {
  const res = NextResponse.next();
  let sessionUserId: string | null = null;

  try {
    const { url, anon } = assertSupabaseEnv();
    const supabase = createServerClient(url, anon, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();
    sessionUserId = session?.user?.id ?? null;

    if (!sessionUserId) {
      return res;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", sessionUserId)
      .maybeSingle();

    if (profile?.onboarded_at) {
      return res;
    }

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/onboarding";
    redirectUrl.searchParams.set(
      "next",
      req.nextUrl.pathname + req.nextUrl.search,
    );

    const redirectRes = NextResponse.redirect(redirectUrl);
    res.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie);
    });
    return redirectRes;
  } catch {
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
