import { getSupabaseServer } from "@/lib/supabase/server";

export default async function DebugAuth() {
  const supabase = getSupabaseServer();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  let profile: any = null;
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,is_admin,username")
      .eq("id", user.id)
      .maybeSingle();
    profile = data ?? null;
    if (error) console.error("profiles error", error);
  }

  return (
    <pre className="p-4 text-sm overflow-auto">
      {JSON.stringify({ userErr, user, profile }, null, 2)}
    </pre>
  );
}
