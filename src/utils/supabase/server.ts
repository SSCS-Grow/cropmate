import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export function createClient(): SupabaseClient {
  // Nogle Next-typer siger cookies(): Promise<ReadonlyRequestCookies>.
  // Vi kalder den via any for at holde funktionen synkron.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookieStore: any = (cookies as unknown as () => any)();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore?.get?.(name)?.value;
        },
        set(_name: string, _value: string, _opts: CookieOptions) {
          /* no-op on server */
        },
        remove(_name: string, _opts: CookieOptions) {
          /* no-op on server */
        },
      },
    }
  );
}

export function getSupabaseServer(): SupabaseClient {
  return createClient();
}

export async function getUserAndAdmin(): Promise<{
  supabase: SupabaseClient;
  user: (User & { email?: string | null }) | null;
  isAdmin: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, isAdmin: false };

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
      // ignorer hvis tabel ikke findes
    }
  }
  return { supabase, user, isAdmin };
}
