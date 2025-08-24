'use client';
import supabaseBrowser from '@/lib/supabaseBrowser';
import { useEffect, useState } from 'react';


export default function Crops() {
const supabase = supabaseBrowser();
const [crops, setCrops] = useState<any[]>([]);
const [adding, setAdding] = useState<string | null>(null);


useEffect(() => {
(async () => {
const { data } = await supabase.from('crops').select('*').order('name');
setCrops(data || []);
})();
}, [supabase]);


const addToGarden = async (cropId: string) => {
setAdding(cropId);
const { data: session } = await supabase.auth.getSession();
const user = session.session?.user;
if (!user) return;
await supabase.from('user_crops').insert({ user_id: user.id, crop_id: cropId, planted_on: new Date().toISOString().slice(0,10) });
setAdding(null);
alert('Tilføjet til din have/mark');
};


return (
<div className="grid gap-4">
<h2 className="text-xl font-semibold">Afgrødekatalog</h2>
<ul className="grid gap-3">
{crops.map((c) => (
<li key={c.id} className="p-3 bg-white rounded-lg shadow">
<div className="flex items-center justify-between">
<div>
<h3 className="font-medium">{c.name}</h3>
<p className="text-sm opacity-70">{c.scientific_name}</p>
</div>
<button disabled={adding===c.id} onClick={() => addToGarden(c.id)} className="px-3 py-2 rounded bg-slate-900 text-white text-sm">
{adding===c.id ? 'Tilføjer…' : 'Tilføj'}
</button>
</div>
{c.description && <p className="text-sm mt-2 opacity-90">{c.description}</p>}
</li>
))}
</ul>
</div>
);
}