import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Next.js 15: cookies() er async, så vi gør helperen async og
 * lukker over en synkron cookieStore (ReadonlyRequestCookies).
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );
}

/** 🔁 Legacy aliaser (bagudkompatibilitet) */
export async function supabaseServer() {
  return createSupabaseServer();
}

/** Nogle filer importerer `createClient` fra denne sti – giv dem et alias */
export const createClient = createSupabaseServer;
