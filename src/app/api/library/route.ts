import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { PestSchema } from "@/lib/zod/pest";
import { toSlug } from "@/lib/utils/slug";

export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();
  const category = searchParams.get("category");
  let query = supabase.from("pests").select("*").order("name");

  if (q) query = query.ilike("name", `%${q}%`);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = PestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await supabaseServer();
  const slug = toSlug(parsed.data.name);

  const { data, error } = await supabase
    .from("pests")
    .insert({ ...parsed.data, slug })
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
