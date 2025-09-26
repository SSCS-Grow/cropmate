// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { getSupabaseRoute } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = getSupabaseRoute();
    // Bytter Supabase "code" til en session og skriver cookies server-side
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Send brugeren et sted hen efter login
  const redirectTo = searchParams.get("redirect_to") ?? "/";
  return NextResponse.redirect(new URL(redirectTo, req.url));
}
