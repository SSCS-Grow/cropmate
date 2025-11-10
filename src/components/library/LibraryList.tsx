'use client';

import Image from 'next/image';
import Link from 'next/link';
import useCachedFetch from '@/hooks/useCachedFetch';
import { getPublicThumbUrl } from '@/lib/supabaseThumb';

type LibraryItem = {
  id: string;
  name: string;
  image_path?: string;
};

// Removed unused fetchLibrary function as useCachedFetch handles fetching internally

export default function LibraryList() {
  const { data, loading, error } = useCachedFetch<LibraryItem[]>(
    'library-list',
    '/api/library',
  );

  if (loading) return <p className="p-4">Henter data ...</p>;
  if (error) return <p className="p-4 text-red-500">Kunne ikke hente data</p>;
  if (!data?.length) return <p className="p-4">Ingen elementer fundet</p>;

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {data.map((item) => (
        <li
          key={item.id}
          className="rounded-2xl shadow bg-white overflow-hidden"
        >
          <Link href={`/library/${item.id}`}>
            <div className="relative aspect-video">
              {item.image_path ? (
                <Image
                  src={getPublicThumbUrl(item.image_path, 400)}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              ) : (
                <div className="h-full w-full bg-slate-200 flex items-center justify-center text-slate-400">
                  Ingen billede
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-base font-medium">{item.name}</h3>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
