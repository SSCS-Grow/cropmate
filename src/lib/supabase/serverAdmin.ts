import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let cached: ReturnType<typeof createSupabaseClient> | null = null;

export function createServiceClient() {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !service) throw new Error('Mangler env: NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY');
  cached = createSupabaseClient(url, service, { auth: { persistSession: false } });
  return cached;
}