import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewThreatPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) redirect('/');

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Ny trussel</h1>
      <Form />
    </div>
  );
}

function Form() {
  return (
    <form action={save} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Type</label>
          <select name="type" className="w-full border rounded-lg px-3 py-2" required>
            <option value="pest">Skadedyr</option>
            <option value="disease">Sygdom</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Kategori</label>
          <select name="category" className="w-full border rounded-lg px-3 py-2" required>
            <option>insect</option><option>mite</option><option>nematode</option><option>weed</option>
            <option>fungus</option><option>bacteria</option><option>virus</option><option>physiological</option><option>other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm">Dansk navn</label>
        <input name="name_common" className="w-full border rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label className="text-sm">Latinsk navn</label>
        <input name="name_latin" className="w-full border rounded-lg px-3 py-2" />
      </div>
      <div>
        <label className="text-sm">Kort resume</label>
        <textarea name="summary" className="w-full border rounded-lg px-3 py-2" rows={2} />
      </div>
      <div>
        <label className="text-sm">Kendetegn (Markdown)</label>
        <textarea name="description_md" className="w-full border rounded-lg px-3 py-2" rows={5} />
      </div>
      <div>
        <label className="text-sm">Livscyklus (Markdown)</label>
        <textarea name="life_cycle_md" className="w-full border rounded-lg px-3 py-2" rows={4} />
      </div>
      <div>
        <label className="text-sm">Håndtering (Markdown)</label>
        <textarea name="management_md" className="w-full border rounded-lg px-3 py-2" rows={4} />
      </div>
      <button className="px-4 py-2 rounded-lg bg-black text-white">Gem</button>
    </form>
  );
}

async function save(formData: FormData) {
  'use server';
  const supabase = createClient();
  const payload = {
    type: formData.get('type'),
    category: formData.get('category'),
    name_common: formData.get('name_common'),
    name_latin: formData.get('name_latin'),
    summary: formData.get('summary'),
    description_md: formData.get('description_md'),
    life_cycle_md: formData.get('life_cycle_md'),
    management_md: formData.get('management_md'),
  };
  const { error } = await supabase.from('threats').insert(payload);
  if (error) throw error;
  return { ok: true };
}
