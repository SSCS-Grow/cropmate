import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ThreatForm from '@/components/library/ThreatForm';

export const dynamic = 'force-dynamic';

export default async function NewThreatPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (profileErr || !profile?.is_admin) redirect('/');

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Ny trussel</h1>
      <ThreatForm onSaved={(id) => redirect(`/admin/library/${id}`)} />
    </div>
  );
}
