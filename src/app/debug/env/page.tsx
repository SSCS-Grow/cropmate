export default function EnvDebug() {
  return (
    <pre className="p-4 text-sm">
      {JSON.stringify(
        {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "(undef)",
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string).slice(0, 6) + "…(masked)"
              : "(undef)",
        },
        null,
        2
      )}
    </pre>
  );
}
