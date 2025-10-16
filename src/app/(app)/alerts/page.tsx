import RuleForm from '@/components/alerts/RuleForm';
import { createClient } from '@/lib/supabase/server';

type RuleRow = {
  id: string;
  name: string;
  channel: string;
  last_fired_at: string | null;
  created_at?: string;
};

export default async function AlertsPage() {
  const supabase = createClient();
  const { data: rules } = await supabase
    .from('alert_rules')
    .select('*')
    .order('created_at', { ascending: false }) as { data: RuleRow[] | null };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Alerts</h1>
      <RuleForm />
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Dine regler</h2>
        {(rules ?? []).map((r: RuleRow) => (
          <div key={r.id} className="p-3 rounded-xl border bg-white flex items-center justify-between">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-gray-500">
                {r.channel} · sidst: {r.last_fired_at ?? '—'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
