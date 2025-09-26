import Link from "next/link";
import AdminGuard from "@/components/admin/AdminGuard";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await getSupabaseServer();

  const [{ data: pests }, { data: diseases }] = await Promise.all([
    supabase.from("pests").select("id, slug, name_da, category").order("name_da"),
    supabase.from("diseases").select("id, slug, name_da, pathogen").order("name_da"),
  ]);

  return (
    <AdminGuard title="Library (Pests & Diseases)">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Library</h1>
          <div className="flex gap-2">
            <Link href="/admin/library/pests/new" className="px-3 py-2 rounded-2xl border shadow">+ Pest</Link>
            <Link href="/admin/library/diseases/new" className="px-3 py-2 rounded-2xl border shadow">+ Disease</Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="font-semibold mb-3">Pests</h2>
            <ul className="space-y-1">
              {(pests ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between border rounded-xl p-3">
                  <div>
                    <div className="font-medium">{p.name_da}</div>
                    <div className="text-xs text-gray-500">{p.slug} {p.category ? `• ${p.category}` : ""}</div>
                  </div>
                  <Link href={`/admin/library/pests/${p.id}`} className="underline">Redigér</Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-3">Diseases</h2>
            <ul className="space-y-1">
              {(diseases ?? []).map((d) => (
                <li key={d.id} className="flex items-center justify-between border rounded-xl p-3">
                  <div>
                    <div className="font-medium">{d.name_da}</div>
                    <div className="text-xs text-gray-500">{d.slug} {d.pathogen ? `• ${d.pathogen}` : ""}</div>
                  </div>
                  <Link href={`/admin/library/diseases/${d.id}`} className="underline">Redigér</Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AdminGuard>
  );
}
