import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ObservationCreate } from "@/lib/schemas/observation";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const from = Number(searchParams.get("from") ?? 0);
  const to = from + Math.min(limit, 200);

  let query = supabase.from("observations").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);

  const pest = searchParams.get("pest_id");
  const disease = searchParams.get("disease_id");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("fromDate");
  const dateTo = searchParams.get("toDate");

  if (pest) query = query.eq("pest_id", pest);
  if (disease) query = query.eq("disease_id", disease);
  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data, count });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json();
  const parsed = ObservationCreate.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const payload = parsed.data;
  const { data, error } = await supabase.from("observations").insert({
    user_id: user.id,
    title: payload.title,
    description: payload.description,
    lat: payload.lat,
    lng: payload.lng,
    pest_id: payload.pest_id ?? null,
    disease_id: payload.disease_id ?? null,
    garden_id: payload.garden_id ?? null,
    photo_url: payload.photo_url,
    taken_at: payload.taken_at,
  }).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data }, { status: 201 });
}
