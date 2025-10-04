import { listThreats } from '@/lib/supabase/queries/threats';
import ThreatFilters from '@/components/library/ThreatFilters';
import ThreatCard from '@/components/library/ThreatCard';

export const dynamic = 'force-dynamic';

type SearchParams = {
  q?: string | string[];
  type?: string | string[];
  category?: string | string[];
};

export default async function LibraryPage({
  searchParams,
}: {
  // ⬅️ I Next 15 er searchParams en Promise
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  // Hent enkeltværdi hvis der (teoretisk) kommer arrays
  const q = (Array.isArray(sp?.q) ? sp.q[0] : sp?.q) ?? undefined;
  const typeParam = (Array.isArray(sp?.type) ? sp.type[0] : sp?.type) ?? undefined;
  const categoryParam = (Array.isArray(sp?.category) ? sp.category[0] : sp?.category) ?? undefined;

  // Valider type til vores union
  const type = typeParam === 'pest' || typeParam === 'disease' ? (typeParam as 'pest' | 'disease') : undefined;

  const items = await listThreats({
    q,
    type,
    category: categoryParam,
    limit: 200,
  });

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Skadedyr & Sygdomme</h1>
      </div>

      <ThreatFilters
        initialQuery={q}
        initialType={type}
        initialCategory={categoryParam}
      />

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
