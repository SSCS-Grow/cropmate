import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const { endpoint, keys } = await req.json(); // keys: { p256dh, auth }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

  // Upsert på endpoint, så duplicate ikke fejler
  const { error } = await (supabase as any)
    .from("push_subscriptions")
    .upsert(
      { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: "endpoint", ignoreDuplicates: true }
    );

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
