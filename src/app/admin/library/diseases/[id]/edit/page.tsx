// src/app/admin/library/diseases/[id]/edit/page.tsx
import { supabaseServer } from "@/lib/supabase/server";

export default async function DiseaseEditPage({ params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("pests")
    .select("*, pest_images(*)")
    .eq("id", params.id)
    .single();

  if (error || !data) return <div className="p-6">Ikke fundet</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Rediger sygdom</h1>
      {/* indsæt din <PestForm initial={data} /> og <ImageUploader pestId={data.id} /> her hvis du bruger diseases-route */}
      <pre className="text-xs bg-gray-50 p-3 rounded">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
