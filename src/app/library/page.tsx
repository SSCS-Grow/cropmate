import { supabaseServer } from "@/lib/supabase/server";
import PestCard from "@/components/library/PestCard";

export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const supabase = await supabaseServer();
  let query = supabase.from("pests").select("*").order("name");
  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  if (searchParams.category) query = query.eq("category", searchParams.category);
  const { data } = await query;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Skadedyr & sygdomme</h1>
      {/* simple filter UI */}
      {/* ... */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((d) => <PestCard key={d.id} item={d} />)}
      </div>
    </div>
  );
}
