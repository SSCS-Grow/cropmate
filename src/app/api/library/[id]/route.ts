// src/app/api/library/[id]/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { PestSchema } from "@/lib/zod/pest";
import { toSlug } from "@/lib/utils/slug";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  const { id } = await context.params; // Next 15: params er en Promise
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("pests")
    .select("*, pest_images(*)")
    .eq("id", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(req: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const supabase = await supabaseServer();
  const body = await req.json();

  const parsed = PestSchema.partial().safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const update: any = { ...parsed.data, updated_at: new Date().toISOString() };
  if (parsed.data.name) update.slug = toSlug(parsed.data.name);

  const { data, error } = await supabase
    .from("pests")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function DELETE(_req: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const supabase = await supabaseServer();
  const { error } = await supabase.from("pests").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
