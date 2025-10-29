// src/app/monitoring/route.ts
import { NextRequest } from "next/server";

export const runtime = "edge";

// Byg Sentry ingest URL ud fra DSN.
// Eksempel DSN: https://<publicKey>@o<orgId>.ingest.sentry.io/<projectId>
function ingestUrlFromDsn(dsn: string | undefined) {
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const host = u.host;                         // fx o123456.ingest.sentry.io
    const projectId = u.pathname.replace("/", ""); // fx 7890123
    if (!host || !projectId) return null;
    return `https://${host}/api/${projectId}/envelope/`;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  const upstream = ingestUrlFromDsn(dsn);
  if (!upstream) {
    return new Response("Sentry DSN missing/invalid", { status: 500 });
  }

  // Envelope skal sendes videre som raw tekst
  const envelope = await req.text();

  // Tag relevante tracing-headere med, hvis de findes
  const headers: Record<string, string> = {
    "Content-Type": "application/x-sentry-envelope",
  };
  const trace = req.headers.get("sentry-trace");
  if (trace) headers["sentry-trace"] = trace;
  const baggage = req.headers.get("baggage");
  if (baggage) headers["baggage"] = baggage;

  const resp = await fetch(upstream, {
    method: "POST",
    headers,
    body: envelope,
  });

  return new Response(null, { status: resp.status });
}
