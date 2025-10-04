import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/** RSC/Server Components – async-kompatibel cookie-adapter */
export function createClient(): SupabaseClient {
  // Kan være ReadonlyRequestCookies ELLER Promise<ReadonlyRequestCookies> afhængigt af Next-version
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Alle tre metoder er async for at håndtere Promise-varianten
        async get(name: string) {
          const store = await cookieStore as any;
          return store.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          const store = await cookieStore as any;
          // Next cookies API: set({ name, value, ...options })
          store.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          const store = await cookieStore as any;
          store.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  ) as unknown as SupabaseClient;
}

/** Server Actions / Route Handlers – må skrive cookies (samme adapter) */
export function createActionClient(): SupabaseClient {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const store = await cookieStore as any;
          return store.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          const store = await cookieStore as any;
          store.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          const store = await cookieStore as any;
          store.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  ) as unknown as SupabaseClient;
}

/** Alias-eksports, så dine gamle imports virker */
export const getSupabaseServer = createClient;
export const getSupabaseRoute = createActionClient;

/** Hjælper til user + admin-flag */
export async function getUserAndAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  return { user, isAdmin: !!profile?.is_admin };
}
