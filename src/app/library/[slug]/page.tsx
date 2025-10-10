import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PestDetail({ params }: { params: { slug: string } }) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("pests").select("*, pest_images(*)").eq("slug", params.slug).single();

  if (!data) return <div className="p-6">Ikke fundet</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="text-sm uppercase opacity-60">{data.category === "pest" ? "Skadedyr" : "Sygdom"}</div>
      <h1 className="text-3xl font-bold">{data.name}</h1>
      {data.latin_name && <div className="italic opacity-75">{data.latin_name}</div>}
      <div className="mt-4 prose max-w-none">{data.description}</div>
      {Array.isArray(data.pest_images) && data.pest_images.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
          {data.pest_images.map((img: any) => (
            <img key={img.id} src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pests/${img.path}`} alt={img.alt || data.name} className="rounded-xl"/>
          ))}
        </div>
      )}
    </div>
  );
}
