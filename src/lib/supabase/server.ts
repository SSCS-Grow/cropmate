import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let cached: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error('Supabase env mangler: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY');
  cached = createSupabaseClient(url, anon, { auth: { persistSession: false } });
  return cached;
}

// ✅ Gør den kompatibel med legacy-kald som `supabaseServer()`
export function supabaseServer() {
  return createClient();
}
