import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ThreatForm from '@/components/library/ThreatForm';
import ThreatImageUploader from '@/components/library/ThreatImageUploader';

export const dynamic = 'force-dynamic';

export default async function EditThreatPage({ params }: { params: { id: string } }) {
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
    .select('*')
    .or(`id.eq.${params.id},slug.eq.${params.id}`)
    .single();

  if (error || !data) notFound();

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Redigér: {data.name_common}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ThreatForm initial={data} submitLabel="Opdater" onSaved={() => { /* stay */ }} />
        </div>
        <aside className="space-y-4">
          <ThreatImageUploader threatId={data.id} />
        </aside>
      </div>
    </div>
  );
}
