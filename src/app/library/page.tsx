import { createClient } from "@/lib/supabase/server";

type SP = { q?: string };

export default async function LibraryIndexPage({
  searchParams,
}: {
  searchParams: Promise<SP>; // 👈 Next 15: async
}) {
  const sp = await searchParams;         // 👈 await den
  const supabase = await createClient(); // (din alias fra server-helper)
  const q = (sp?.q ?? "").trim();

  let query = (supabase as any)
    .from("pests")
    .select("id, name, slug, short_description, cover_image_url")
    .order("name", { ascending: true })
    .limit(50);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return <div className="p-6">Fejl: {error.message}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Bibliotek</h1>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          placeholder="Søg…"
          defaultValue={q}
          className="border rounded-xl p-2 flex-1"
        />
        <button className="rounded-xl px-4 py-2 border">Søg</button>
      </form>

      <ul className="grid gap-3">
        {data?.map((p: any) => (
          <li key={p.id} className="border rounded-xl p-3">
            <a href={`/library/${p.slug}`} className="font-medium hover:underline">
              {p.name}
            </a>
            {p.short_description && (
              <div className="text-sm text-gray-600">{p.short_description}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
