import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

type DiagnoseInput = {
  plant?: string;
  symptoms: string;
  imageUrls?: string[];
  topK?: number;
};

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function embed(text: string) {
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

export async function POST(req: NextRequest) {
  try {
    // ---------------- RATE LIMIT ----------------
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: rl, error: rlErr } = await sb.rpc("check_rate_limit", {
      p_route: "/api/ai/diagnose",
      p_key_id: ip,
      p_limit: 20,
      p_window_seconds: 10 * 60,
    });
    if (!rlErr && Array.isArray(rl) && rl[0] && rl[0].allowed === false) {
      return NextResponse.json(
        { error: "For mange forespørgsler. Prøv igen senere.", retryAfter: 60 },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    // -------------- /RATE LIMIT -----------------

    const body = (await req.json()) as DiagnoseInput;
    if (!body?.symptoms) {
      return NextResponse.json({ error: "Missing 'symptoms'." }, { status: 400 });
    }

    // -------- CACHE KEY --------
    const keyPayload = {
      plant: body.plant || null,
      symptoms: body.symptoms,
      imageUrls: body.imageUrls || [],
      topK: Math.min(Math.max(body.topK ?? 5, 1), 10),
      ragModel: process.env.AI_EMBED_MODEL || "text-embedding-3-small",
      llmModel: process.env.AI_DIAGNOSE_MODEL || "gpt-4o-mini",
      // evt. version: bump denne hvis du ændrer prompt-formatet:
      v: 1,
    };
    const cacheKey = await sha256Hex(JSON.stringify(keyPayload));
    // -------- /CACHE KEY --------

    // 1) Slå cache op (ttl = 10 min)
    const { data: cached } = await sb.rpc("ai_cache_get", { p_key: cacheKey });
    if (cached) {
      return NextResponse.json({ ok: true, result: cached, cached: true });
    }

    // 2) RAG: embed + match
    const queryText = `Plante: ${body.plant || "ukendt"}\nSymptomer: ${body.symptoms}`;
    const queryEmb = await embed(queryText);

    const matchCount = keyPayload.topK;
    const { data: matches, error: mErr } = await sb.rpc("match_library_items", {
      query_embedding: queryEmb as unknown as any,
      match_count: matchCount,
    });
    if (mErr) throw mErr;

    const ids = (matches || []).map((m: any) => m.item_id);
    let items: any[] = [];
    if (ids.length) {
      const { data } = await sb
        .from("library_items")
        .select("id, title, summary, content, slug")
        .in("id", ids);
      items = data || [];
    }

    // 3) Kald LLM
    const system =
      "Du er en agronomi-assistent. Svar kort på dansk. Returnér JSON: {diagnoses:[{name, confidence, rationale, references:[{title,slug}], recommended_actions[]}], red_flags[]}";

    const userContent: any[] = [{ type: "text", text: queryText }];

    for (const u of body.imageUrls || []) {
      userContent.push({ type: "image_url", image_url: { url: u } });
    }
    if (items.length) {
      userContent.push({
        type: "text",
        text:
          "Kandidater fra biblioteket:\n" +
          items
            .map(
              (it) =>
                `- ${it.title} (slug: ${it.slug})\nSammendrag: ${it.summary || (it.content || "").slice(0, 240)}`
            )
            .join("\n\n"),
      });
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_DIAGNOSE_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: "AI request failed", detail: await resp.text() },
        { status: 500 }
      );
    }
    const data = await resp.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");

    // 4) Sæt cache (10 min)
    await sb.rpc("ai_cache_set", {
      p_key: cacheKey,
      p_value: parsed,
      p_ttl_seconds: 10 * 60,
    });

    return NextResponse.json({ ok: true, result: parsed, matches, cached: false });
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", detail: e?.message }, { status: 500 });
  }
}
