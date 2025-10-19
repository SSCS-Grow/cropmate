import { NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 15 * 1000;
const MAX_REQ = 30;
const buckets = new Map<string, { count: number; ts: number }>();

export function middleware(req: NextRequest) {
  // Brug X-Forwarded-For / X-Real-IP i stedet for req.ip
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const real = req.headers.get("x-real-ip") ?? "";
  const ip =
    (fwd.split(",")[0] || real || "unknown").trim();

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

export const config = {
  matcher: ["/api/:path*"],
};
