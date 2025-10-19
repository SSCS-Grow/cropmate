import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('pests')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const patch = await req.json();

  const { data, error } = await (supabase as any)
    .from('pests')
    .update(patch as any)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { error } = await (supabase as any)
    .from('pests')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
