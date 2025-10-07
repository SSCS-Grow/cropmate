import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Next.js 15: context.params er en Promise<{ id: string }>
type Ctx = { params: Promise<{ id: string }> };

// OPTIONAL: skriv præcise typer for dit payload
type Payload = Record<string, unknown>;

export async function POST(req: NextRequest, ctx: Ctx) {
  // Hent id fra params (SKAL awaites i Next 15)
  const { id } = await ctx.params;

  // Læs payload hvis du har brug for det
  let body: Payload | null = null;
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      body = (await req.json()) as Payload;
    }
  } catch {
    // ignore bad JSON
  }

  // TODO: indsæt din eksisterende forretningslogik her (DB, supabase mm.)
  // Returnér noget meningsfuldt – dette er en harmløs “OK”-stub
  return NextResponse.json({ ok: true, id, received: body ?? null });
}

// (Hvis du også har GET/PUT/DELETE, brug samme signatur-mønster:)
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  return NextResponse.json({ ok: true, id });
}
