import { createClient } from '@/lib/supabase/server';

// 💡 Minimal type til netop den SELECT du laver på siden
type PestImageRow = { id: string; url: string; caption?: string | null };
type PestRow = {
  id: string;
  slug: string;
  category: 'pest' | 'disease';
  name: string;
  latin_name?: string | null;
  description?: string | null;
  pest_images?: PestImageRow[]; // relation hvis du laver select('*, pest_images(*)')
};

export default async function LibraryDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  // 👇 slå generics fra omkring .from(...) og cast data bagefter
  const { data, error } = await (supabase as any)
    .from('pests')
    .select('*, pest_images(*)')
    .eq('slug', params.slug)
    .single();

  if (error) {
    return <div className="p-4">Kunne ikke hente: {error.message}</div>;
  }

  const pest = (data ?? null) as PestRow | null;
  if (!pest) {
    return <div className="p-4">Ikke fundet.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{pest.category}</div>
      <h1 className="text-2xl font-bold">{pest.name}</h1>

      {pest.latin_name && (
        <div className="text-gray-600 italic">
          {pest.latin_name}
        </div>
      )}

      {pest.description && (
        <p className="text-gray-800">
          {pest.description}
        </p>
      )}

      {!!(pest.pest_images?.length) && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {pest.pest_images!.map((img) => (
            <figure key={img.id} className="rounded-xl overflow-hidden border bg-white">
              {/* antag at url allerede er public; ellers brug getPublicUrl logic */}
              <img src={img.url} alt={img.caption ?? pest.name} className="w-full h-40 object-cover" />
              {img.caption && <figcaption className="text-xs p-2 text-gray-600">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
