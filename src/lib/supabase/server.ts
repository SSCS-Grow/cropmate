import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { assertSupabaseEnv } from "@/lib/env";

/** Primær helper */
export async function createSupabaseServer() {
  const { url, anon } = assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value ?? "";
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}

/** Bagudkompatible, statiske navngivne exports (Turbopack kan se dem) */
export async function createClient() {
  return createSupabaseServer();
}

export async function supabaseServer() {
  return createSupabaseServer();
}
