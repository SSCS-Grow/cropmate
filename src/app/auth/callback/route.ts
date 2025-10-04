import { NextResponse } from "next/server";
import { getSupabaseRoute } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await getSupabaseRoute();
    await supabase.auth.exchangeCodeForSession(code);
  }
  const redirectTo = searchParams.get("redirect_to") ?? "/";
  return NextResponse.redirect(new URL(redirectTo, req.url));
}
