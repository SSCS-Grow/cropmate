import { supabaseServer } from "@/lib/supabase/server";
import { sendPush } from "@/lib/push";

export async function POST() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { data: subs } = await supabase.from("push_subscriptions")
    .select("*").eq("user_id", user.id).limit(10);

  await Promise.all(
    (subs||[]).map(s => sendPush({
      endpoint: s.endpoint,
      keys: { p256dh: s.p256dh, auth: s.auth },
    }, { title: "CropMate test", body: "Push virker ✅", url: "/"}).catch(()=>null))
  );

  return Response.json({ ok: true, count: subs?.length || 0 });
}
