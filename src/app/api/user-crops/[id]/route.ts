// src/app/api/user-crops/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
// importér dine helpers som før
// import { getSupabaseServer } from "@/lib/supabase/server";

type Params = { id: string };

// GET /api/user-crops/[id]
export async function GET(
  _req: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params;

  // ... din eksisterende GET-logik her
  // const supabase = await getSupabaseServer();
  // const { data, error } = await supabase.from("user_crops").select("*").eq("id", id).maybeSingle();
  // if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // return NextResponse.json(data ?? null);
  return NextResponse.json({ ok: true, id });
}

// POST /api/user-crops/[id]
export async function POST(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params;
  // const body = await req.json(); // hvis du forventer body

  // ... din eksisterende POST-logik her
  // const supabase = await getSupabaseServer();
  // do stuff with id (+ body)
  // return NextResponse.json({ ok: true, generated: 1 });

  return NextResponse.json({ ok: true, id });
}

// PUT / DELETE — samme mønster hvis du bruger dem:
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params;
  // ... din delete-logik
  return NextResponse.json({ ok: true, deleted: id });
}
