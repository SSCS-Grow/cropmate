import { getSupabaseServer } from "@/lib/supabase/server";

export default async function DebugAuth() {
  const supabase = await getSupabaseServer();
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;
  const userErr = userRes.error ? {
    name: userRes.error.name,
    message: (userRes.error as any)?.message ?? String(userRes.error),
    status: (userRes.error as any)?.status ?? null,
  } : null;

  let profile: any = null;
  let profileRaw: any = null;

  if (user) {
    const res = await supabase
      .from("profiles")
      .select("id,is_admin,created_at,updated_at")
      .eq("id", user.id)
      .maybeSingle();

    profileRaw = {
      data: res.data,
      error: res.error ? {
        name: (res.error as any)?.name ?? null,
        message: (res.error as any)?.message ?? String(res.error),
        details: (res.error as any)?.details ?? null,
        hint: (res.error as any)?.hint ?? null,
        code: (res.error as any)?.code ?? null,
      } : null,
      status: (res as any)?.status ?? null,
    };

    profile = res.data ?? null;
  }

  return (
    <pre className="p-4 text-sm overflow-auto">
      {JSON.stringify({ userErr, user, profile, profileRaw }, null, 2)}
    </pre>
  );
}
