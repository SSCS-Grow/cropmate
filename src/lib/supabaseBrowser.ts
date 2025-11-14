// src/lib/supabaseBrowser.ts
'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export default function supabaseBrowser(): SupabaseClient {
  // Må ALDRIG kaldes på serveren.
  if (typeof window === 'undefined') {
    throw new Error('supabaseBrowser() must only be used in the browser');
  }

  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Kast en læsbar fejl i stedet for at crashe i en auth-subscriber
    console.warn(
      'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
    throw new Error('Supabase env vars mangler. Tjek din .env.local');
  }

  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // stabilt i Next dev
    },
    global: { fetch: typeof fetch !== 'undefined' ? fetch : undefined },
  });

  return _client;
}
