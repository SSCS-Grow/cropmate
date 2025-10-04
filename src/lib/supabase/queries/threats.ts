import { createClient } from '@/lib/supabase/server';
import { Threat, ThreatWithJoins } from '@/lib/types/threats';

export async function listThreats(opts?: {
  q?: string;
  type?: 'pest' | 'disease';
  category?: string;
  cropId?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  let q = supabase.from('threats').select('*, threat_images(*), threat_symptoms(*), threat_crops(crop_id, crops(name))', { count: 'exact' }).order('name_common');

  if (opts?.type) q = q.eq('type', opts.type);
  if (opts?.category) q = q.eq('category', opts.category);
  if (opts?.q) {
    q = q.or(`name_common.ilike.%${opts.q}%,name_latin.ilike.%${opts.q}%`);
  }
  if (opts?.cropId) {
    q = q.contains('threat_crops', [{ crop_id: opts.cropId }]); // fallback hvis PostgREST ikke kan, vi filtrerer clientside ellers
  }

  const { data, error } = await q.limit(opts?.limit ?? 200);
  if (error) throw error;

  // map til fladt format
  const items = (data ?? []).map((t: any) => ({
    ...t,
    images: t.threat_images ?? [],
    symptoms: t.threat_symptoms ?? [],
    crops: (t.threat_crops ?? []).map((tc: any) => ({ crop_id: tc.crop_id, name: tc.crops?.name })),
  })) as ThreatWithJoins[];

  return items;
}

export async function getThreatById(idOrSlug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('threats')
    .select('*, threat_images(*), threat_symptoms(*), threat_crops(crop_id, crops(name))')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .single();

  if (error) throw error;

  const item: ThreatWithJoins = {
    ...data,
    images: data.threat_images ?? [],
    symptoms: data.threat_symptoms ?? [],
    crops: (data.threat_crops ?? []).map((tc: any) => ({ crop_id: tc.crop_id, name: tc.crops?.name })),
  };
  return item;
}
