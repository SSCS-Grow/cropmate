export function assertSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Check your .env.local and restart the dev server."
    );
  }
  if (!/^https:\/\/.*\.supabase\.co$/.test(url)) {
    throw new Error(`[Supabase] NEXT_PUBLIC_SUPABASE_URL looks invalid: ${url}`);
  }
  return { url, anon };
}
