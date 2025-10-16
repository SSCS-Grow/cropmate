import { supabaseServer } from "@/lib/supabase/server";
import PestForm from "@/components/library/PestForm";
import ImageUploader from "@/components/library/ImageUploader";

export default async function EditPest({ params }: { params: { id: string } }) {
  const supabase = await supabaseServer;
  const { data } = await (supabase as any)
  .from('pests')
  .select('*')
  .order('updated_at', { ascending: false });

  if (!data) return <div className="p-6">Ikke fundet</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold mb-4">Rediger</h1>
        <PestForm initial={data} />
      </div>
      <div>
        <h2 className="font-semibold mb-2">Billeder</h2>
        <ImageUploader pestId={data.id} onSaved={() => { /* router.refresh client-side */ }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {data.pest_images?.map((img: any) => (
            <img key={img.id} src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pests/${img.path}`} alt={img.alt||data.name} className="rounded-xl"/>
          ))}
        </div>
      </div>
    </div>
  );
}
