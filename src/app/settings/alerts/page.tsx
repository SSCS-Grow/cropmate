import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AlertsSettingsPage() {
   const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: prefs } = await supabase.from('alert_prefs').select('*').eq('user_id', user.id).single();

  async function save(formData: FormData) {
    'use server';
    const supa = await createClient();
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return;
    const payload = {
      user_id: user.id,
      frost_enabled: !!formData.get('frost_enabled'),
      frost_threshold_c: Number(formData.get('frost_threshold_c') || 0),
      water_enabled: !!formData.get('water_enabled'),
      water_dry_days: Number(formData.get('water_dry_days') || 3),
      locale: (formData.get('locale') as string) || 'da'
    };
    await supa.from('alert_prefs').upsert(payload);
  }

  return (
    <form action={save} className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Notifikationer</h1>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="frost_enabled" defaultChecked={prefs?.frost_enabled ?? true} />
        <span>Frostvarsel aktiveret</span>
      </label>

      <label className="block">
        <span className="block text-sm text-gray-600">Frost-tærskel (°C)</span>
        <input name="frost_threshold_c" type="number" defaultValue={prefs?.frost_threshold_c ?? 0}
               className="mt-1 w-32 rounded border p-2" />
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="water_enabled" defaultChecked={prefs?.water_enabled ?? true} />
        <span>Vandingspåmindelse aktiveret</span>
      </label>

      <label className="block">
        <span className="block text-sm text-gray-600">Tørre dage i træk</span>
        <input name="water_dry_days" type="number" defaultValue={prefs?.water_dry_days ?? 3}
               className="mt-1 w-32 rounded border p-2" />
      </label>

      <label className="block">
        <span className="block text-sm text-gray-600">Sprog</span>
        <select name="locale" defaultValue={prefs?.locale ?? 'da'} className="mt-1 rounded border p-2">
          <option value="da">Dansk</option>
          <option value="en">English</option>
        </select>
      </label>

      <button className="px-4 py-2 rounded bg-emerald-600 text-white">Gem</button>
    </form>
  );
}
