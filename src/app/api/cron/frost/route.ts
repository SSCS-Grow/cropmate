import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const runtime = 'nodejs';


export async function GET() {
const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


// 1) Hent alle profiler med lokation
const { data: profiles, error } = await supabase
.from('profiles')
.select('id, latitude, longitude')
.not('latitude', 'is', null)
.not('longitude', 'is', null);


if (error) return NextResponse.json({ error: error.message }, { status: 500 });


const now = new Date();
const until = new Date(Date.now() + 24 * 60 * 60 * 1000);


for (const p of profiles || []) {
try {
const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&hourly=temperature_2m&timezone=Europe%2FCopenhagen`;
const res = await fetch(url);
const json = await res.json();
const hours: string[] = json.hourly?.time || [];
const temps: number[] = json.hourly?.temperature_2m || [];


// Find minimum temp i næste 24 timer
let frost = false;
for (let i = 0; i < hours.length; i++) {
const t = new Date(hours[i]);
if (t >= now && t <= until && temps[i] <= 0) { frost = true; break; }
}


if (frost) {
await supabase.from('alerts').insert({
user_id: p.id,
type: 'frost',
severity: 3,
message: 'Frost risiko inden for 24 timer – beskyt følsomme planter.',
valid_from: now.toISOString(),
valid_to: until.toISOString()
});
}
} catch (e) {
console.error('frost check failed', e);
}
}


return NextResponse.json({ ok: true, checked: profiles?.length || 0 });
}