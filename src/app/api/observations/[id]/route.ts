import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ObservationUpdate } from "@/lib/schemas/observation";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("observations").select("*").eq("id", params.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ObservationUpdate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Only allow updating own observation unless admin (simple check)
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();

  const { data: existing, error: exErr } = await supabase.from("observations").select("user_id").eq("id", params.id).single();
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 404 });

  if (!me?.is_admin && existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase.from("observations").update(parsed.data).eq("id", params.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  const { data: existing, error: exErr } = await supabase.from("observations").select("user_id").eq("id", params.id).single();
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 404 });

  if (!me?.is_admin && existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("observations").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
