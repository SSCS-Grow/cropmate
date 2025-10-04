import { listThreats } from '@/lib/supabase/queries/threats';
import ThreatFilters from '@/components/library/ThreatFilters';
import ThreatCard from '@/components/library/ThreatCard';

export const dynamic = 'force-dynamic';

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: 'pest' | 'disease'; category?: string };
}) {
  const items = await listThreats({
    q: searchParams?.q,
    type: searchParams?.type,
    category: searchParams?.category,
    limit: 200,
  });

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Skadedyr & Sygdomme</h1>
      </div>

      <ThreatFilters initialQuery={searchParams?.q} initialType={searchParams?.type} initialCategory={searchParams?.category} />

      {items.length === 0 ? (
        <p className="text-muted-foreground">Ingen resultater. Prøv at justere filtre eller søgning.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => (
            <ThreatCard key={t.id} threat={t} />
          ))}
        </div>
      )}
    </div>
  );
}
