import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET() {
  try {
    const s = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [{ data: c1 }, { data: c2 }] = await Promise.all([
      s.from("library_items").select("id", { count: "exact", head: true }),
      s.from("library_item_embeddings").select("item_id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      ok: true,
      items: c1?.length ?? (c1 as any)?.count ?? null,
      embeddings: c2?.length ?? (c2 as any)?.count ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
