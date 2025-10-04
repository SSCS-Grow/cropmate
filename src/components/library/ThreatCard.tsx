import Link from 'next/link';
import { ThreatWithJoins } from '@/lib/types/threats';

export default function ThreatCard({ threat }: { threat: ThreatWithJoins }) {
  const img = threat.images?.[0]?.path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${threat.images[0].path}`
    : null;

  return (
    <Link href={`/library/${threat.slug ?? threat.id}`} className="group block">
      <div className="rounded-xl border hover:shadow-md transition overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={threat.name_common} className="h-40 w-full object-cover" />
        ) : (
          <div className="h-40 w-full bg-gray-100 grid place-items-center text-gray-400">Ingen billede</div>
        )}
        <div className="p-3 space-y-1">
          <div className="text-xs uppercase text-gray-500">{threat.type} · {threat.category}</div>
          <div className="font-medium">{threat.name_common}</div>
          {threat.name_latin && <div className="text-sm italic text-gray-600">{threat.name_latin}</div>}
          {threat.summary && <p className="text-sm text-gray-700 line-clamp-2">{threat.summary}</p>}
          <div className="flex gap-3 text-xs text-gray-500 pt-1">
            <span>{threat.images?.length ?? 0} billeder</span>
            <span>{threat.symptoms?.length ?? 0} symptomer</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
