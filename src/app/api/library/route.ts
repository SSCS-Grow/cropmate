import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await (supabase as any)
    .from('pests')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const body = await req.json();

  // body forventes at ligne:
  // { slug, name, category: 'pest'|'disease', host_plants: string[], severity: number, latin_name?, description? }

  const { data, error } = await (supabase as any)
    .from('pests')
    .insert(body as any)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
