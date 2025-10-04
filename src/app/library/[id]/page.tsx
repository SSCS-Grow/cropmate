import { getThreatById } from '@/lib/supabase/queries/threats';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ThreatDetailPage({ params }: { params: { id: string } }) {
  const t = await getThreatById(params.id);

  const cover = t.images?.[0]?.path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${t.images[0].path}`
    : null;

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/library" className="text-sm text-blue-600 hover:underline">← Til oversigt</Link>
      </div>

      <div className="rounded-xl border overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={t.name_common} className="h-56 w-full object-cover" />
        ) : (
          <div className="h-56 w-full bg-gray-100 grid place-items-center text-gray-400">Ingen billede</div>
        )}
        <div className="p-5 space-y-2">
          <div className="text-xs uppercase text-gray-500">{t.type} · {t.category}</div>
          <h1 className="text-2xl font-semibold">{t.name_common}{t.name_latin ? <span className="italic text-gray-600 font-normal"> — {t.name_latin}</span> : null}</h1>
          {t.summary && <p className="text-gray-700">{t.summary}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          {t.description_md && (
            <article className="prose max-w-none">
              <h2>Kendetegn & Beskrivelse</h2>
              <Markdown>{t.description_md}</Markdown>
            </article>
          )}
          {t.life_cycle_md && (
            <article className="prose max-w-none">
              <h2>Livscyklus</h2>
              <Markdown>{t.life_cycle_md}</Markdown>
            </article>
          )}
          {t.management_md && (
            <article className="prose max-w-none">
              <h2>Håndtering</h2>
              <Markdown>{t.management_md}</Markdown>
            </article>
          )}

          {t.symptoms?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Symptomer</h2>
              <ul className="space-y-2">
                {t.symptoms.map(s => (
                  <li key={s.id} className="border rounded-lg p-3">
                    <div className="text-sm text-gray-500">{s.stage ?? '—'} {s.severity ? `· sværhed ${s.severity}/5` : ''}</div>
                    <div className="font-medium">{s.title}</div>
                    {s.description && <p className="text-sm text-gray-700">{s.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Relaterede observationer (hazard_reports) */}
          <RelatedReports threatId={t.id} />
        </section>

        <aside className="space-y-4">
          {t.crops?.length > 0 && (
            <div className="border rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Relaterede afgrøder</div>
              <ul className="text-sm space-y-1">
                {t.crops.map(c => (
                  <li key={c.crop_id}>• {c.name ?? c.crop_id}</li>
                ))}
              </ul>
            </div>
          )}

          {t.images?.length > 0 && (
            <div className="border rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Billeder</div>
              <div className="grid grid-cols-2 gap-2">
                {t.images.map(img => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id}
                       src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${img.path}`}
                       alt={img.caption ?? t.name_common}
                       className="rounded-md object-cover aspect-square" />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Markdown({ children }: { children: string }) {
  // Minimal safe markdown renderer (uden ekstern lib)
  return <div dangerouslySetInnerHTML={{ __html: children
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n$/gim, '<br />')
  }} />;
}

async function RelatedReports({ threatId }: { threatId: string }) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('hazard_reports')
    .select('id, created_at, status, latitude, longitude, photo_url')
    .eq('threat_id', threatId)
    .neq('status', 'hidden')
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) return null;

  if (!data || data.length === 0) {
    return (
      <div className="border rounded-lg p-3">
        <div className="text-sm font-medium">Seneste observationer</div>
        <p className="text-sm text-gray-600">Ingen knyttede observationer endnu.</p>
      </div>
    );
  }

  type HazardReport = {
    id: string;
    created_at: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    photo_url: string | null;
  };

  return (
    <div className="border rounded-lg p-3">
      <div className="text-sm font-medium mb-2">Seneste observationer</div>
      <ul className="space-y-2">
        {data.map((r: HazardReport) => (
          <li key={r.id} className="flex items-center gap-3">
            {r.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.photo_url} alt="" className="w-12 h-12 rounded object-cover" />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-100" />
            )}
            <div className="text-sm">
              <div className="font-medium">{new Date(r.created_at).toLocaleDateString()}</div>
              <div className="text-gray-600">{r.status}</div>
              <div className="text-gray-500">({r.latitude?.toFixed?.(3)}, {r.longitude?.toFixed?.(3)})</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
