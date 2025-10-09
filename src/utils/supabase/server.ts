// src/utils/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Synkron server-klient til Supabase (kompatibel med eksisterende brug: supabase.from(...))
 * Bemærk: next/headers.cookies() er synkron i den stabile API vi bruger her.
 */
export function createClient(): SupabaseClient {
  // cookies() returns a Promise, so we need to handle it asynchronously
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        // På serversiden sætter/fjerner vi typisk cookies via NextResponse i route handlers.
        set(_name: string, _value: string, _options: CookieOptions) {
          /* no-op */
        },
        remove(_name: string, _options: CookieOptions) {
          /* no-op */
        },
      },
    }
  );
}

/** BAKKOMPAT: mange filer kalder dette navn */
export function getSupabaseServer(): SupabaseClient {
  return createClient();
}

/**
 * BAKKOMPAT: returnér { supabase, user, isAdmin }
 * - checker user_metadata.is_admin
 * - checker app_metadata.roles inkluderer 'admin'
 * - fallback: profiles.is_admin (hvis tabellen findes)
 */
export async function getUserAndAdmin(): Promise<{
  supabase: SupabaseClient;
  user: (User & { email?: string | null }) | null;
  isAdmin: boolean;
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, isAdmin: false };
  }

  let isAdmin =
    (user.user_metadata as any)?.is_admin === true ||
    (Array.isArray((user.app_metadata as any)?.roles) &&
      (user.app_metadata as any).roles.includes('admin'));

  if (!isAdmin) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.is_admin === true) isAdmin = true;
    } catch {
      // ignorer manglende tabel/RLS
    }
  }

  return { supabase, user, isAdmin };
}
