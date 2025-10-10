import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { PestSchema } from "@/lib/zod/pest";
import { toSlug } from "@/lib/utils/slug";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("pests").select("*, pest_images(*)").eq("id", params.id).single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const body = await req.json();
  const parsed = PestSchema.partial().safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const update: any = { ...parsed.data, updated_at: new Date().toISOString() };
  if (parsed.data.name) update.slug = toSlug(parsed.data.name);

  const { data, error } = await supabase.from("pests").update(update).eq("id", params.id).select("*").single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { error } = await supabase.from("pests").delete().eq("id", params.id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
