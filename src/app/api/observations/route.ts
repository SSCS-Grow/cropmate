import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "edge";

type Body = {
  plant?: string;
  symptoms_text: string;
  diagnosis?: string;
  photo_url?: string;
};

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: uErr } = await supabase.auth.getUser();
    if (uErr) {
      return NextResponse.json({ error: "Auth error", detail: uErr.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    if (!body?.symptoms_text || !body.symptoms_text.trim()) {
      return NextResponse.json({ error: "symptoms_text is required" }, { status: 400 });
    }

    const payload = {
      user_id: user.id,
      plant: body.plant || null,
      symptoms_text: body.symptoms_text.trim(),
      diagnosis: body.diagnosis || null,
      photo_url: body.photo_url || null,
    };

    const { data, error } = await supabase.from("observations").insert(payload).select("id").single();
    if (error) {
      return NextResponse.json({ error: "Insert failed", detail: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", detail: e?.message }, { status: 500 });
  }
}
