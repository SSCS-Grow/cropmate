import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminLibrary() {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("pests").select("*").order("updated_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Bibliotek (Admin)</h1>
        <Link className="btn btn-primary" href="/admin/library/new">Ny post</Link>
      </div>
      <div className="divide-y">
        {data?.map((d) => (
          <div key={d.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{d.name}</div>
              <div className="text-sm opacity-70">{d.category} • {d.slug}</div>
            </div>
            <div className="flex gap-2">
              <Link className="btn btn-sm" href={`/admin/library/${d.id}/edit`}>Rediger</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
