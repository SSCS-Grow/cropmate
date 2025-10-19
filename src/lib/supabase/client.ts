"use client";

import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv } from "@/lib/env";

// Hold kun EN instans i browseren (HMR-safe)
let _sb: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  const { url, anon } = assertSupabaseEnv();
  if (!_sb) {
    _sb = createBrowserClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // slå broadcast fra i dev for at undgå støj – supabase accepterer feltet
        // (nogle typer mangler i enkelte versioner; hvis TS klager, kan du fjerne linjen)
        // @ts-ignore
        multiTab: false,
      },
    });
  }
  return _sb;
}

// 🔁 Legacy alias så eksisterende imports virker:
// import { createClient } from "@/lib/supabase/client";
export const createClient = getSupabaseBrowser;
