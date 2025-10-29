import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = (serviceRole?: string) =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRole || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

async function embedText(text: string) {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_EMBED_MODEL || "text-embedding-3-small",
      input: text,
    }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  const json = await resp.json();
  return json.data[0].embedding as number[];
}

async function reindexItems(s: ReturnType<typeof supabase>, itemIds?: string[]) {
  // Hent items
  let q = s.from("library_items").select("id, title, summary, content").limit(10000);
  if (itemIds?.length) q = q.in("id", itemIds);
  const { data: items, error } = await q;
  if (error) throw error;

  const upserts: any[] = [];
  for (const it of items || []) {
    const text = [it.title, it.summary, it.content].filter(Boolean).join("\n\n");
    if (!text.trim()) continue;
    const emb = await embedText(text);
    upserts.push({ item_id: it.id, embedding: emb });
  }

  if (upserts.length) {
    const { error: upErr } = await s.from("library_item_embeddings").upsert(upserts);
    if (upErr) throw upErr;
  }

  return upserts.length;
}

export async function GET(req: NextRequest) {
  // Vercel Cron kalder som GET
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const fromQueue = url.searchParams.get("fromQueue") === "1";
  const s = supabase(process.env.SUPABASE_SERVICE_ROLE);

  try {
    if (fromQueue) {
      // Tøm køen i batch
      const { data: queuedIds, error: qErr } = await s
        .from("library_reindex_queue")
        .select("item_id")
        .limit(500);
      if (qErr) throw qErr;

      const ids = (queuedIds || []).map((r: any) => r.item_id);
      if (!ids.length) return NextResponse.json({ ok: true, count: 0, mode: "queue" });

      const count = await reindexItems(s, ids);

      // Slet processerede
      const { error: delErr } = await s.from("library_reindex_queue").delete().in("item_id", ids);
      if (delErr) throw delErr;

      return NextResponse.json({ ok: true, count, mode: "queue" });
    } else {
      // Fuld reindex
      const count = await reindexItems(s);
      return NextResponse.json({ ok: true, count, mode: "full" });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// POST bevares til manuel kørsel (uden header-krav i dit admin-UI)
export async function POST() {
  try {
    const s = supabase(process.env.SUPABASE_SERVICE_ROLE);
    const count = await reindexItems(s);
    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
