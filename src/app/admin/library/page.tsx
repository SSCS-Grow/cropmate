import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ThreatRow = {
  id: string;
  slug: string | null;
  name_common: string;
  type: 'pest' | 'disease';
  category:
    | 'insect' | 'mite' | 'nematode' | 'weed'
    | 'fungus' | 'bacteria' | 'virus' | 'physiological' | 'other';
  updated_at: string;
};

export default async function AdminLibrary() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (profileErr || !profile?.is_admin) redirect('/');

  const { data, error } = await supabase
    .from('threats')
    .select('id,slug,name_common,type,category,updated_at')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    return <div className="p-4 text-red-600">Fejl: {error.message}</div>;
  }

  const rows = (data ?? []) as ThreatRow[];

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bibliotek (admin)</h1>
        <Link href="/admin/library/new" className="px-3 py-2 rounded bg-black text-white">Ny</Link>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Navn</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Kategori</th>
              <th className="text-left p-2">Opdateret</th>
              <th className="text-left p-2">Handling</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: ThreatRow) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.name_common}</td>
                <td className="p-2">{row.type}</td>
                <td className="p-2">{row.category}</td>
                <td className="p-2">{new Date(row.updated_at).toLocaleString()}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Link className="text-blue-600 hover:underline" href={`/admin/library/${row.id}`}>Redigér</Link>
                    <Link className="text-gray-600 hover:underline" href={`/library/${row.slug ?? row.id}`}>Vis</Link>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-2 text-gray-500" colSpan={5}>Ingen poster endnu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
