export default function EnvDebug() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "(undefined)";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "(undefined)";
  return (
    <pre className="p-4 text-sm">
      {JSON.stringify({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? anon.slice(0,6) + "…(masked)" : "(undefined)",
      }, null, 2)}
    </pre>
  );
}
